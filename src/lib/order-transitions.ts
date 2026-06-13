/**
 * مصفوفة انتقالات حالة الطلب — تعكس دالة can_transition_order_status في القاعدة.
 * تُستخدم للتحقق على الواجهة (تعطيل الأزرار)، والفرض الفعلي يبقى في القاعدة (RPC).
 */
import type { OrderStatus, UserRole } from "@/integrations/supabase/types";

export function canTransition(
  current: OrderStatus,
  target: OrderStatus,
  role: UserRole
): boolean {
  switch (role) {
    // المدير وصاحب النظام: أي انتقال (يُسجَّل)
    case "admin":
    case "super_admin":
      return true;

    // المطبخ: pending → preparing فقط
    case "kitchen":
      return current === "pending" && target === "preparing";

    // الميدان: preparing→ready, ready→assigned, assigned→assigned (إعادة تعيين)
    case "field":
      return (
        (current === "preparing" && target === "ready") ||
        (current === "ready" && target === "assigned") ||
        (current === "assigned" && target === "assigned")
      );

    // التوصيل: assigned→delivering (قبول), assigned→ready (رفض), delivering→delivered
    case "delivery":
      return (
        (current === "assigned" && target === "delivering") ||
        (current === "assigned" && target === "ready") ||
        (current === "delivering" && target === "delivered")
      );

    // السفري: ready→delivered (تسليم للزبون) + الإلغاء قبل التسليم
    // (لا يملك assigned/delivering الخاصة بالسائق، ولا pending→preparing/preparing→ready)
    case "takeaway":
      return (
        (current === "ready" && target === "delivered") ||
        (target === "cancelled" && current !== "delivered")
      );

    // الكاشير: الإلغاء فقط قبل التسليم
    case "cashier":
      return target === "cancelled" && current !== "delivered";

    default:
      return false;
  }
}

/** هل يملك المستخدم (بأيٍّ من أدواره) صلاحية هذا الانتقال؟ */
export function anyRoleCanTransition(
  current: OrderStatus,
  target: OrderStatus,
  roles: UserRole[]
): boolean {
  return roles.some(r => canTransition(current, target, r));
}
