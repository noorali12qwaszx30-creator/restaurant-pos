import { LogOut, CreditCard, Map, Bike, ShoppingBag, ChefHat, Settings2, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_CONFIGS, type UserRole } from "@/types";

const ROLE_ICONS: Record<string, LucideIcon> = {
  CreditCard, Map, Bike, ShoppingBag, ChefHat, Settings2,
};
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  role: UserRole;
}

const ROLE_COLORS: Record<UserRole, string> = {
  cashier:     "from-orange-500 to-orange-600",
  field:       "from-sky-500 to-sky-600",
  delivery:    "from-emerald-500 to-emerald-600",
  takeaway:    "from-amber-500 to-amber-600",
  kitchen:     "from-rose-500 to-rose-600",
  admin:       "from-violet-500 to-violet-600",
  super_admin: "from-yellow-500 to-yellow-600",
};

export function Header({ role }: HeaderProps) {
  const { profile, logout } = useAuth();
  const config = ROLE_CONFIGS[role];
  const RoleIcon = ROLE_ICONS[config.iconName] ?? Settings2;

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 h-[var(--header-height)]",
        "glass border-b border-white/30",
        "flex items-center justify-between px-4 gap-3"
      )}
    >
      {/* Right: Icon + App name */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br shrink-0",
            ROLE_COLORS[role]
          )}
          aria-hidden
        >
          <RoleIcon className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary leading-tight tracking-tight">
            Twitter POS
          </span>
          <span className="text-[10px] text-text-muted leading-tight font-medium">
            {config.label}
          </span>
        </div>
      </div>

      {/* Left: User info + Logout */}
      <div className="flex items-center gap-2">
        {profile && (
          <div className="hidden sm:flex items-center gap-2 bg-surface-elevated rounded-full px-3 py-1.5 border border-border/60">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
              {profile.displayName?.[0] ?? "?"}
            </div>
            <span className="text-xs font-semibold text-text-primary leading-none">
              {profile.displayName}
            </span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="تسجيل الخروج"
          className="h-8 w-8 rounded-xl text-text-muted hover:text-status-error hover:bg-status-error/10 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
        </Button>
      </div>
    </header>
  );
}
