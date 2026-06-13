/**
 * حساب الإيرادات — مصدر الحقيقة الوحيد لكل اللوحات.
 *
 * القاعدة (ثابتة):
 *   إيراد المطعم = Σ (total − delivery_fee) للطلبات delivered فقط.
 *   رسوم التوصيل تُنسب للسائق ولا تدخل ضمن إيراد المطعم.
 *
 * تطابق الـ View في القاعدة: restaurant_revenue / driver_earnings.
 */
import type { LiveOrder } from "@/contexts/OrderContext";

const isDelivered = (o: LiveOrder) => o.status === "delivered";

/** إيراد المطعم الصافي (بدون رسوم التوصيل) للطلبات المسلّمة فقط */
export function netRevenue(orders: LiveOrder[]): number {
  return orders
    .filter(isDelivered)
    .reduce((sum, o) => sum + (o.total - o.deliveryFee), 0);
}

/** إجمالي رسوم التوصيل (مستحقات السائقين) للطلبات المسلّمة فقط */
export function deliveryFeesTotal(orders: LiveOrder[]): number {
  return orders
    .filter(isDelivered)
    .reduce((sum, o) => sum + o.deliveryFee, 0);
}

/** عدد الطلبات المسلّمة */
export function deliveredCount(orders: LiveOrder[]): number {
  return orders.filter(isDelivered).length;
}

/** مستحقات سائق معيّن من رسوم التوصيل للطلبات المسلّمة المسندة إليه */
export function driverEarnings(orders: LiveOrder[], driverId: string): number {
  return orders
    .filter(o => isDelivered(o) && o.driverId === driverId)
    .reduce((sum, o) => sum + o.deliveryFee, 0);
}
