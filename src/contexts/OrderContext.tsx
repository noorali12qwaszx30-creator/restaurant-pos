/**
 * OrderContext — Shared reactive order store.
 * Dev mode:  in-memory state on top of MOCK_ORDERS, full lifecycle transitions.
 * Production: Supabase queries + Realtime subscriptions.
 *
 * Lifecycle (CRITICAL):
 *   cashier → pending
 *   kitchen → preparing   (pending → preparing, ONLY kitchen)
 *   field   → ready       (preparing → ready)
 *   field   → delivering  (ready → delivering, assigns driver)
 *   driver  → delivered   (delivering → delivered)
 *   any     → cancelled   (with reason)
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { IS_DEV_MODE } from "@/lib/dev-mock";
import { MOCK_ORDERS } from "@/data/mock-orders";
import type { Order as MockOrder } from "@/data/mock-types";

// ── Unified Order type (works for both mock + Supabase) ────────
export interface LiveOrder {
  id: string;
  orderNumber?: number;
  type: "delivery" | "takeaway" | "dine_in" | "pickup";
  status: "pending" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled" | "out_for_delivery";
  source?: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  zone?: string;
  notes?: string;
  cashierId?: string;
  driverId?: string;
  driverName?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  preparingAt?: Date;
  readyAt?: Date;
  deliveringAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  hasIssue?: boolean;
  issueReason?: string;
}

function mockToLive(o: MockOrder): LiveOrder {
  // Map old statuses to new lifecycle
  let status = o.status as LiveOrder["status"];
  if ((status as string) === "out_for_delivery") status = "delivering";
  if ((status as string) === "paid")             status = "delivered";
  if ((status as string) === "confirmed")        status = "preparing";

  return {
    id: o.id,
    type: o.type as LiveOrder["type"],
    status,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee ?? 0,
    tax: o.tax,
    total: o.total,
    paymentMethod: o.paymentMethod,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    deliveryAddress: o.deliveryAddress,
    zone: o.zone,
    notes: o.notes,
    driverId: o.assignedDriverId ?? o.deliveryDriverId,
    driverName: o.assignedDriverName ?? o.deliveryDriverName,
    items: o.items.map(i => ({
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      notes: i.notes,
    })),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    hasIssue: o.hasIssue,
    issueReason: o.issueReason,
  };
}

// ── Context shape ─────────────────────────────────────────────
interface OrderContextValue {
  orders: LiveOrder[];
  isLoading: boolean;
  loadError: string | null;

  // Cashier
  addOrder: (order: Omit<LiveOrder, "id" | "status" | "createdAt" | "updatedAt">) => Promise<string>;

  // Kitchen: pending → preparing
  markPreparing: (orderId: string) => Promise<void>;

  // Field: preparing → ready
  markReady: (orderId: string) => Promise<void>;

  // Field: ready → delivering (with driver)
  assignAndDispatch: (orderId: string, driverId: string, driverName: string) => Promise<void>;

  // Delivery: delivering → delivered
  markDelivered: (orderId: string) => Promise<void>;

  // Cashier: edit order (pre-delivering)
  editOrder: (orderId: string, patch: Partial<Pick<LiveOrder, "customerName"|"customerPhone"|"deliveryAddress"|"notes"|"subtotal"|"deliveryFee"|"tax"|"total"|"items">>) => Promise<void>;

  // Any: → cancelled
  cancelOrder: (orderId: string, reason: string, cancelledBy?: string) => Promise<void>;

  // Any: flag issue
  reportIssue: (orderId: string, reason: string, note?: string) => Promise<void>;

  refetch: () => Promise<void>;
}

const OrderContext = createContext<OrderContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────
export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Load orders (silent=true → no loading spinner, no error state) ──
  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) { setIsLoading(true); setLoadError(null); }
    if (IS_DEV_MODE) {
      setOrders(MOCK_ORDERS.map(mockToLive));
    } else {
      try {
        const { getOrders } = await import("@/integrations/supabase/queries");
        const data = await getOrders();
        setOrders(data.map(mapFullOrder));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[OrderContext] load failed:", err);
        if (!silent) setLoadError(msg);
      }
    }
    if (!silent) setIsLoading(false);
  }, []);

  useEffect(() => {
    loadOrders(false); // first load — show spinner
  }, [loadOrders]);

  // ── Silent background polling every 3s ──
  useEffect(() => {
    if (IS_DEV_MODE) return;
    const id = setInterval(() => loadOrders(true), 3_000);
    return () => clearInterval(id);
  }, [loadOrders]);

  // ── Realtime (production) ──
  useEffect(() => {
    if (IS_DEV_MODE) return;
    let unsub: (() => void) | undefined;
    import("@/integrations/supabase/realtime").then(({ subscribeToOrders }) => {
      unsub = subscribeToOrders({
        onInsert: async (o) => {
          // Realtime INSERT payload lacks joined tables (order_items, delivery_area…).
          // Fetch the full order so every dashboard gets items + orderNumber immediately.
          try {
            const { getOrder } = await import("@/integrations/supabase/queries");
            const full = await getOrder(o.id);
            if (full) {
              const live = mapFullOrder(full);
              setOrders(prev => {
                // Replace optimistic entry (same id) or prepend new
                const existing = prev.find(p => p.id === live.id);
                if (existing) {
                  return prev.map(p => p.id === live.id
                    ? { ...live, items: live.items.length > 0 ? live.items : p.items }
                    : p
                  );
                }
                return [live, ...prev];
              });
              return;
            }
          } catch {/* fall through to bare payload */}
          // Fallback: add with whatever the Realtime payload provides
          setOrders(prev => {
            if (prev.some(p => p.id === o.id)) return prev;
            return [dbOrderToLive(o), ...prev];
          });
        },
        onUpdate: (o) => {
          const live = dbOrderToLive(o);
          setOrders(prev => prev.map(p => {
            if (p.id !== live.id) return p;
            // Realtime UPDATE rows don't include order_items — preserve existing items
            return { ...live, items: live.items.length > 0 ? live.items : p.items };
          }));
        },
        onDelete: (id) => {
          setOrders(prev => prev.filter(p => p.id !== id));
        },
      });
    });
    return () => unsub?.();
  }, []);

  // ── Mutations ──────────────────────────────────────────────

  function patchLocal(id: string, patch: Partial<LiveOrder>) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch, updatedAt: new Date() } : o));
  }

  const addOrder = useCallback(async (
    order: Omit<LiveOrder, "id" | "status" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    if (IS_DEV_MODE) {
      const id = `ORD-${String(Date.now()).slice(-4)}`;
      const now = new Date();
      const newOrder: LiveOrder = { ...order, id, status: "pending", createdAt: now, updatedAt: now };
      setOrders(prev => [newOrder, ...prev]);
      return id;
    }
    const { createOrder, getOrder } = await import("@/integrations/supabase/queries");
    const created = await createOrder(
      {
        type: order.type as never,
        source: (order.source ?? "local") as never,
        payment_method: (order.paymentMethod ?? "cash") as never,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        delivery_address: order.deliveryAddress,
        notes: order.notes,
        subtotal: order.subtotal,
        delivery_fee: order.deliveryFee,
        tax: order.tax,
        total: order.total,
        cashier_id: order.cashierId ?? "",
      },
      order.items.map(i => ({
        menu_item_id: i.menuItemId,
        name: i.name,
        unit_price: i.unitPrice,
        quantity: i.quantity,
        notes: i.notes,
      }))
    );

    // Add optimistically with local items IMMEDIATELY — this ensures
    // the Realtime INSERT event (which arrives with no items) is
    // blocked by the duplicate check, and the order is visible at once.
    const nowOpt = new Date();
    const optimistic: LiveOrder = { ...order, id: created.id, status: "pending", createdAt: nowOpt, updatedAt: nowOpt };
    setOrders(prev => [optimistic, ...prev.filter(p => p.id !== optimistic.id)]);

    // Then fetch the DB version to get order_number + accurate timestamps.
    // If DB returns items, upgrade the local record; otherwise keep optimistic items.
    try {
      const full = await getOrder(created.id);
      if (full) {
        const live = mapFullOrder(full);
        // If DB returned empty items (schema timing), keep local items
        if (live.items.length === 0) live.items = order.items;
        setOrders(prev => [live, ...prev.filter(p => p.id !== live.id)]);
      }
    } catch {
      // Fallback: add with items from local state (no DB timestamps)
      const now = new Date();
      const fallback: LiveOrder = { ...order, id: created.id, status: "pending", createdAt: now, updatedAt: now };
      setOrders(prev => [fallback, ...prev.filter(p => p.id !== fallback.id)]);
    }

    return created.id;
  }, []);

  const markPreparing = useCallback(async (orderId: string) => {
    patchLocal(orderId, { status: "preparing", preparingAt: new Date() });
    if (!IS_DEV_MODE) {
      const { updateOrderStatus } = await import("@/integrations/supabase/queries");
      await updateOrderStatus(orderId, "preparing");
    }
  }, []);

  const markReady = useCallback(async (orderId: string) => {
    patchLocal(orderId, { status: "ready", readyAt: new Date() });
    if (!IS_DEV_MODE) {
      const { updateOrderStatus } = await import("@/integrations/supabase/queries");
      await updateOrderStatus(orderId, "ready");
    }
  }, []);

  const assignAndDispatch = useCallback(async (
    orderId: string, driverId: string, driverName: string
  ) => {
    patchLocal(orderId, { status: "delivering", driverId, driverName, deliveringAt: new Date() });
    if (!IS_DEV_MODE) {
      const { assignDriver } = await import("@/integrations/supabase/queries");
      await assignDriver(orderId, driverId);
    }
  }, []);

  const markDelivered = useCallback(async (orderId: string) => {
    patchLocal(orderId, { status: "delivered", deliveredAt: new Date() });
    if (!IS_DEV_MODE) {
      const { updateOrderStatus } = await import("@/integrations/supabase/queries");
      await updateOrderStatus(orderId, "delivered");
    }
  }, []);

  const editOrder = useCallback(async (
    orderId: string,
    patch: Partial<Pick<LiveOrder, "customerName"|"customerPhone"|"deliveryAddress"|"notes"|"subtotal"|"deliveryFee"|"tax"|"total"|"items">>
  ) => {
    patchLocal(orderId, patch);
    if (!IS_DEV_MODE) {
      const { updateOrder } = await import("@/integrations/supabase/queries");
      const { subtotal = 0, deliveryFee = 0, tax = 0, total = 0, items = [] } = patch;
      await updateOrder(
        orderId,
        {
          customer_name:    patch.customerName,
          customer_phone:   patch.customerPhone,
          delivery_address: patch.deliveryAddress,
          notes:            patch.notes,
          subtotal, delivery_fee: deliveryFee, tax, total,
        },
        items.map(i => ({
          menu_item_id: i.menuItemId,
          name: i.name,
          unit_price: i.unitPrice,
          quantity: i.quantity,
          notes: i.notes,
        }))
      );
    }
  }, []);

  const cancelOrder = useCallback(async (
    orderId: string, reason: string, _cancelledBy?: string
  ) => {
    patchLocal(orderId, { status: "cancelled", cancellationReason: reason, cancelledAt: new Date() });
    if (!IS_DEV_MODE) {
      const { updateOrderStatus } = await import("@/integrations/supabase/queries");
      await updateOrderStatus(orderId, "cancelled", { cancellation_note: reason });
    }
  }, []);

  const reportIssue = useCallback(async (
    orderId: string, reason: string, note?: string
  ) => {
    patchLocal(orderId, { hasIssue: true, issueReason: reason });
    if (!IS_DEV_MODE) {
      const { reportIssue: dbReport } = await import("@/integrations/supabase/queries");
      await dbReport(orderId, { issue_reason_id: reason, issue_note: note, reported_by: "" });
    }
  }, []);

  return (
    <OrderContext.Provider value={{
      orders, isLoading, loadError,
      addOrder, editOrder, markPreparing, markReady,
      assignAndDispatch, markDelivered, cancelOrder, reportIssue,
      refetch: () => loadOrders(true),
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
}

// ── DB → LiveOrder (full query result with joins) ─────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFullOrder(o: any): LiveOrder {
  return {
    id: o.id,
    orderNumber: o.order_number,
    type: o.type,
    status: o.status,
    source: o.source,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    tax: Number(o.tax),
    total: Number(o.total),
    paymentMethod: o.payment_method ?? undefined,
    customerName: o.customer_name ?? undefined,
    customerPhone: o.customer_phone ?? undefined,
    deliveryAddress: o.delivery_address ?? undefined,
    zone: (o.delivery_area as { name?: string } | undefined)?.name,
    notes: o.notes ?? undefined,
    cashierId: o.cashier_id ?? undefined,
    driverId: o.driver_id ?? undefined,
    driverName: (o.driver as { display_name?: string } | undefined)?.display_name,
    items: (o.items ?? []).map((i: { menu_item_id: string; name: string; quantity: number; unit_price: number; notes?: string | null }) => ({
      menuItemId: i.menu_item_id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      notes: i.notes ?? undefined,
    })),
    createdAt: new Date(o.created_at),
    updatedAt: new Date(o.updated_at),
    preparingAt: o.preparing_at ? new Date(o.preparing_at) : undefined,
    readyAt: o.ready_at ? new Date(o.ready_at) : undefined,
    deliveringAt: o.delivering_at ? new Date(o.delivering_at) : undefined,
    deliveredAt: o.delivered_at ? new Date(o.delivered_at) : undefined,
    cancelledAt: o.cancelled_at ? new Date(o.cancelled_at) : undefined,
    hasIssue: o.has_issue,
    issueReason: o.issue_reason_id ?? undefined,
  };
}

// ── DB → LiveOrder (production) ───────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbOrderToLive(o: any): LiveOrder {
  return {
    id: o.id,
    orderNumber: o.order_number,
    type: o.type,
    status: o.status,
    source: o.source,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    tax: Number(o.tax),
    total: Number(o.total),
    paymentMethod: o.payment_method,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    deliveryAddress: o.delivery_address,
    zone: o.delivery_area?.name,
    notes: o.notes,
    driverId: o.driver_id,
    driverName: o.driver?.display_name,
    items: (o.items ?? []).map((i: { menu_item_id: string; name: string; quantity: number; unit_price: number; notes?: string }) => ({
      menuItemId: i.menu_item_id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      notes: i.notes,
    })),
    createdAt: new Date(o.created_at),
    updatedAt: new Date(o.updated_at),
    preparingAt: o.preparing_at ? new Date(o.preparing_at) : undefined,
    readyAt: o.ready_at ? new Date(o.ready_at) : undefined,
    deliveringAt: o.delivering_at ? new Date(o.delivering_at) : undefined,
    deliveredAt: o.delivered_at ? new Date(o.delivered_at) : undefined,
    cancelledAt: o.cancelled_at ? new Date(o.cancelled_at) : undefined,
    hasIssue: o.has_issue,
    issueReason: o.issue_reason_id,
  };
}
