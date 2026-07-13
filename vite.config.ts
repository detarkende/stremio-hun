import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [{ src: "drizzle/**/*", dest: "drizzle", rename: { stripBase: 1 } }],
      environment: "nitro",
    }),
    nitro({
      serverEntry: "src/server/index.ts",
      sourcemap: true,
      serverDir: "./server",
      output: {
        dir: "./dist",
      },
    }),
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/client/routes",
      generatedRouteTree: "src/client/routeTree.gen.ts",
    }),
    react(),
    basicSsl(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
