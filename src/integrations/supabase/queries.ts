/**
 * All Supabase data queries — orders, menu, profiles, areas, reasons.
 * Types come from src/integrations/supabase/types.ts
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

import { supabase } from "./client";
import type {
  Order, MenuItem, MenuCategory,
  DeliveryArea, CancellationReason, IssueReason, Profile,
  OrderStatus, OrderType, OrderSource, PaymentMethod,
} from "./types";

// ══════════════════════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════════════════════

/** Fetch all orders with nested items + area + driver + cashier */
export async function getOrders(filters?: {
  status?: OrderStatus | OrderStatus[];
  type?: OrderType;
}): Promise<Order[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from("orders")
    .select(`
      *,
      items:order_items(*),
      delivery_area:delivery_areas(id, name, fee),
      driver:profiles!driver_id(id, display_name, phone),
      cashier:profiles!cashier_id(id, display_name)
    `)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    q = q.in("status", statuses);
  }
  if (filters?.type) {
    q = q.eq("type", filters.type);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Order[];
}

/** Fetch single order by ID */
export async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await (supabase as unknown as AnyRecord)
    .from("orders")
    .select(`
      *,
      items:order_items(*),
      delivery_area:delivery_areas(id, name, fee),
      driver:profiles!driver_id(id, display_name, phone),
      cashier:profiles!cashier_id(id, display_name)
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Order;
}

/** Create a new order */
export async function createOrder(
  order: {
    type: OrderType;
    source: OrderSource;
    payment_method: PaymentMethod;
    customer_name?: string;
    customer_phone?: string;
    delivery_address?: string;
    delivery_area_id?: string;
    notes?: string;
    subtotal: number;
    delivery_fee: number;
    tax: number;
    total: number;
    cashier_id: string;
  },
  items: Array<{
    menu_item_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    notes?: string;
  }>
): Promise<Order> {
  // Insert order
  const { data: newOrder, error: orderErr } = await (supabase as unknown as AnyRecord)
    .from("orders")
    .insert({ ...order, status: "pending" })
    .select()
    .single();
  if (orderErr) throw orderErr;

  // Insert items
  const itemRows = items.map((i) => ({ ...i, order_id: (newOrder as AnyRecord).id }));
  const { error: itemsErr } = await (supabase as unknown as AnyRecord)
    .from("order_items")
    .insert(itemRows);
  if (itemsErr) throw itemsErr;

  return newOrder as Order;
}

/** Update order status — enforces lifecycle rules */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  extra?: {
    driver_id?: string;
    cancellation_reason_id?: string;
    cancellation_note?: string;
    cancelled_by?: string;
  }
): Promise<void> {
  const { error } = await (supabase as unknown as AnyRecord)
    .from("orders")
    .update({ status, ...extra })
    .eq("id", id);
  if (error) throw error;
}

/** Assign driver + set delivering */
export async function assignDriver(orderId: string, driverId: string): Promise<void> {
  const { error } = await (supabase as unknown as AnyRecord)
    .from("orders")
    .update({ driver_id: driverId, status: "delivering" })
    .eq("id", orderId);
  if (error) throw error;
}

/** Report issue on order */
export async function reportIssue(
  orderId: string,
  params: { issue_reason_id: string; issue_note?: string; reported_by: string }
): Promise<void> {
  const { error } = await (supabase as unknown as AnyRecord)
    .from("orders")
    .update({
      has_issue: true,
      issue_reason_id: params.issue_reason_id,
      issue_note: params.issue_note ?? null,
      issue_reported_at: new Date().toISOString(),
      issue_reported_by: params.reported_by,
    })
    .eq("id", orderId);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════
// MENU
// ══════════════════════════════════════════════════════════════

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const { data, error } = await (supabase as unknown as AnyRecord)
    .from("menu_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as MenuCategory[];
}

export async function getMenuItems(categoryId?: string): Promise<MenuItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = (supabase as unknown as AnyRecord)
    .from("menu_items")
    .select("*, category:menu_categories(id,name,icon)")
    .order("sort_order");
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MenuItem[];
}

export async function toggleMenuItemAvailability(
  id: string,
  is_available: boolean
): Promise<void> {
  const { error } = await (supabase as unknown as AnyRecord)
    .from("menu_items")
    .update({ is_available })
    .eq("id", id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════
// DELIVERY AREAS
// ══════════════════════════════════════════════════════════════

export async function getDeliveryAreas(): Promise<DeliveryArea[]> {
  const { data, error } = await (supabase as unknown as AnyRecord)
    .from("delivery_areas")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as DeliveryArea[];
}

// ══════════════════════════════════════════════════════════════
// CANCELLATION / ISSUE REASONS
// ══════════════════════════════════════════════════════════════

export async function getCancellationReasons(): Promise<CancellationReason[]> {
  const { data, error } = await (supabase as unknown as AnyRecord)
    .from("cancellation_reasons")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []) as CancellationReason[];
}

export async function getIssueReasons(): Promise<IssueReason[]> {
  const { data, error } = await (supabase as unknown as AnyRecord)
    .from("issue_reasons")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []) as IssueReason[];
}

// ══════════════════════════════════════════════════════════════
// PROFILES / DRIVERS
// ══════════════════════════════════════════════════════════════

export async function getDrivers(): Promise<Profile[]> {
  const { data, error } = await (supabase as unknown as AnyRecord)
    .from("profiles")
    .select("*")
    .eq("role", "delivery")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await (supabase as unknown as AnyRecord)
    .from("profiles")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function toggleProfileActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await (supabase as unknown as AnyRecord)
    .from("profiles")
    .update({ is_active })
    .eq("id", id);
  if (error) throw error;
}
