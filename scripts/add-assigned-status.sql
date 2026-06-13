-- ============================================================
-- إضافة حالة "assigned" — الطلب مُسند لسائق بانتظار قبوله
-- نفّذ هذا الملف في: Supabase Dashboard → SQL Editor → Run
-- ============================================================

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'assigned' AFTER 'ready';

-- تحقق سريع — يجب أن تظهر القيمة الجديدة ضمن القائمة
SELECT unnest(enum_range(NULL::order_status)) AS status;
