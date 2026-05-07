import type { Context, Hono } from "hono";
import type { ConnInfo } from "hono/conninfo";
import type { BlankEnv } from "hono/types";
import type { ServerOptions, ServerRuntimeContext } from "srvx";

interface SrvxAdapterOptions extends Omit<ServerOptions, "fetch"> {}

export interface Bindings {
  ip: string | undefined;
  runtime: ServerRuntimeContext | undefined;
}

export function srvxAdapter<Env extends { Bindings: Bindings } | BlankEnv>(
  app: Hono<Env>,
  options?: SrvxAdapterOptions,
): ServerOptions {
  return {
    ...options,
    fetch: function fetch(req) {
      const { ip, runtime } = req;
      const bindings = {
        ip,
        runtime,
      };
      return app.fetch(req, bindings);
    },
  };
}

export function getConnInfo(c: Context<{ Bindings: Bindings }>): ConnInfo {
  const env = c.env as Bindings;
  if (!env.runtime) {
    throw new Error("Runtime context is not available in the environment.");
  }

  if (env.runtime.name !== "node") {
    throw new Error(
      `Unsupported runtime: ${env.runtime.name}. This function is only supported in Node.js runtime.`,
    );
  }
  const incoming = env.runtime.node!.req;
  const address = incoming.socket.remoteAddress;
  const port = incoming.socket.remotePort;
  const family = incoming.socket.remoteFamily;
  return {
    remote: {
      address,
      port,
      addressType: family === "IPv4" ? "IPv4" : family === "IPv6" ? "IPv6" : void 0,
    },
  };
}
