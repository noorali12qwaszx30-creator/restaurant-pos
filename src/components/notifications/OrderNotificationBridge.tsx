/**
 * OrderNotificationBridge — يراقب تغيرات الطلبات ويطلق إشعارات قطرة الماء.
 * يُوضع مرة واحدة داخل AppRouter بعد تحميل المزودين.
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

  // id → last known status
  const prevStatuses = useRef<Map<string, LiveOrder["status"]>>(new Map());
  // ids seen in the FIRST load — never fire notifications for these
  const initialized  = useRef(false);
  // ids that just arrived as "new" this tick — skip status-change for them
  const newThisTick  = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (orders.length === 0) return;

    // ── First render: seed silently ──
    if (!initialized.current) {
      orders.forEach(o => prevStatuses.current.set(o.id, o.status));
      initialized.current = true;
      return;
    }

    newThisTick.current.clear();

    orders.forEach(order => {
      const prev = prevStatuses.current.get(order.id);

      // ── Brand-new order ──
      if (prev === undefined) {
        prevStatuses.current.set(order.id, order.status);
        newThisTick.current.add(order.id);
        const typeLabel = TYPE_LABELS[order.type] ?? order.type;
        const num = order.orderNumber ? `#${order.orderNumber}` : "";
        notify({
          type: "order",
          title: `طلب جديد ${num}`.trim(),
          message: `${typeLabel} · ${order.total.toLocaleString("en-US")} د.ع`,
          duration: 4000,
        });
        return;
      }

      // ── Status change (skip if it was just added this tick) ──
      if (prev !== order.status && !newThisTick.current.has(order.id)) {
        prevStatuses.current.set(order.id, order.status);
        const num = order.orderNumber ? `#${order.orderNumber}` : "";
        const typeLabel = TYPE_LABELS[order.type] ?? order.type;

        switch (order.status) {
          case "preparing":
            notify({ type: "kitchen",  title: `بدأ التحضير ${num}`.trim(),      message: `${typeLabel} · المطبخ بدأ التجهيز`,    duration: 3500 });
            break;
          case "ready":
            notify({ type: "ready",    title: `جاهز للاستلام ${num}`.trim(),    message: `${typeLabel} · الطلب جاهز الآن`,       duration: 5000 });
            break;
          case "delivering":
          case "out_for_delivery":
            notify({ type: "delivery", title: `خرج للتوصيل ${num}`.trim(),      message: `${typeLabel} · السائق في الطريق`,     duration: 4000 });
            break;
          case "delivered":
            notify({ type: "success",  title: `تم التسليم ${num}`.trim(),       message: `${typeLabel} · ${order.total.toLocaleString("en-US")} د.ع`, duration: 4000 });
            break;
          case "cancelled":
            notify({ type: "error",    title: `تم الإلغاء ${num}`.trim(),       message: order.cancellationReason ?? typeLabel,  duration: 4500 });
            break;
        }
      }
    });

    // cleanup deleted orders
    const ids = new Set(orders.map(o => o.id));
    prevStatuses.current.forEach((_, id) => { if (!ids.has(id)) prevStatuses.current.delete(id); });

  }, [orders, notify]);

  return null;
}
