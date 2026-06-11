-- ═══════════════════════════════════════════════════════════════
-- Migration: Code-Based Login System
-- ═══════════════════════════════════════════════════════════════

-- 1. إضافة login_code لجدول profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_code VARCHAR(10);

-- 2. فهرس فريد: نفس الكود يمكن استخدامه في مطاعم مختلفة
CREATE UNIQUE INDEX IF NOT EXISTS profiles_restaurant_login_code_unique
ON profiles(restaurant_id, login_code)
WHERE login_code IS NOT NULL;

-- 3. توليد أكواد تلقائية للموظفين الحاليين (4 أرقام مبطنة بأصفار)
WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY created_at) AS rn
  FROM profiles
  WHERE login_code IS NULL
)
UPDATE profiles p
SET login_code = LPAD(n.rn::text, 4, '0')
FROM numbered n
WHERE p.id = n.id;

-- 4. سياسة RLS: السماح لـ anon بقراءة المطاعم النشطة (لصفحة الدخول)
DROP POLICY IF EXISTS "public_read_restaurants" ON restaurants;
CREATE POLICY "public_read_restaurants" ON restaurants
FOR SELECT TO anon
USING (is_active = true);

-- 5. عمود last_login_at لتسجيل آخر دخول
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- تحقق من النتيجة
SELECT username, restaurant_id, login_code, roles
FROM profiles
ORDER BY restaurant_id, login_code;
