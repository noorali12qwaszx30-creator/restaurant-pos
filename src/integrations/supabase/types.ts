// Auto-generated type stubs — replace with `supabase gen types typescript` output
// after running migrations against your project.

export type UserRole = "cashier" | "kitchen" | "field" | "delivery" | "takeaway" | "admin" | "super_admin";
export type OrderStatus = "pending" | "preparing" | "ready" | "assigned" | "delivering" | "delivered" | "cancelled";
export type OrderType = "delivery" | "takeaway" | "pickup";
export type OrderSource = "local" | "phone" | "instagram" | "whatsapp" | "telegram";
export type PaymentMethod = "cash" | "card" | "split";

// ── Restaurant ─────────────────────────────────────────────────
export interface Restaurant {
  id: string;
  name: string;
  logo: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Row types ─────────────────────────────────────────────────
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  phone: string | null;
  role: UserRole;
  roles: UserRole[];
  is_active: boolean;
  avatar_url: string | null;
  restaurant_id: string | null;
  login_code: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  restaurant_id: string | null;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  price: number;
  image_url: string | null;
  preparation_time: number;
  is_available: boolean;
  sort_order: number;
  restaurant_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category?: MenuCategory;
}

export interface DeliveryArea {
  id: string;
  name: string;
  fee: number;
  is_active: boolean;
  sort_order: number;
  restaurant_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  type: OrderType;
  status: OrderStatus;
  source: OrderSource;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_area_id: string | null;
  notes: string | null;
  cashier_id: string | null;
  driver_id: string | null;
  restaurant_id: string | null;
  created_at: string;
  updated_at: string;
  preparing_at: string | null;
  ready_at: string | null;
  delivering_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason_id: string | null;
  cancellation_note: string | null;
  cancelled_by: string | null;
  has_issue: boolean;
  issue_reason_id: string | null;
  issue_note: string | null;
  issue_reported_at: string | null;
  issue_reported_by: string | null;
  // joined
  items?: OrderItem[];
  delivery_area?: DeliveryArea;
  driver?: Profile;
  cashier?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export interface CancellationReason {
  id: string;
  text: string;
  is_active: boolean;
  restaurant_id: string | null;
  created_at: string;
}

export interface IssueReason {
  id: string;
  text: string;
  is_active: boolean;
  restaurant_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  order_id: string | null;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  restaurant_id: string | null;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  restaurant_id: string | null;
  created_at: string;
}

// Supabase Database type shape (minimal — expand with gen types)
export interface Database {
  public: {
    Tables: {
      restaurants:           { Row: Restaurant;            Insert: Partial<Restaurant>;           Update: Partial<Restaurant>           };
      profiles:              { Row: Profile;              Insert: Partial<Profile>;              Update: Partial<Profile>              };
      menu_categories:       { Row: MenuCategory;         Insert: Partial<MenuCategory>;         Update: Partial<MenuCategory>         };
      menu_items:            { Row: MenuItem;             Insert: Partial<MenuItem>;             Update: Partial<MenuItem>             };
      delivery_areas:        { Row: DeliveryArea;         Insert: Partial<DeliveryArea>;         Update: Partial<DeliveryArea>         };
      orders:                { Row: Order;                Insert: Partial<Order>;                Update: Partial<Order>                };
      order_items:           { Row: OrderItem;            Insert: Partial<OrderItem>;            Update: Partial<OrderItem>            };
      cancellation_reasons:  { Row: CancellationReason;   Insert: Partial<CancellationReason>;   Update: Partial<CancellationReason>   };
      issue_reasons:         { Row: IssueReason;          Insert: Partial<IssueReason>;          Update: Partial<IssueReason>          };
      activity_logs:         { Row: ActivityLog;          Insert: Partial<ActivityLog>;          Update: Partial<ActivityLog>          };
      push_tokens:           { Row: PushToken;            Insert: Partial<PushToken>;            Update: Partial<PushToken>            };
    };
    Views:   Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role:      UserRole;
      order_status:   OrderStatus;
      order_type:     OrderType;
      order_source:   OrderSource;
      payment_method: PaymentMethod;
    };
  };
}
