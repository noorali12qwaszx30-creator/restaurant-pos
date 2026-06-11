/**
 * useOrdersRealtime — subscribe to live order changes via Supabase Realtime.
 * Multi-tenant: filters by restaurantId from AuthContext.
 */
import { useEffect, useState, useCallback } from "react";
import { getOrders } from "@/integrations/supabase/queries";
import { subscribeToOrders } from "@/integrations/supabase/realtime";
import type { Order, OrderStatus, OrderType } from "@/integrations/supabase/types";
import { IS_DEV_MODE } from "@/lib/dev-mock";
import { useAuth } from "@/contexts/AuthContext";

interface Options {
  status?: OrderStatus | OrderStatus[];
  type?: OrderType;
  disableRealtime?: boolean;
}

interface Result {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrdersRealtime(opts: Options = {}): Result {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurantId ?? null;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getOrders(restaurantId, { status: opts.status, type: opts.type });
      setOrders(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message ?? "خطأ في تحميل الطلبات");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, opts.status, opts.type]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (IS_DEV_MODE || opts.disableRealtime) return;

    const unsub = subscribeToOrders(restaurantId, {
      onInsert: (newOrder) => {
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
            const statuses = opts.status
              ? Array.isArray(opts.status) ? opts.status : [opts.status]
              : null;
            if (!statuses || statuses.includes(updatedOrder.status)) {
              return [updatedOrder, ...prev];
            }
            return prev;
          }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  return { orders, isLoading, error, refetch: fetchOrders };
}
