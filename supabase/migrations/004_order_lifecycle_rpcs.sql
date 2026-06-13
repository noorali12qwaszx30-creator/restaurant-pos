-- ============================================================
-- 004 — دورة حياة الطلب: حالة assigned + دوال الانتقال الآمنة
--        + RPC إنشاء الطلب الذرّي + Views الإيرادات
--
-- ملف ترحيل جديد (لا يعدّل 001/002/003 المطبّقة).
-- إضافي وغير كاسر — آمن للتطبيق على قاعدة الإنتاج الحالية.
-- نفّذه في: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1) إضافة حالة assigned (مُسند بانتظار قبول السائق) ──────────
-- ملاحظة: ADD VALUE لا يمكن تنفيذه داخل transaction block،
--         لذا نفّذ هذا القسم وحده أولاً إن لزم.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'assigned' AFTER 'ready';

-- ============================================================
-- ── 2) مصفوفة الانتقالات المسموحة حسب الدور ───────────────────
-- ============================================================
CREATE OR REPLACE FUNCTION can_transition_order_status(
  p_current order_status,
  p_target  order_status,
  p_role    text
)
RETURNS boolean
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    -- المدير: أي انتقال (يُسجَّل)
    WHEN p_role = 'admin' THEN true

    -- المطبخ: pending → preparing فقط
    WHEN p_role = 'kitchen' THEN
      (p_current = 'pending'  AND p_target = 'preparing')

    -- الميدان: preparing→ready, ready→assigned, assigned→assigned (إعادة تعيين)
    WHEN p_role = 'field' THEN
      (p_current = 'preparing' AND p_target = 'ready')
      OR (p_current = 'ready'    AND p_target = 'assigned')
      OR (p_current = 'assigned' AND p_target = 'assigned')

    -- التوصيل: assigned→delivering (قبول), assigned→ready (رفض), delivering→delivered
    WHEN p_role = 'delivery' THEN
      (p_current = 'assigned'   AND p_target = 'delivering')
      OR (p_current = 'assigned'   AND p_target = 'ready')
      OR (p_current = 'delivering' AND p_target = 'delivered')

    -- الكاشير: الإلغاء فقط (قبل التسليم)
    WHEN p_role = 'cashier' THEN
      (p_target = 'cancelled' AND p_current <> 'delivered')

    ELSE false
  END;
$$;

-- ============================================================
-- ── 3) RPC تغيير حالة الطلب الآمن ─────────────────────────────
--     يتحقق من: المستخدم، دوره، مطعمه، الحالة الحالية،
--     الانتقال المسموح. يسجّل في activity_logs.
-- ============================================================
CREATE OR REPLACE FUNCTION change_order_status(
  p_order_id   uuid,
  p_new_status order_status,
  p_driver_id  uuid    DEFAULT NULL,
  p_reason_id  uuid    DEFAULT NULL,
  p_note       text    DEFAULT NULL
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_order    orders;
  v_roles    text[];
  v_role     text;
  v_allowed  boolean := false;
  v_is_super boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'غير مصرّح: لا توجد جلسة';
  END IF;

  SELECT roles, ('super_admin' = ANY(roles))
    INTO v_roles, v_is_super
  FROM profiles WHERE id = v_uid;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;

  -- عزل المطعم: لا يُسمح بالعبث بطلبات مطعم آخر
  IF NOT v_is_super AND v_order.restaurant_id IS DISTINCT FROM current_restaurant_id() THEN
    RAISE EXCEPTION 'غير مصرّح: الطلب لا يتبع مطعمك';
  END IF;

  -- التحقق من السماح بالانتقال لأيٍّ من أدوار المستخدم
  IF v_is_super THEN
    v_allowed := true;
  ELSE
    FOREACH v_role IN ARRAY v_roles LOOP
      IF can_transition_order_status(v_order.status, p_new_status, v_role) THEN
        v_allowed := true;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'انتقال غير مسموح: % → %', v_order.status, p_new_status;
  END IF;

  -- تطبيق التحديث مع الطوابع الزمنية المناسبة
  UPDATE orders SET
    status        = p_new_status,
    driver_id     = CASE
                      WHEN p_new_status = 'ready'  THEN NULL            -- رفض السائق يزيل التعيين
                      WHEN p_driver_id IS NOT NULL THEN p_driver_id
                      ELSE driver_id
                    END,
    preparing_at  = CASE WHEN p_new_status = 'preparing'  THEN now() ELSE preparing_at  END,
    ready_at      = CASE WHEN p_new_status = 'ready'       THEN now() ELSE ready_at      END,
    delivering_at = CASE WHEN p_new_status = 'delivering'  THEN now() ELSE delivering_at END,
    delivered_at  = CASE WHEN p_new_status = 'delivered'   THEN now() ELSE delivered_at  END,
    cancelled_at  = CASE WHEN p_new_status = 'cancelled'   THEN now() ELSE cancelled_at  END,
    cancellation_reason_id = CASE WHEN p_new_status = 'cancelled' THEN p_reason_id ELSE cancellation_reason_id END,
    cancellation_note      = CASE WHEN p_new_status = 'cancelled' THEN p_note      ELSE cancellation_note      END,
    cancelled_by           = CASE WHEN p_new_status = 'cancelled' THEN v_uid       ELSE cancelled_by           END,
    updated_at    = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  -- تسجيل النشاط
  INSERT INTO activity_logs (order_id, user_id, action, details, restaurant_id)
  VALUES (
    p_order_id, v_uid, 'order_status_change',
    jsonb_build_object('to', p_new_status, 'driver_id', p_driver_id, 'note', p_note),
    v_order.restaurant_id
  );

  RETURN v_order;
END;
$$;

-- ============================================================
-- ── 4) RPC إنشاء الطلب الذرّي مع عناصره ───────────────────────
--     يحسب الأسعار من قاعدة البيانات لا من المتصفح.
--     رسوم التوصيل من delivery_areas. لا تدخل ضمن subtotal.
-- ============================================================
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_type             order_type,
  p_source           order_source,
  p_payment_method   payment_method,
  p_items            jsonb,            -- [{ "menu_item_id": uuid, "quantity": int, "notes": text }]
  p_customer_name    text DEFAULT NULL,
  p_customer_phone   text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_delivery_area_id uuid DEFAULT NULL,
  p_notes            text DEFAULT NULL
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_rest      uuid := current_restaurant_id();
  v_subtotal  numeric(10,2) := 0;
  v_delivery  numeric(10,2) := 0;
  v_tax       numeric(10,2) := 0;
  v_total     numeric(10,2);
  v_order     orders;
  v_item      jsonb;
  v_price     numeric(10,2);
  v_name      text;
  v_qty       int;
BEGIN
  IF v_uid IS NULL OR v_rest IS NULL THEN
    RAISE EXCEPTION 'غير مصرّح: لا توجد جلسة أو مطعم';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'الطلب فارغ';
  END IF;

  -- رسوم التوصيل من المنطقة (لطلبات التوصيل فقط)
  IF p_type = 'delivery' AND p_delivery_area_id IS NOT NULL THEN
    SELECT fee INTO v_delivery FROM delivery_areas
    WHERE id = p_delivery_area_id AND restaurant_id = v_rest;
    v_delivery := COALESCE(v_delivery, 0);
  END IF;

  -- إنشاء الطلب أولاً للحصول على id (subtotal/total يُحدّثان بعد العناصر)
  INSERT INTO orders (
    type, status, source, payment_method,
    customer_name, customer_phone, delivery_address, delivery_area_id, notes,
    subtotal, delivery_fee, tax, total,
    cashier_id, restaurant_id
  ) VALUES (
    p_type, 'pending', p_source, p_payment_method,
    p_customer_name, p_customer_phone, p_delivery_address, p_delivery_area_id, p_notes,
    0, v_delivery, 0, v_delivery,
    v_uid, v_rest
  ) RETURNING * INTO v_order;

  -- إدراج العناصر بأسعار قاعدة البيانات
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := GREATEST(COALESCE((v_item->>'quantity')::int, 1), 1);

    SELECT price, name INTO v_price, v_name FROM menu_items
    WHERE id = (v_item->>'menu_item_id')::uuid AND restaurant_id = v_rest;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'صنف غير موجود في هذا المطعم: %', v_item->>'menu_item_id';
    END IF;

    INSERT INTO order_items (order_id, menu_item_id, name, unit_price, quantity, notes)
    VALUES (v_order.id, (v_item->>'menu_item_id')::uuid, v_name, v_price, v_qty, v_item->>'notes');

    v_subtotal := v_subtotal + (v_price * v_qty);
  END LOOP;

  v_total := v_subtotal + v_delivery + v_tax;

  UPDATE orders SET subtotal = v_subtotal, tax = v_tax, total = v_total, updated_at = now()
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  INSERT INTO activity_logs (order_id, user_id, action, details, restaurant_id)
  VALUES (v_order.id, v_uid, 'order_created',
          jsonb_build_object('total', v_total, 'items', jsonb_array_length(p_items)),
          v_rest);

  RETURN v_order;
END;
$$;

-- ============================================================
-- ── 5) Views موحّدة للإيرادات ─────────────────────────────────
--     إيراد المطعم = total - delivery_fee للطلبات delivered فقط.
--     رسوم التوصيل تُنسب للسائق ولا تدخل إيراد المطعم.
--     security_invoker حتى تُطبَّق RLS على القارئ.
-- ============================================================
CREATE OR REPLACE VIEW restaurant_revenue
WITH (security_invoker = true) AS
  SELECT
    restaurant_id,
    COUNT(*)                       AS delivered_orders,
    SUM(total - delivery_fee)      AS net_revenue,   -- إيراد المطعم الصافي
    SUM(delivery_fee)              AS delivery_fees, -- مستحقات السائقين
    SUM(total)                     AS gross_total
  FROM orders
  WHERE status = 'delivered'
  GROUP BY restaurant_id;

CREATE OR REPLACE VIEW driver_earnings
WITH (security_invoker = true) AS
  SELECT
    restaurant_id,
    driver_id,
    COUNT(*)              AS delivered_orders,
    SUM(delivery_fee)     AS total_earnings
  FROM orders
  WHERE status = 'delivered' AND driver_id IS NOT NULL
  GROUP BY restaurant_id, driver_id;

-- ============================================================
-- ── 6) قراءة الطلبات للسائق: المسندة إليه فقط ─────────────────
--     (سياسة SELECT إضافية — لا تُلغي عزل المطعم القائم)
-- ============================================================
DROP POLICY IF EXISTS "orders_driver_select" ON orders;
CREATE POLICY "orders_driver_select" ON orders
  FOR SELECT USING (
    driver_id = auth.uid()
  );

-- ── 7) منح صلاحية تنفيذ الدوال للمستخدمين المصادَقين ──────────
GRANT EXECUTE ON FUNCTION change_order_status(uuid, order_status, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_items(order_type, order_source, payment_method, jsonb, text, text, text, uuid, text) TO authenticated;
GRANT SELECT ON restaurant_revenue TO authenticated;
GRANT SELECT ON driver_earnings TO authenticated;
