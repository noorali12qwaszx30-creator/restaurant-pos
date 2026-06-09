import { NavLink } from "react-router-dom";
import {
  ShoppingBag,
  BarChart3,
  User,
  Bike,
  Package,
  BarChart2,
  Archive,
  UtensilsCrossed,
  ListTodo,
  LayoutDashboard,
  Settings,
  Search,
  History,
  AlertCircle,
  ClipboardList,
  BotMessageSquare,
  Users,
} from "lucide-react";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  cashier: [
    { to: "/dashboard/cashier",         label: "الرئيسية", icon: LayoutDashboard },
    { to: "/dashboard/cashier/orders",  label: "الطلبات",  icon: ShoppingBag },
    { to: "/dashboard/cashier/search",  label: "بحث",      icon: Search },
    { to: "/dashboard/cashier/history", label: "السجل",    icon: History },
  ],
  field: [
    { to: "/dashboard/field",          label: "الرئيسية", icon: LayoutDashboard },
    { to: "/dashboard/field/orders",   label: "الطلبات",  icon: ClipboardList },
    { to: "/dashboard/field/issues",   label: "المشاكل",  icon: AlertCircle },
    { to: "/dashboard/field/profile",  label: "حسابي",    icon: User },
  ],
  delivery: [
    { to: "/dashboard/delivery",          label: "الجديدة",    icon: Package },
    { to: "/dashboard/delivery/active",   label: "طلباتي",     icon: Bike },
    { to: "/dashboard/delivery/stats",    label: "إحصائياتي", icon: BarChart2 },
    { to: "/dashboard/delivery/archive",  label: "الأرشيف",   icon: Archive },
  ],
  takeaway: [
    { to: "/dashboard/takeaway", label: "الرئيسية", icon: LayoutDashboard },
    { to: "/dashboard/takeaway/orders", label: "الطلبات", icon: Package },
    { to: "/dashboard/takeaway/menu", label: "القائمة", icon: UtensilsCrossed },
    { to: "/dashboard/takeaway/profile", label: "حسابي", icon: User },
  ],
  kitchen: [
    { to: "/dashboard/kitchen", label: "الرئيسية", icon: LayoutDashboard },
    { to: "/dashboard/kitchen/queue", label: "قائمة الطهي", icon: ListTodo },
    { to: "/dashboard/kitchen/menu", label: "الأصناف", icon: UtensilsCrossed },
    { to: "/dashboard/kitchen/profile", label: "حسابي", icon: User },
  ],
  admin: [
    { to: "/dashboard/admin",            label: "الرئيسية",   icon: LayoutDashboard  },
    { to: "/dashboard/admin/orders",     label: "الطلبات",    icon: ShoppingBag      },
    { to: "/dashboard/admin/stats",      label: "الإحصائيات", icon: BarChart3        },
    { to: "/dashboard/admin/users",      label: "الموظفون",   icon: Users            },
    { to: "/dashboard/admin/settings",   label: "الإعدادات",  icon: Settings         },
    { to: "/dashboard/admin/assistant",  label: "المساعد",    icon: BotMessageSquare },
  ],
};

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const items = NAV_ITEMS[role];

  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 h-[var(--nav-height)]",
        "glass border-t border-border/60",
        "flex items-center justify-around px-2 pb-safe"
      )}
    >
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-colors",
              isActive
                ? "text-primary"
                : "text-text-muted hover:text-text-secondary"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  isActive && "bg-primary/15"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
