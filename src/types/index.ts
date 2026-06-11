export type UserRole =
  | "cashier"
  | "field"
  | "delivery"
  | "takeaway"
  | "kitchen"
  | "admin"
  | "super_admin";

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  roles: UserRole[];
  displayName: string;
  isActive: boolean;
  restaurantId: string | null;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleConfig {
  id: UserRole;
  label: string;
  description: string;
  iconName: string;
  color: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  cashier: {
    id: "cashier",
    label: "كاشير",
    description: "إدارة الطلبات والمدفوعات",
    iconName: "CreditCard",
    color: "hsl(25 95% 53%)",
  },
  field: {
    id: "field",
    label: "ميدان",
    description: "خدمة الطاولات والقاعة",
    iconName: "Map",
    color: "hsl(217 91% 60%)",
  },
  delivery: {
    id: "delivery",
    label: "توصيل",
    description: "إدارة طلبات التوصيل",
    iconName: "Bike",
    color: "hsl(142 71% 45%)",
  },
  takeaway: {
    id: "takeaway",
    label: "تيك أواي",
    description: "إدارة طلبات السفري",
    iconName: "ShoppingBag",
    color: "hsl(38 92% 50%)",
  },
  kitchen: {
    id: "kitchen",
    label: "مطبخ",
    description: "إدارة قائمة الطهي",
    iconName: "ChefHat",
    color: "hsl(0 84% 60%)",
  },
  admin: {
    id: "admin",
    label: "مدير",
    description: "إدارة كاملة للنظام",
    iconName: "Settings2",
    color: "hsl(271 81% 56%)",
  },
  super_admin: {
    id: "super_admin",
    label: "مدير عام",
    description: "إدارة جميع المطاعم",
    iconName: "Crown",
    color: "hsl(45 100% 50%)",
  },
};

export const ROLE_ROUTES: Record<UserRole, string> = {
  cashier:     "/dashboard/cashier",
  field:       "/dashboard/field",
  delivery:    "/dashboard/delivery",
  takeaway:    "/dashboard/takeaway",
  kitchen:     "/dashboard/kitchen",
  admin:       "/dashboard/admin",
  super_admin: "/dashboard/admin",
};
