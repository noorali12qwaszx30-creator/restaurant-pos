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
import { motion } from "framer-motion";

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
    { to: "/dashboard/takeaway",           label: "القائمة",    icon: UtensilsCrossed },
    { to: "/dashboard/takeaway/orders",    label: "الطلبات",    icon: Package         },
    { to: "/dashboard/takeaway/completed", label: "المكتملة",   icon: Archive         },
    { to: "/dashboard/takeaway/cancelled", label: "الملغية",    icon: AlertCircle     },
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
    { to: "/dashboard/admin/stats",      label: "إحصائيات",  icon: BarChart3        },
    { to: "/dashboard/admin/users",      label: "الموظفون",   icon: Users            },
    { to: "/dashboard/admin/settings",   label: "إعدادات",    icon: Settings         },
    { to: "/dashboard/admin/assistant",  label: "المساعد",    icon: BotMessageSquare },
  ],
  super_admin: [
    { to: "/dashboard/admin",            label: "الرئيسية",   icon: LayoutDashboard  },
    { to: "/dashboard/admin/orders",     label: "الطلبات",    icon: ShoppingBag      },
    { to: "/dashboard/admin/stats",      label: "إحصائيات",  icon: BarChart3        },
    { to: "/dashboard/admin/users",      label: "الموظفون",   icon: Users            },
    { to: "/dashboard/admin/settings",   label: "إعدادات",    icon: Settings         },
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
      className="fixed bottom-0 inset-x-0 z-50 glass border-t border-white/30 shadow-dialog pb-safe"
      style={{ height: "var(--nav-height)" }}
    >
      <div className="flex items-center justify-around w-full h-full px-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full py-1.5 transition-all duration-200"
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-primary text-white shadow-sm scale-105"
                      : "text-text-muted"
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={cn(
                  "text-[9px] font-semibold leading-none transition-all duration-200",
                  isActive ? "text-primary" : "text-text-muted"
                )}>
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId={`nav-indicator-${role}`}
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
