import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages: يُنشر تحت /restaurant-pos/
  base: process.env.GITHUB_ACTIONS ? "/restaurant-pos/" : "/",
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5174,
    strictPort: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
