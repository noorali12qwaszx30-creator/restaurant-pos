-- ============================================================
-- 005 — استعادة دور المستخدم takeaway (موظف السفري)
--
-- ملف ترحيل جديد (لا يعدّل ترحيلاً مطبّقاً).
-- يضيف الدور للـ enum، ويحدّث مصفوفة الانتقالات + RPC تغيير الحالة
-- لفرض قيود دور السفري في قاعدة البيانات.
--
-- نفّذ القسمين بالترتيب: BLOCK A وحدها أولاً، ثم BLOCK B.
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- BLOCK A — نفّذها وحدها أولاً (ADD VALUE خارج أي دفعة تستخدمه)
-- ════════════════════════════════════════════════════════════════
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'takeaway';


-- ════════════════════════════════════════════════════════════════
-- BLOCK B — بعد نجاح BLOCK A
-- ════════════════════════════════════════════════════════════════

-- (1) مصفوفة الانتقالات: إضافة فرع دور takeaway
--     ready → delivered (تسليم للزبون) + الإلغاء قبل التسليم.
--     لا يملك pending→preparing (مطبخ) ولا preparing→ready (ميدان)
--     ولا انتقالات السائق (assigned/delivering).
CREATE OR REPLACE FUNCTION can_transition_order_status(
  p_current order_status, p_target order_status, p_role text
) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN p_role = 'admin' THEN true
    WHEN p_role = 'kitchen' THEN (p_current = 'pending' AND p_target = 'preparing')
    WHEN p_role = 'field' THEN
      (p_current = 'preparing' AND p_target = 'ready')
      OR (p_current = 'ready' AND p_target = 'assigned')
      OR (p_current = 'assigned' AND p_target = 'assigned')
    WHEN p_role = 'delivery' THEN
      (p_current = 'assigned' AND p_target = 'delivering')
      OR (p_current = 'assigned' AND p_target = 'ready')
      OR (p_current = 'delivering' AND p_target = 'delivered')
    WHEN p_role = 'takeaway' THEN
      (p_current = 'ready' AND p_target = 'delivered')
      OR (p_target = 'cancelled' AND p_current <> 'delivered')
    WHEN p_role = 'cashier' THEN (p_target = 'cancelled' AND p_current <> 'delivered')
    ELSE false
  END;
$$;

-- (2) RPC تغيير الحالة: قيد إضافي — دور takeaway يعمل على طلبات
--     النوع takeaway فقط (لا يلمس delivery أو pickup).
CREATE OR REPLACE FUNCTION change_order_status(
  p_order_id uuid, p_new_status order_status,
  p_driver_id uuid DEFAULT NULL, p_reason_id uuid DEFAULT NULL, p_note text DEFAULT NULL
) RETURNS orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order orders; v_roles text[]; v_role text;
  v_allowed boolean := false; v_is_super boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'غير مصرّح: لا توجد جلسة'; END IF;
  SELECT roles, ('super_admin' = ANY(roles)) INTO v_roles, v_is_super FROM profiles WHERE id = v_uid;
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'الطلب غير موجود'; END IF;
  IF NOT v_is_super AND v_order.restaurant_id IS DISTINCT FROM current_restaurant_id() THEN
    RAISE EXCEPTION 'غير مصرّح: الطلب لا يتبع مطعمك';
  END IF;

  IF v_is_super THEN
    v_allowed := true;
  ELSE
    FOREACH v_role IN ARRAY v_roles LOOP
      -- دور السفري لا يتصرّف إلا في طلبات النوع takeaway
      IF v_role = 'takeaway' AND v_order.type <> 'takeaway' THEN
        CONTINUE;
      END IF;
      IF can_transition_order_status(v_order.status, p_new_status, v_role) THEN
        v_allowed := true; EXIT;
      END IF;
    END LOOP;
  END IF;

  IF NOT v_allowed THEN RAISE EXCEPTION 'انتقال غير مسموح: % → %', v_order.status, p_new_status; END IF;

  UPDATE orders SET
    status = p_new_status,
    driver_id = CASE WHEN p_new_status = 'ready' THEN NULL
                     WHEN p_driver_id IS NOT NULL THEN p_driver_id ELSE driver_id END,
    preparing_at  = CASE WHEN p_new_status = 'preparing'  THEN now() ELSE preparing_at  END,
    ready_at      = CASE WHEN p_new_status = 'ready'       THEN now() ELSE ready_at      END,
    delivering_at = CASE WHEN p_new_status = 'delivering'  THEN now() ELSE delivering_at END,
    delivered_at  = CASE WHEN p_new_status = 'delivered'   THEN now() ELSE delivered_at  END,
    cancelled_at  = CASE WHEN p_new_status = 'cancelled'   THEN now() ELSE cancelled_at  END,
    cancellation_reason_id = CASE WHEN p_new_status = 'cancelled' THEN p_reason_id ELSE cancellation_reason_id END,
    cancellation_note      = CASE WHEN p_new_status = 'cancelled' THEN p_note      ELSE cancellation_note      END,
    cancelled_by           = CASE WHEN p_new_status = 'cancelled' THEN v_uid       ELSE cancelled_by           END,
    updated_at = now()
  WHERE id = p_order_id RETURNING * INTO v_order;

  INSERT INTO activity_logs (order_id, user_id, action, details, restaurant_id)
  VALUES (p_order_id, v_uid, 'order_status_change',
          jsonb_build_object('to', p_new_status, 'driver_id', p_driver_id, 'note', p_note),
          v_order.restaurant_id);
  RETURN v_order;
END; $$;

GRANT EXECUTE ON FUNCTION change_order_status(uuid, order_status, uuid, uuid, text) TO authenticated;

-- ملاحظة RLS: عزل المطعم قائم عبر سياسة orders_tenant (كل أدوار المطعم
-- تقرأ طلبات مطعمها). تقييد رؤية دور السفري لطلبات النوع takeaway فقط
-- يتم على الواجهة (فلترة o.type === 'takeaway')، بينما الفرض الأمني الحرج
-- (منع التصرّف في طلبات غير السفري) مطبّق في change_order_status أعلاه.
