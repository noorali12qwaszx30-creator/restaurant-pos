/**
 * Supabase Realtime subscriptions.
 * Each function returns an unsubscribe callback.
 */
import { supabase } from "./client";
import type { Order, OrderItem } from "./types";

// ══════════════════════════════════════════════════════════════
// ORDERS — subscribe to all changes
// ══════════════════════════════════════════════════════════════

export function subscribeToOrders(
  callbacks: {
    onInsert?: (order: Order) => void;
    onUpdate?: (order: Order) => void;
    onDelete?: (id: string) => void;
  }
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = (supabase as any)
    .channel("orders-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        if (payload.eventType === "INSERT") callbacks.onInsert?.(payload.new as Order);
        if (payload.eventType === "UPDATE") callbacks.onUpdate?.(payload.new as Order);
        if (payload.eventType === "DELETE") callbacks.onDelete?.(payload.old.id as string);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Kitchen: pending + preparing orders only ───────────────────
export function subscribeToKitchenOrders(
  callbacks: {
    onInsert?: (order: Order) => void;
    onUpdate?: (order: Order) => void;
  }
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = (supabase as any)
    .channel("kitchen-orders")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: "status=in.(pending,preparing)",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        if (payload.eventType === "INSERT") callbacks.onInsert?.(payload.new as Order);
        if (payload.eventType === "UPDATE") callbacks.onUpdate?.(payload.new as Order);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Field: ready + preparing orders ───────────────────────────
export function subscribeToFieldOrders(
  callbacks: {
    onInsert?: (order: Order) => void;
    onUpdate?: (order: Order) => void;
  }
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = (supabase as any)
    .channel("field-orders")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        const order = payload.new as Order;
        const relevant = ["pending", "preparing", "ready"].includes(order.status);
        if (!relevant) return;
        if (payload.eventType === "INSERT") callbacks.onInsert?.(order);
        if (payload.eventType === "UPDATE") callbacks.onUpdate?.(order);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Delivery: delivering orders for a specific driver ──────────
export function subscribeToDriverOrders(
  driverId: string,
  callbacks: {
    onUpdate?: (order: Order) => void;
  }
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = (supabase as any)
    .channel(`driver-${driverId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `driver_id=eq.${driverId}`,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => callbacks.onUpdate?.(payload.new as Order)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Order Items — subscribe to items of a specific order ────────
export function subscribeToOrderItems(
  orderId: string,
  callback: (item: OrderItem) => void
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = (supabase as any)
    .channel(`order-items-${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "order_items",
        filter: `order_id=eq.${orderId}`,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => callback(payload.new as OrderItem)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Presence (online users for Admin Monitoring) ───────────────
export interface PresenceState {
  userId: string;
  displayName: string;
  role: string;
  currentPage: string;
  joinedAt: string;
}

export function usePresenceChannel(
  userId: string,
  state: Omit<PresenceState, "userId">,
  onChange: (presences: PresenceState[]) => void
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = (supabase as any).channel("online-users", {
    config: { presence: { key: userId } },
  });

  channel
    .on("presence", { event: "sync" }, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = channel.presenceState() as Record<string, any[]>;
      const list: PresenceState[] = Object.entries(raw).flatMap(([uid, entries]) =>
        (entries as Omit<PresenceState, "userId">[]).map((e) => ({ userId: uid, ...e }))
      );
      onChange(list);
    })
    .subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await channel.track(state);
      }
    });

  return () => {
    channel.untrack();
    supabase.removeChannel(channel);
  };
}
