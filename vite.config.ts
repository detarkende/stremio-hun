import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    nitro({
      serverEntry: "src/server/index.ts",
      sourcemap: true,
    }),
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/client/routes",
      generatedRouteTree: "src/client/routeTree.gen.ts",
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
