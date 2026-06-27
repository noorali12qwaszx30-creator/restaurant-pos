import fs from "node:fs";
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

/**
 * يقرأ ملف .env.sentry-build-plugin (سرّي، متجاهَل في git) إن وُجد.
 * يسمح بتشغيل رفع source maps محلياً دون تصدير متغيرات يدوياً.
 */
function readEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

const sentryEnv = readEnvFile(".env.sentry-build-plugin");
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN ?? sentryEnv.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG ?? sentryEnv.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT ?? sentryEnv.SENTRY_PROJECT;
const sentryEnabled = Boolean(sentryAuthToken && sentryOrg && sentryProject);

export default defineConfig({
  // GitHub Pages: يُنشر تحت /restaurant-pos/
  base: process.env.GITHUB_ACTIONS ? "/restaurant-pos/" : "/",
  plugins: [
    react(),
    // يرفع source maps إلى Sentry عند توفّر التوكن فقط؛ وإلا يتعطّل بهدوء.
    sentryVitePlugin({
      org: sentryOrg,
      project: sentryProject,
      authToken: sentryAuthToken,
      disable: !sentryEnabled,
      sourcemaps: {
        // احذف ملفات الخرائط من الحزمة بعد رفعها حتى لا تُنشر علناً.
        filesToDeleteAfterUpload: ["./dist/**/*.map"],
      },
    }),
  ],
  build: {
    // خرائط مخفية (بلا إشارة في الحزمة) تُرفع لـ Sentry فقط عند تفعيله.
    sourcemap: sentryEnabled ? "hidden" : false,
  },
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
