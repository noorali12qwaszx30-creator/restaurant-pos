import type { UserProfile, UserRole } from "@/types";

export const IS_DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

// Mock users — available when VITE_DEV_MODE=true
const MOCK_USERS: Record<string, { password: string; profile: UserProfile }> = {
  admin: {
    password: "Admin@123",
    profile: {
      uid: "mock-admin-001",
      username: "admin",
      email: "admin@restaurant.local",
      displayName: "مدير النظام",
      roles: ["admin"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  cashier1: {
    password: "Cash@123",
    profile: {
      uid: "mock-cashier-001",
      username: "cashier1",
      email: "cashier1@restaurant.local",
      displayName: "كاشير 1",
      roles: ["cashier"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  field1: {
    password: "Field@123",
    profile: {
      uid: "mock-field-001",
      username: "field1",
      email: "field1@restaurant.local",
      displayName: "ميدان 1",
      roles: ["field"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  delivery1: {
    password: "Delivery@123",
    profile: {
      uid: "mock-delivery-001",
      username: "delivery1",
      email: "delivery1@restaurant.local",
      displayName: "مندوب التوصيل",
      roles: ["delivery"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  takeaway1: {
    password: "Take@123",
    profile: {
      uid: "mock-takeaway-001",
      username: "takeaway1",
      email: "takeaway1@restaurant.local",
      displayName: "تيك أواي 1",
      roles: ["takeaway"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  kitchen1: {
    password: "Kitchen@123",
    profile: {
      uid: "mock-kitchen-001",
      username: "kitchen1",
      email: "kitchen1@restaurant.local",
      displayName: "طاهي المطبخ",
      roles: ["kitchen"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  super: {
    password: "Super@123",
    profile: {
      uid: "mock-super-001",
      username: "super",
      email: "super@restaurant.local",
      displayName: "متعدد الأدوار",
      roles: ["cashier", "takeaway", "admin"] as UserRole[],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
};

const SESSION_KEY = "pos_dev_session";

export function mockSignIn(username: string, password: string): UserProfile {
  const entry = MOCK_USERS[username.toLowerCase()];
  if (!entry) throw new Error("auth/user-not-found");
  if (entry.password !== password) throw new Error("auth/wrong-password");
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(entry.profile));
  return entry.profile;
}

export function mockSignOut(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getMockSession(): UserProfile | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}
