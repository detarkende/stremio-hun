import { hc } from "hono/client";

import type { ApiType } from "#server/index.ts";

export const apiClient = hc<ApiType>(new URL("/api", window.location.origin).toString());
