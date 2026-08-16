import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/web",
    sourcemap: true,
    // The Cloudflare zone has a long-lived HTML cache rule. Stable entry
    // names prevent a cached HTML shell from pointing at a removed hash after
    // a deployment; old hashes are also handled by the Worker compatibility
    // path below.
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/chunks/[name]-[hash].js",
        assetFileNames: (asset) => asset.name?.endsWith(".css")
          ? "assets/app.css"
          : "assets/[name]-[hash][extname]",
      },
    },
  },
});
