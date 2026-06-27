import { AlertTriangle } from "lucide-react";

/**
 * واجهة احتياطية تظهر فقط عند تعطّل غير متوقّع التقطه Sentry.ErrorBoundary.
 * لا تؤثر على المسار الطبيعي للتطبيق.
 */
export function AppCrashFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-status-error/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-status-error" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-text-primary">حدث خطأ غير متوقّع</h1>
        <p className="text-sm text-text-muted mt-1">
          تم تسجيل المشكلة وسنعمل على إصلاحها. حاول مرة أخرى.
        </p>
      </div>
      <button
        onClick={resetError}
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-[0.97] transition-all"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
