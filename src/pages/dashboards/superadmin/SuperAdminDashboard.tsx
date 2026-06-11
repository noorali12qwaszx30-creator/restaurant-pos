/**
 * Super Admin Control Center
 * لوحة التحكم العليا — سرية — مالك النظام فقط
 */
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, BarChart3,
  Settings2, Crown, LogOut, Shield,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { SuperAdminOverviewPage }    from "./pages/SuperAdminOverviewPage";
import { SuperAdminRestaurantsPage } from "./pages/SuperAdminRestaurantsPage";
import { SuperAdminUsersPage }       from "./pages/SuperAdminUsersPage";
import { SuperAdminStatsPage }       from "./pages/SuperAdminStatsPage";
import { SuperAdminSystemPage }      from "./pages/SuperAdminSystemPage";

// ── تجاوز متغيرات CSS لإعطاء طابع داكن مميز ──────────────────
const THEME: React.CSSProperties = {
  "--background":       "240 18% 4%",
  "--surface":          "240 14% 7%",
  "--surface-elevated": "240 12% 11%",
  "--border":           "240 10% 17%",
  "--text-primary":     "210 18% 92%",
  "--text-secondary":   "210 12% 65%",
  "--text-muted":       "210 8%  38%",
  "--primary":          "38 95% 52%",
  "--primary-foreground":"0 0% 5%",
  "--status-success":   "142 71% 45%",
  "--status-error":     "0 72% 51%",
  "--status-warning":   "38 92% 50%",
  "--status-info":      "199 89% 48%",
} as React.CSSProperties;

const NAV = [
  { to: "/superadmin",         label: "الرئيسية",  icon: LayoutDashboard, end: true },
  { to: "/superadmin/restaurants", label: "المطاعم",   icon: Building2  },
  { to: "/superadmin/users",   label: "المستخدمون",icon: Users       },
  { to: "/superadmin/stats",   label: "الإحصائيات",icon: BarChart3   },
  { to: "/superadmin/system",  label: "النظام",    icon: Settings2   },
];

export function SuperAdminDashboard() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  async function handleLogout() {
    if (!confirmLogout) {
      setConfirmLogout(true);
      setTimeout(() => setConfirmLogout(false), 3000);
      return;
    }
    await logout();
    navigate("/sys-9x7k");
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={THEME}>
      <div className="bg-background min-h-screen flex flex-col">

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-sm px-4 h-14 flex items-center gap-3">
          {/* Crown badge */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shrink-0">
              <Crown className="w-4 h-4 text-black" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-black text-primary tracking-wider uppercase leading-none">
                  System Control
                </p>
                <span className="text-[9px] bg-primary/15 text-primary border border-primary/25 rounded px-1 py-0.5 font-bold leading-none">
                  ROOT
                </span>
              </div>
              <p className="text-[10px] text-text-muted truncate mt-0.5">{profile?.displayName}</p>
            </div>
          </div>

          {/* Security badge */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-text-muted border border-border rounded-lg px-2 py-1">
            <Shield className="w-3 h-3 text-primary" />
            <span className="font-mono">SECURE</span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all shrink-0",
              confirmLogout
                ? "bg-status-error text-white border-status-error"
                : "bg-surface-elevated border-border text-text-muted hover:text-status-error hover:border-status-error/40"
            )}
          >
            <LogOut className="w-3.5 h-3.5" />
            {confirmLogout ? "تأكيد؟" : "خروج"}
          </button>
        </header>

        {/* ══ CONTENT ═════════════════════════════════════════════ */}
        <main className="flex-1 pb-20 overflow-x-hidden">
          <Routes>
            <Route index              element={<SuperAdminOverviewPage />} />
            <Route path="restaurants" element={<SuperAdminRestaurantsPage />} />
            <Route path="users"       element={<SuperAdminUsersPage />} />
            <Route path="stats"       element={<SuperAdminStatsPage />} />
            <Route path="system"      element={<SuperAdminSystemPage />} />
          </Routes>
        </main>

        {/* ══ BOTTOM NAV ══════════════════════════════════════════ */}
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-sm border-t border-border flex">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all",
                isActive
                  ? "text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "w-7 h-5 flex items-center justify-center rounded-md transition-all",
                    isActive && "bg-primary/15"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

      </div>
    </div>
  );
}
