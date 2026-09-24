import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA colours come from the design tokens, so there's no raw colour here (CLAUDE.md rule 6).
const { color } = JSON.parse(
  readFileSync(
    new URL("../../docs/design-system/tokens.json", import.meta.url),
    "utf8",
  ),
);
const themeColor: string = color.green.base.$value;

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: "nutrigo:theme-color",
      transformIndexHtml: () => [
        {
          tag: "meta",
          attrs: { name: "theme-color", content: themeColor },
          injectTo: "head",
        },
      ],
    },
    // ADR-0012. The playground preview build gets no service worker, so the owner never reviews a stale cached build.
    VitePWA({
      disable: mode === "playground",
      // With injectRegister "auto" (the default) and no virtual module, the plugin adds a tiny /registerSW.js
      // and turns on skipWaiting + clientsClaim; another injectRegister value would drop those two.
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "NutriGo",
        short_name: "NutriGo",
        description: "Plan weekly meals, track nutrition, shop from the list.",
        start_url: "/",
        display: "standalone",
        theme_color: themeColor,
        background_color: color.neutral.cream.$value,
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2}"],
        navigateFallbackDenylist: [/^\/api\//, /^\/playground/],
      },
    }),
  ],
  server: { proxy: { "/api": "http://localhost:3000" } },
}));
