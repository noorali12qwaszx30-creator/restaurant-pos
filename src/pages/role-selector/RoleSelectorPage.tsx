import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_CONFIGS, ROLE_ROUTES, type UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import {
  LogOut, ChevronLeft,
  CreditCard, Map, Bike, ShoppingBag, ChefHat, Settings2, Crown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<string, LucideIcon> = {
  CreditCard, Map, Bike, ShoppingBag, ChefHat, Settings2, Crown,
};

export function RoleSelectorPage() {
  const { profile, setActiveRole, logout } = useAuth();
  const navigate = useNavigate();

  const availableRoles: UserRole[] = (profile?.roles ?? []).filter(r => r !== "super_admin");

  const handleRoleSelect = (role: UserRole) => {
    setActiveRole(role);
    navigate(ROLE_ROUTES[role], { replace: true });
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-safe-top pt-6 pb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">مرحباً، {profile?.displayName}</h1>
          <p className="text-sm text-text-muted mt-0.5">اختر دورك للبدء</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="تسجيل الخروج"
          className="text-text-muted hover:text-status-error"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 right-0 w-[250px] h-[250px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[200px] h-[200px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Role grid */}
      <main className="relative flex-1 px-4 pt-4 pb-8 grid content-center">
        {availableRoles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted text-base">لا توجد أدوار مخصصة لحسابك</p>
            <p className="text-text-muted text-sm mt-1">تواصل مع المدير</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
            {availableRoles.map((roleId) => {
              const config = ROLE_CONFIGS[roleId];
              const Icon = ROLE_ICONS[config.iconName] ?? Settings2;
              return (
                <button
                  key={roleId}
                  onClick={() => handleRoleSelect(roleId)}
                  className={cn(
                    "group relative flex flex-col items-center gap-3 p-5 rounded-2xl",
                    "bg-surface border border-border",
                    "hover:border-primary/50 hover:bg-surface-elevated",
                    "active:scale-[0.97]",
                    "transition-all duration-200 shadow-card hover:shadow-elevated",
                    "text-start"
                  )}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-card"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: config.color }} />
                  </div>

                  {/* Labels */}
                  <div className="w-full">
                    <p className="text-base font-semibold text-text-primary">{config.label}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                      {config.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div
                    className={cn(
                      "absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity",
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      "bg-primary/10"
                    )}
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-primary" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center pb-8 pb-safe-bottom">
        <p className="text-xs text-text-muted">النظام للإدارة المتكاملة &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
