import { eq } from "drizzle-orm";

import { db, mediaklikkChannelCacheTable } from "#server/db/index.ts";
import { env } from "#server/utils/env.ts";
import { logger } from "#server/utils/logger.ts";

interface Channel {
  displayName: string;
  description: string;
  poster: string;
  mediaklikkId: string;
}

const channels = {
  m1: {
    displayName: "M1",
    description: "M1 is a Hungarian public television channel.",
    poster: "/m1-poster.jpg",
    mediaklikkId: "mtv1live",
  },
  m2: {
    displayName: "M2",
    description: "M2 is a Hungarian public television channel.",
    poster: "/m2-poster.jpg",
    mediaklikkId: "mtv2live",
  },
  m4: {
    displayName: "M4 Sport",
    description: "M4 Sport is a Hungarian public television channel.",
    poster: "/m4-poster.jpg",
    mediaklikkId: "mtv4live",
  },
  m5: {
    displayName: "M5",
    description: "M5 is a Hungarian public television channel.",
    poster: "/m5-poster.jpg",
    mediaklikkId: "mtv5live",
  },
  duna: {
    displayName: "Duna TV",
    description: "Duna TV is a Hungarian public television channel.",
    poster: "/duna-poster.jpg",
    mediaklikkId: "dunalive",
  },
} satisfies Record<string, Channel>;

export type ChannelId = keyof typeof channels;

export function isChannelId(value: string): value is ChannelId {
  return value in channels;
}

export function getChannel(channelId: ChannelId): Channel {
  return channels[channelId];
}

type PlayData =
  | {
      file: string;
      type: "hls";
    }
  | {
      file: string;
      type: "dash";
      drm: {
        widevine: {
          url: string;
          serverCertificateUrl: string;
        };
      };
    };

async function getPlayDataForChannel(channelId: ChannelId): Promise<PlayData[] | null> {
  const { mediaklikkId } = channels[channelId];

  const sourceUrl = `https://mediaklikk.hu/elo/${mediaklikkId}/`;
  const playerUrl =
    "https://player.mediaklikk.hu/playernew/player.php" +
    `?video=${encodeURIComponent(mediaklikkId)}` +
    `&contentid=${encodeURIComponent(mediaklikkId)}` +
    `&sourceUrl=${encodeURIComponent(sourceUrl)}`;

  try {
    const res = await fetch(playerUrl, {
      headers: { Referer: sourceUrl },
    });
    if (!res.ok) {
      throw new Error(`Incorrect response status: ${res.status} ${res.statusText}`);
    }
    const html = await res.text().catch((err) => {
      throw new Error(`Failed to read player bootstrap response`, { cause: err });
    });

    const playDataMatch = html.match(/var\s+playData\s*=\s*(?<json>\[[\s\S]*?\]);/);
    if (!playDataMatch || !playDataMatch.groups || !playDataMatch.groups.json) {
      throw new Error('Player HTML does not contain "playData" variable');
    }
    const playData = JSON.parse(playDataMatch.groups.json) as PlayData[];
    return playData;
  } catch (err) {
    logger.error(`Failed to fetch play data for channel ${channelId}`, err as Error);
    return null;
  }
}

function getHlsUrlFromPlayData(playData: PlayData[]): string | null {
  const filteredPlayData = playData
    // Only keep HLS streams
    .filter((item) => item.type === "hls")
    // Remove any streams that have "bumper" in the file name
    .filter((item) => !item.file.match(/bumper/i));

  if (!filteredPlayData || filteredPlayData.length === 0) {
    return null;
  }
  if (filteredPlayData.length === 1 && filteredPlayData[0].type === "hls") {
    return filteredPlayData[0].file;
  }
  // If there are multiple HLS streams, return the one with the highest quality (assuming the last one is the highest quality)
  return filteredPlayData[filteredPlayData.length - 1].file;
}

export class MediaklikkTvSource {
  private channelRefreshes: Map<ChannelId, Promise<string | null>> = new Map();

  constructor() {
    // Periodically update the cache
    setInterval(this.getAvailableChannels.bind(this), env.MEDIAKLIKK_CACHE_TTL * 1000);
  }

  async getAvailableChannels(): Promise<Array<Channel & { id: ChannelId }>> {
    let availableChannels: Array<Channel & { id: ChannelId }> = [];
    for (const channelId of Object.keys(channels) as ChannelId[]) {
      const streamUrl = await this.getChannelStreamUrl(channelId);
      if (streamUrl) {
        availableChannels.push({ ...channels[channelId], id: channelId });
      }
    }
    return availableChannels;
  }

  async getChannelStreamUrl(channelId: ChannelId): Promise<string | null> {
    const cachedRow = db
      .select({
        url: mediaklikkChannelCacheTable.url,
        updatedAt: mediaklikkChannelCacheTable.updatedAt,
      })
      .from(mediaklikkChannelCacheTable)
      .where(eq(mediaklikkChannelCacheTable.channelId, channelId))
      .get();

    const cached = cachedRow ? { url: cachedRow.url, updatedAt: cachedRow.updatedAt } : undefined;
    const now = Date.now();
    const lastAcceptedDate = now - env.MEDIAKLIKK_CACHE_TTL * 1000;
    const isStale = cached && cached.updatedAt < lastAcceptedDate;
    if (cached && !isStale) {
      return cached.url;
    }

    const existingRefresh = this.channelRefreshes.get(channelId);
    if (existingRefresh) {
      return existingRefresh;
    }

    const refresh = this.refreshChannelUrl(channelId, cached);
    this.channelRefreshes.set(channelId, refresh);
    try {
      return await refresh;
    } finally {
      if (this.channelRefreshes.get(channelId) === refresh) {
        this.channelRefreshes.delete(channelId);
      }
    }
  }

  private async refreshChannelUrl(
    channelId: ChannelId,
    cached: { url: string; updatedAt: number } | undefined,
  ): Promise<string | null> {
    const lastStaleDate = Date.now() - env.MEDIAKLIKK_CACHE_MAX_STALE_TIME * 1000;
    const isTooStale = cached && cached.updatedAt < lastStaleDate;
    const playData = await getPlayDataForChannel(channelId);
    if (!playData) {
      // Expired cached is better than no URL at all
      return cached && !isTooStale ? cached.url : null;
    }
    const hlsUrl = getHlsUrlFromPlayData(playData);
    if (!hlsUrl) {
      // Expired cached is better than no URL at all
      return cached && !isTooStale ? cached.url : null;
    }
    db.insert(mediaklikkChannelCacheTable)
      .values([{ channelId, url: hlsUrl, updatedAt: Date.now() }])
      .onConflictDoUpdate({
        target: mediaklikkChannelCacheTable.channelId,
        set: {
          url: hlsUrl,
          updatedAt: Date.now(),
        },
      })
      .run();
    return hlsUrl;
  }
}
