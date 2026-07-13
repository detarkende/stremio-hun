import { configure, getConsoleSink, getLogger, getJsonLinesFormatter } from "@logtape/logtape";

const isDevelopment = process.env.NODE_ENV === "development";

await configure({
  sinks: {
    console: getConsoleSink({
      formatter: isDevelopment
        ? (await import("@logtape/pretty")).getPrettyFormatter({ properties: true })
        : getJsonLinesFormatter(),
    }),
  },
  reset: isDevelopment,
  loggers: [
    { category: ["logtape", "meta"], sinks: ["console"], lowestLevel: "warning" },
    {
      category: "stremio-hun",
      sinks: ["console"],
    },
  ],
});

export const logger = getLogger("stremio-hun");
