import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  build: { rollupOptions: { input: 'src/main.tsx', output: { entryFileNames: 'assets/app.js', chunkFileNames: 'assets/[name].js', assetFileNames: (asset) => asset.names?.some((name) => name.endsWith('.css')) ? 'assets/app.css' : 'assets/[name][extname]' } } },
  server: {
    proxy: {
      "/aion-api/asset": {
        target: "https://assets.playnccdn.com",
        changeOrigin: true,
        rewrite: (p) => {
          const url = new URL(p, "http://local");
          const name = url.searchParams.get("name") || "";
          if (!/^[A-Za-z0-9_.-]+\.(png|webp)$/i.test(name)) return "/invalid";
          return `/static-aion2-gamedata/resources/${name}`;
        },
      },
      "/aion-api/search": {
        target: "https://api-search.plaync.com",
        changeOrigin: true,
        rewrite: (p) =>
          p
            .replace("/aion-api/search", "/aion2global/search/v2/character")
            .replace("nick=", "keyword=") + "&localeInfo=pt-BR",
      },
      "/aion-api/info": {
        target: "https://aion2.plaync.com",
        changeOrigin: true,
        rewrite: (p) =>
          p.replace("/aion-api/info", "/api/character/info") + "&lang=pt-BR",
      },
      "/aion-api/equipment": {
        target: "https://aion2.plaync.com",
        changeOrigin: true,
        rewrite: (p) =>
          p.replace("/aion-api/equipment", "/api/character/equipment") +
          "&lang=pt-BR",
      },
      "/aion-api/item": {
        target: "https://aion2.plaync.com",
        changeOrigin: true,
        rewrite: (p) =>
          p.replace("/aion-api/item", "/api/character/equipment/item") +
          "&lang=pt-BR",
      },
    },
  },
  test: { exclude: ["e2e/**", "node_modules/**", "dist/**", ".research/**"] },
});
