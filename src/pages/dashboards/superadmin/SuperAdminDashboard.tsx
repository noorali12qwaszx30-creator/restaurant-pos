/**
 * Super Admin Control Center — مركز القيادة العليا
 * سري — مالك النظام فقط — /sys-9x7k
 */
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, BarChart3,
  Shield, Settings2, Crown, LogOut, Search, X, Bell,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { SuperAdminOverviewPage }    from "./pages/SuperAdminOverviewPage";
import { SuperAdminRestaurantsPage } from "./pages/SuperAdminRestaurantsPage";
import { SuperAdminUsersPage }       from "./pages/SuperAdminUsersPage";
import { SuperAdminAnalyticsPage }   from "./pages/SuperAdminAnalyticsPage";
import { SuperAdminSecurityPage }    from "./pages/SuperAdminSecurityPage";
import { SuperAdminSettingsPage }    from "./pages/SuperAdminSettingsPage";

const THEME: React.CSSProperties = {
  "--color-background":        "162 50% 4%",
  "--color-surface":           "160 42% 7%",
  "--color-surface-elevated":  "158 33% 11%",
  "--color-border":            "156 25% 17%",
  "--color-border-subtle":     "156 22% 12%",
  "--color-text-primary":      "150 32% 94%",
  "--color-text-secondary":    "150 17% 64%",
  "--color-text-muted":        "150 12% 40%",
  "--color-primary":           "155 90% 44%",
  "--color-primary-foreground":"160 50% 4%",
  "--color-primary-hover":     "155 90% 52%",
  "--color-status-success":    "142 71% 45%",
  "--color-status-error":      "0 72% 51%",
  "--color-status-warning":    "38 92% 50%",
  "--color-status-info":       "199 89% 48%",
  "--shadow-card":             "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(13,196,100,0.04)",
  "--shadow-elevated":         "0 4px 12px rgba(0,0,0,0.6), 0 0 20px rgba(13,196,100,0.06)",
  "--shadow-dialog":           "0 20px 40px rgba(0,0,0,0.7), 0 0 40px rgba(13,196,100,0.08)",
} as React.CSSProperties;

const NAV = [
  { to: "/superadmin",             label: "الرئيسية",  icon: LayoutDashboard, end: true },
  { to: "/superadmin/restaurants", label: "المطاعم",   icon: Building2              },
  { to: "/superadmin/users",       label: "المستخدمون",icon: Users                  },
  { to: "/superadmin/analytics",   label: "التحليلات", icon: BarChart3              },
  { to: "/superadmin/security",    label: "الأمان",    icon: Shield                 },
  { to: "/superadmin/settings",    label: "الإعدادات", icon: Settings2              },
];

const PAGE_TITLES: Record<string, string> = {
  "/superadmin":             "مركز القيادة",
  "/superadmin/restaurants": "إدارة المطاعم",
  "/superadmin/users":       "إدارة المستخدمين",
  "/superadmin/analytics":   "التحليلات",
  "/superadmin/security":    "الأمان والسجلات",
  "/superadmin/settings":    "الإعدادات",
};

export function SuperAdminDashboard() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const currentTitle = PAGE_TITLES[location.pathname] ?? "النظام";

  useEffect(() => { if (showSearch) searchRef.current?.focus(); }, [showSearch]);

  async function handleLogout() {
    if (!confirmLogout) { setConfirmLogout(true); setTimeout(() => setConfirmLogout(false), 3000); return; }
    await logout();
    navigate("/sys-9x7k");
  }

  const SEARCH_LINKS = [
    { label: "إنشاء مطعم جديد",     path: "/superadmin/restaurants", icon: Building2 },
    { label: "إضافة مستخدم",        path: "/superadmin/users",       icon: Users     },
    { label: "التحليلات والمقارنة", path: "/superadmin/analytics",   icon: BarChart3 },
    { label: "سجل الدخول",          path: "/superadmin/security",    icon: Shield    },
    { label: "Feature Flags",        path: "/superadmin/settings",    icon: Settings2 },
  ].filter(l => !searchQ.trim() || l.label.includes(searchQ));

  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={THEME}>
      <div className="bg-background min-h-screen flex flex-col">

        {/* HEADER */}
        <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-black" />
              </div>
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-black text-primary tracking-widest uppercase leading-none">{currentTitle}</p>
                <span className="text-[8px] bg-primary/15 text-primary border border-primary/25 rounded px-1 py-0.5 font-black leading-none">ROOT</span>
              </div>
              <p className="text-[10px] text-text-muted truncate mt-0.5 font-mono">{profile?.displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setShowSearch(v => !v)} className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-primary hover:bg-surface-elevated transition-colors">
              {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-primary hover:bg-surface-elevated transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            </button>
            <button onClick={handleLogout} className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-xl border transition-all",
              confirmLogout ? "bg-status-error text-white border-status-error"
                : "bg-surface-elevated border-border text-text-muted hover:text-status-error hover:border-status-error/40"
            )}>
              <LogOut className="w-3.5 h-3.5" />
              {confirmLogout ? "تأكيد؟" : "خروج"}
            </button>
          </div>
        </header>

        {/* GLOBAL SEARCH */}
        {showSearch && (
          <div className="sticky top-14 z-40 bg-surface/95 backdrop-blur-md border-b border-border px-4 py-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="ابحث في النظام..."
                className="w-full bg-surface-elevated border border-primary/30 rounded-xl pr-9 pl-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {SEARCH_LINKS.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {SEARCH_LINKS.map(l => (
                  <button key={l.path}
                    onClick={() => { navigate(l.path); setShowSearch(false); setSearchQ(""); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-elevated text-right transition-colors">
                    <l.icon className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm text-text-secondary">{l.label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTENT */}
        <main className="flex-1 pb-20 overflow-x-hidden">
          <Routes>
            <Route index              element={<SuperAdminOverviewPage />}    />
            <Route path="restaurants" element={<SuperAdminRestaurantsPage />} />
            <Route path="users"       element={<SuperAdminUsersPage />}       />
            <Route path="analytics"   element={<SuperAdminAnalyticsPage />}   />
            <Route path="security"    element={<SuperAdminSecurityPage />}    />
            <Route path="settings"    element={<SuperAdminSettingsPage />}    />
          </Routes>
        </main>

        {/* BOTTOM NAV — 6 tabs */}
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border">
          <div className="flex">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all text-[9px] font-medium",
                  isActive ? "text-primary" : "text-text-muted"
                )}>
                {({ isActive }) => (
                  <>
                    <div className={cn("w-8 h-5 flex items-center justify-center rounded-md transition-all", isActive && "bg-primary/15")}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

      </div>
    </div>
  );
}
