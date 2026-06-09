/**
 * useOrdersRealtime — subscribe to live order changes via Supabase Realtime.
 * Works on top of a local React state so consumers don't need to manage channels.
 *
 * Usage:
 *   const { orders, isLoading } = useOrdersRealtime({ status: ["pending","preparing"] });
 */
import { useEffect, useState, useCallback } from "react";
import { getOrders } from "@/integrations/supabase/queries";
import { subscribeToOrders } from "@/integrations/supabase/realtime";
import type { Order, OrderStatus, OrderType } from "@/integrations/supabase/types";
import { IS_DEV_MODE } from "@/lib/dev-mock";

interface Options {
  status?: OrderStatus | OrderStatus[];
  type?: OrderType;
  /** Disable realtime (for dev/mock mode) */
  disableRealtime?: boolean;
}

interface Result {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrdersRealtime(opts: Options = {}): Result {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getOrders({ status: opts.status, type: opts.type });
      setOrders(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message ?? "خطأ في تحميل الطلبات");
    } finally {
      setIsLoading(false);
    }
  }, [opts.status, opts.type]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    // In dev mode (mock data) skip realtime
    if (IS_DEV_MODE || opts.disableRealtime) return;

    const unsub = subscribeToOrders({
      onInsert: (newOrder) => {
        // Only add if passes current filters
        const statuses = opts.status
          ? Array.isArray(opts.status) ? opts.status : [opts.status]
          : null;
        if (statuses && !statuses.includes(newOrder.status)) return;
        if (opts.type && newOrder.type !== opts.type) return;
        setOrders((prev) => [newOrder, ...prev]);
      },
      onUpdate: (updatedOrder) => {
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o.id === updatedOrder.id);
          if (idx === -1) {
            // Might have just transitioned into our filtered set
            const statuses = opts.status
              ? Array.isArray(opts.status) ? opts.status : [opts.status]
              : null;
            if (!statuses || statuses.includes(updatedOrder.status)) {
              return [updatedOrder, ...prev];
            }
            return prev;
          }
          // If status no longer matches filter, remove it
          const statuses = opts.status
            ? Array.isArray(opts.status) ? opts.status : [opts.status]
            : null;
          if (statuses && !statuses.includes(updatedOrder.status)) {
            return prev.filter((o) => o.id !== updatedOrder.id);
          }
          const next = [...prev];
          next[idx] = updatedOrder;
          return next;
        });
      },
      onDelete: (id) => {
        setOrders((prev) => prev.filter((o) => o.id !== id));
      },
    });

    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { orders, isLoading, error, refetch: fetchOrders };
}
