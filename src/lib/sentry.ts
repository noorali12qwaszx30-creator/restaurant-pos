import * as Sentry from "@sentry/react";

/**
 * يهيّئ Sentry لمراقبة الأخطاء.
 * - لا يفعل شيئاً إن لم يُضبط VITE_SENTRY_DSN (تطوير محلي بلا ضجيج).
 * - يعمل في الويب وداخل WebView الخاص بـ Capacitor تلقائياً.
 * - يفصل بيئة production عن development عبر environment.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    // معدّل تتبّع الأداء: أقل في الإنتاج لتقليل الحِمل، كامل في التطوير
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  });
}
