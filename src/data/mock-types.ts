export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "paid"
  | "cancelled";

export type OrderType = "dine_in" | "takeaway" | "delivery";
export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";
export type PaymentMethod = "cash" | "card" | "split";
export type UserRole = "cashier" | "field" | "delivery" | "takeaway" | "kitchen" | "admin" | "super_admin";

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
  preparationTime: number; // minutes
  description?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryDriverId?: string;
  deliveryDriverName?: string;
  pendingDeliveryAcceptance?: boolean;
  deliveryFee?: number;
  deliveredAt?: Date;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedAt?: Date;
  hasIssue?: boolean;
  issueReason?: string;
  issueReportedAt?: Date;
  zone?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number; // minutes
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  floor: number;
}

export interface StaffUser {
  id: string;
  username: string;
  displayName: string;
  roles: UserRole[];
  isActive: boolean;
  phone?: string;
  joinDate: Date;
  lastLogin?: Date;
}

export interface DailyStat {
  label: string;
  value: number;
  change: number; // percentage vs yesterday
  prefix?: string;
  suffix?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}
