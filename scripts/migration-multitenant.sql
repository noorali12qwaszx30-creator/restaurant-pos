-- ============================================================
-- Multi-Tenant Migration
-- Run this in Supabase SQL editor
-- ============================================================

-- 1. جدول المطاعم
CREATE TABLE IF NOT EXISTS restaurants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  logo        TEXT,
  phone       TEXT,
  address     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. إضافة super_admin للـ enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_admin'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
END$$;

-- 3. إضافة restaurant_id لجدول profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL;

-- 4. إضافة restaurant_id لجدول orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- 5. إضافة restaurant_id لجدول menu_categories
ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- 6. إضافة restaurant_id لجدول menu_items
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- 7. إضافة restaurant_id لجدول delivery_areas
ALTER TABLE delivery_areas
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- 8. إضافة restaurant_id لجدول cancellation_reasons
ALTER TABLE cancellation_reasons
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- 9. إضافة restaurant_id لجدول issue_reasons
ALTER TABLE issue_reasons
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- 10. إضافة restaurant_id لجدول activity_logs
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- 11. إضافة restaurant_id لجدول push_tokens
ALTER TABLE push_tokens
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- ============================================================
-- دوال مساعدة
-- ============================================================

-- دالة تُعيد restaurant_id الخاص بالمستخدم الحالي
CREATE OR REPLACE FUNCTION current_restaurant_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT restaurant_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- دالة تتحقق إذا كان المستخدم super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND 'super_admin' = ANY(roles)
  );
$$;

-- ============================================================
-- RLS Policies
-- ============================================================

-- restaurants
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurants_select" ON restaurants;
CREATE POLICY "restaurants_select" ON restaurants
  FOR SELECT USING (
    is_super_admin()
    OR id = current_restaurant_id()
  );

DROP POLICY IF EXISTS "restaurants_all_super" ON restaurants;
CREATE POLICY "restaurants_all_super" ON restaurants
  FOR ALL USING (is_super_admin());

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    is_super_admin()
    OR restaurant_id = current_restaurant_id()
    OR id = auth.uid()
  );

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_all_super" ON profiles;
CREATE POLICY "profiles_all_super" ON profiles
  FOR ALL USING (is_super_admin());

-- orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_tenant" ON orders;
CREATE POLICY "orders_tenant" ON orders
  FOR ALL USING (
    is_super_admin()
    OR restaurant_id = current_restaurant_id()
  );

-- menu_categories
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_categories_tenant" ON menu_categories;
CREATE POLICY "menu_categories_tenant" ON menu_categories
  FOR ALL USING (
    is_super_admin()
    OR restaurant_id = current_restaurant_id()
  );

-- menu_items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_items_tenant" ON menu_items;
CREATE POLICY "menu_items_tenant" ON menu_items
  FOR ALL USING (
    is_super_admin()
    OR restaurant_id = current_restaurant_id()
  );

-- delivery_areas
ALTER TABLE delivery_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_areas_tenant" ON delivery_areas;
CREATE POLICY "delivery_areas_tenant" ON delivery_areas
  FOR ALL USING (
    is_super_admin()
    OR restaurant_id = current_restaurant_id()
  );

-- cancellation_reasons
ALTER TABLE cancellation_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cancellation_reasons_tenant" ON cancellation_reasons;
CREATE POLICY "cancellation_reasons_tenant" ON cancellation_reasons
  FOR ALL USING (
    is_super_admin()
    OR restaurant_id = current_restaurant_id()
  );

-- issue_reasons
ALTER TABLE issue_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "issue_reasons_tenant" ON issue_reasons;
CREATE POLICY "issue_reasons_tenant" ON issue_reasons
  FOR ALL USING (
    is_super_admin()
    OR restaurant_id = current_restaurant_id()
  );

-- activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_tenant" ON activity_logs;
CREATE POLICY "activity_logs_tenant" ON activity_logs
  FOR ALL USING (
    is_super_admin()
    OR restaurant_id = current_restaurant_id()
  );

-- push_tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_tenant" ON push_tokens;
CREATE POLICY "push_tokens_tenant" ON push_tokens
  FOR ALL USING (
    is_super_admin()
    OR restaurant_id = current_restaurant_id()
  );

-- ============================================================
-- فهارس للأداء
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id         ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id      ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_areas_restaurant_id  ON delivery_areas(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_restaurant_id        ON profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_restaurant_id     ON push_tokens(restaurant_id);

-- ============================================================
-- مطعم تجريبي افتراضي (للبيانات الموجودة)
-- ============================================================
-- INSERT INTO restaurants (id, name, is_active) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'المطعم الرئيسي', true)
-- ON CONFLICT (id) DO NOTHING;

-- تحديث البيانات الموجودة لتربطها بالمطعم الافتراضي:
-- UPDATE orders            SET restaurant_id = '00000000-0000-0000-0000-000000000001' WHERE restaurant_id IS NULL;
-- UPDATE menu_categories   SET restaurant_id = '00000000-0000-0000-0000-000000000001' WHERE restaurant_id IS NULL;
-- UPDATE menu_items        SET restaurant_id = '00000000-0000-0000-0000-000000000001' WHERE restaurant_id IS NULL;
-- UPDATE delivery_areas    SET restaurant_id = '00000000-0000-0000-0000-000000000001' WHERE restaurant_id IS NULL;
-- UPDATE profiles          SET restaurant_id = '00000000-0000-0000-0000-000000000001' WHERE restaurant_id IS NULL AND NOT ('super_admin' = ANY(roles));
