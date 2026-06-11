/**
 * Super Admin Dashboard — إدارة جميع المطاعم
 * يُعرض فقط لمستخدمي super_admin
 */
import { useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import {
  Building2, Users, BarChart3, LogOut, Crown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { SuperAdminRestaurantsPage } from "./pages/SuperAdminRestaurantsPage";
import { SuperAdminUsersPage } from "./pages/SuperAdminUsersPage";
import { SuperAdminStatsPage } from "./pages/SuperAdminStatsPage";

const NAV = [
  { to: "/superadmin",          label: "المطاعم",    icon: Building2,  end: true },
  { to: "/superadmin/users",    label: "الموظفون",   icon: Users       },
  { to: "/superadmin/stats",    label: "الإحصائيات", icon: BarChart3    },
];

export function SuperAdminDashboard() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  async function handleLogout() {
    if (!logoutConfirm) { setLogoutConfirm(true); setTimeout(() => setLogoutConfirm(false), 3000); return; }
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary leading-none">لوحة المدير العام</p>
            <p className="text-[10px] text-text-muted">{profile?.displayName}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all",
            logoutConfirm
              ? "bg-status-error text-white border-status-error"
              : "bg-surface-elevated border-border text-text-muted hover:text-status-error hover:border-status-error/30"
          )}
        >
          <LogOut className="w-3.5 h-3.5" />
          {logoutConfirm ? "تأكيد الخروج" : "خروج"}
        </button>
      </header>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border flex">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-text-muted"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Content ── */}
      <main className="flex-1 pb-20 pt-2">
        <Routes>
          <Route index           element={<SuperAdminRestaurantsPage />} />
          <Route path="users"    element={<SuperAdminUsersPage />} />
          <Route path="stats"    element={<SuperAdminStatsPage />} />
        </Routes>
      </main>
    </div>
  );
}
