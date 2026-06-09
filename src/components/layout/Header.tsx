import { LogOut, ChevronDown, CreditCard, Map, Bike, ShoppingBag, ChefHat, Settings2, type LucideIcon } from "lucide-react";
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

export function Header({ role }: HeaderProps) {
  const { profile, logout } = useAuth();
  const config = ROLE_CONFIGS[role];
  const RoleIcon = ROLE_ICONS[config.iconName] ?? Settings2;

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 h-[var(--header-height)]",
        "glass border-b border-border/60",
        "flex items-center justify-between px-4"
      )}
    >
      {/* Right: Logo + Role */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-base font-bold text-text-primary leading-tight">
            Twitter POS
          </span>
          <span className="text-xs text-text-muted leading-tight">
            نظام إدارة المطعم
          </span>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg primary-gradient shadow-card"
          aria-hidden
        >
          <RoleIcon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Left: Role badge + User + Logout */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-surface-elevated rounded-full px-3 py-1.5 border border-border">
          <span className="text-xs font-medium text-text-primary">{config.label}</span>
          <ChevronDown className="w-3 h-3 text-text-muted" />
        </div>

        {profile && (
          <span className="text-sm text-text-secondary hidden sm:block">
            {profile.displayName}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="تسجيل الخروج"
          className="text-text-muted hover:text-status-error"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
