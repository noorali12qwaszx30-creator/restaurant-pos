-- ============================================================
-- إصلاح: قائمة المطاعم فارغة في شاشة تسجيل الدخول
-- نفّذ هذا الملف في: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- السماح لأي زائر (قبل تسجيل الدخول) بقراءة المطاعم النشطة فقط
DROP POLICY IF EXISTS "restaurants_public_read" ON restaurants;
CREATE POLICY "restaurants_public_read" ON restaurants
  FOR SELECT USING (is_active = true);

-- تحقق سريع — يجب أن تظهر المطاعم النشطة
SELECT id, name, is_active FROM restaurants WHERE is_active = true;
