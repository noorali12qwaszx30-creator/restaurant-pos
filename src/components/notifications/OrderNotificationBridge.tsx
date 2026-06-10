/**
 * OrderNotificationBridge — يراقب تغيرات الطلبات في OrderContext
 * ويطلق إشعارات قطرة الماء عند كل حدث مهم.
 *
 * يُوضع داخل كلا الـ Provider:
 *   <NotifyProvider>
 *     <OrderNotificationBridge />
 *     <AppRouter />
 *   </NotifyProvider>
 */
import { useEffect, useRef } from "react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { useNotify } from "./NotificationContext";

const TYPE_LABELS: Record<LiveOrder["type"], string> = {
  delivery:  "توصيل",
  takeaway:  "سفري",
  dine_in:   "داخل المطعم",
  pickup:    "استلام",
};

export function OrderNotificationBridge() {
  const { orders } = useOrders();
  const { notify } = useNotify();

  // Track previous statuses to detect transitions
  const prevStatuses = useRef<Map<string, LiveOrder["status"]>>(new Map());
  const initialized  = useRef(false);

  useEffect(() => {
    if (orders.length === 0) return;

    // First load — seed the map silently without notifications
    if (!initialized.current) {
      orders.forEach(o => prevStatuses.current.set(o.id, o.status));
      initialized.current = true;
      return;
    }

    orders.forEach(order => {
      const prev = prevStatuses.current.get(order.id);

      // New order (never seen before)
      if (prev === undefined) {
        prevStatuses.current.set(order.id, order.status);
        const typeLabel = TYPE_LABELS[order.type] ?? order.type;
        const num = order.orderNumber ? `#${order.orderNumber}` : "";
        notify({
          type: "order",
          title: `طلب جديد ${num}`,
          message: `${typeLabel} · ${order.total.toLocaleString("en-US")} د.ع`,
          duration: 4500,
        });
        return;
      }

      // Status changed
      if (prev !== order.status) {
        prevStatuses.current.set(order.id, order.status);
        const num = order.orderNumber ? `#${order.orderNumber}` : "";
        const typeLabel = TYPE_LABELS[order.type] ?? order.type;

        switch (order.status) {
          case "preparing":
            notify({
              type: "kitchen",
              title: `بدأ التحضير ${num}`,
              message: `${typeLabel} · المطبخ بدأ بالتجهيز`,
              duration: 3500,
            });
            break;
          case "ready":
            notify({
              type: "ready",
              title: `جاهز للاستلام ${num}`,
              message: `${typeLabel} · الطلب جاهز الآن`,
              duration: 5000,
            });
            break;
          case "delivering":
          case "out_for_delivery":
            notify({
              type: "delivery",
              title: `خرج للتوصيل ${num}`,
              message: `${typeLabel} · السائق في الطريق`,
              duration: 4000,
            });
            break;
          case "delivered":
            notify({
              type: "success",
              title: `تم التسليم ${num}`,
              message: `${typeLabel} · ${order.total.toLocaleString("en-US")} د.ع`,
              duration: 4000,
            });
            break;
          case "cancelled":
            notify({
              type: "error",
              title: `تم الإلغاء ${num}`,
              message: order.cancellationReason ?? typeLabel,
              duration: 4500,
            });
            break;
        }
      }
    });

    // Clean up stale entries (deleted orders)
    const currentIds = new Set(orders.map(o => o.id));
    prevStatuses.current.forEach((_, id) => {
      if (!currentIds.has(id)) prevStatuses.current.delete(id);
    });
  }, [orders, notify]);

  return null;
}
