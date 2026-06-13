-- ============================================================
-- أكواد الدخول الرقمية للحسابات التجريبية (10 خانات)
-- تطابق أكواد وضع التطوير. نفّذه في: Supabase SQL Editor.
--
-- ملاحظة: login_code يجب أن يكون فريداً داخل المطعم. التحقق منه
-- يتم عبر Edge Function (code-login) بصلاحية service_role فقط،
-- ولا يُقرأ مباشرة من الواجهة (محميّ بـ RLS).
--
-- بدّل <RESTAURANT_ID> بمعرّف مطعمك، وربط كل كود بالمستخدم الصحيح.
-- ============================================================

UPDATE profiles SET login_code = '1000000001'
  WHERE username = 'admin'    AND restaurant_id = '<RESTAURANT_ID>';
UPDATE profiles SET login_code = '1000000002'
  WHERE username = 'cashier1' AND restaurant_id = '<RESTAURANT_ID>';
UPDATE profiles SET login_code = '1000000003'
  WHERE username = 'kitchen1' AND restaurant_id = '<RESTAURANT_ID>';
UPDATE profiles SET login_code = '1000000004'
  WHERE username = 'field1'   AND restaurant_id = '<RESTAURANT_ID>';
UPDATE profiles SET login_code = '1000000005'
  WHERE username = 'delivery1' AND restaurant_id = '<RESTAURANT_ID>';

-- فهرس فريد للكود داخل المطعم (يمنع تكرار الكود في نفس المطعم)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_login_code_per_restaurant
  ON profiles (restaurant_id, login_code)
  WHERE login_code IS NOT NULL;

-- تحقق
SELECT username, login_code, restaurant_id FROM profiles
WHERE login_code IS NOT NULL ORDER BY login_code;
