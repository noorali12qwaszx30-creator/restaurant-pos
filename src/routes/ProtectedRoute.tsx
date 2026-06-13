import { Navigate, Outlet } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  requiredRole?: UserRole;
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile, activeRole, configError } = useAuth();

  if (configError) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-surface border border-status-error/30 rounded-2xl p-6 text-center">
          <Settings2 className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <h2 className="text-lg font-bold text-text-primary mb-2">Supabase غير مُعدَّد</h2>
          <p className="text-sm text-text-secondary mb-4">
            انسخ{" "}
            <code className="bg-surface-elevated px-1 rounded">.env.example</code> إلى{" "}
            <code className="bg-surface-elevated px-1 rounded">.env</code>{" "}
            وأضف بيانات مشروع Supabase.
          </p>
          <pre className="text-xs text-status-error bg-surface-elevated rounded-lg p-3 text-start overflow-auto">
            {configError}
          </pre>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-text-muted">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!activeRole) {
    return <Navigate to="/select-role" replace />;
  }

  if (requiredRole && profile && !profile.roles.includes(requiredRole)) {
    return <Navigate to="/select-role" replace />;
  }

  return <Outlet />;
}

/** Route that redirects authenticated users away from auth pages */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading, activeRole, configError } = useAuth();

  if (configError) return <Outlet />;

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && activeRole) {
    const dest = activeRole === "super_admin" ? "/superadmin" : `/dashboard/${activeRole}`;
    return <Navigate to={dest} replace />;
  }

  if (isAuthenticated && !activeRole) {
    return <Navigate to="/select-role" replace />;
  }

  return <Outlet />;
}
