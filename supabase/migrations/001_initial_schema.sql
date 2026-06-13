-- ══════════════════════════════════════════════════════════════
-- Twitter Restaurant POS — Initial Schema
-- ══════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fast text search

-- ── Enums ─────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('cashier','kitchen','field','delivery','admin');

CREATE TYPE order_status AS ENUM (
  'pending',        -- cashier created
  'preparing',      -- kitchen started
  'ready',          -- field approved
  'assigned',       -- driver assigned, awaiting driver acceptance
  'delivering',     -- driver accepted & on the way
  'delivered',      -- driver confirmed delivery
  'cancelled'       -- cancelled with reason
);

CREATE TYPE order_type AS ENUM ('delivery','takeaway','pickup','dine_in');

CREATE TYPE order_source AS ENUM (
  'local','phone','instagram','whatsapp','telegram'
);

CREATE TYPE payment_method AS ENUM ('cash','card','split');

-- ══════════════════════════════════════════════════════════════
-- PROFILES (extends Supabase auth.users)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  phone         TEXT,
  role          user_role NOT NULL DEFAULT 'cashier',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'cashier')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ══════════════════════════════════════════════════════════════
-- MENU CATEGORIES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE menu_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  name_en     TEXT,
  icon        TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- MENU ITEMS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE menu_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id      UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  name_en          TEXT,
  description      TEXT,
  price            NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url        TEXT,
  preparation_time INT  NOT NULL DEFAULT 15, -- minutes
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INT  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_name_trgm ON menu_items USING gin(name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════════
-- DELIVERY AREAS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE delivery_areas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  fee         NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- CANCELLATION REASONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE cancellation_reasons (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- ISSUE REASONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE issue_reasons (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- ORDERS
-- ══════════════════════════════════════════════════════════════
CREATE SEQUENCE order_seq START 1;

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        INT UNIQUE NOT NULL DEFAULT nextval('order_seq'),
  type                order_type NOT NULL,
  status              order_status NOT NULL DEFAULT 'pending',
  source              order_source NOT NULL DEFAULT 'local',

  -- Financial
  subtotal            NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  total               NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method      payment_method,

  -- Customer
  customer_name       TEXT,
  customer_phone      TEXT,
  delivery_address    TEXT,
  delivery_area_id    UUID REFERENCES delivery_areas(id),

  -- Notes
  notes               TEXT,

  -- Staff references
  cashier_id          UUID REFERENCES profiles(id),
  driver_id           UUID REFERENCES profiles(id),

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preparing_at        TIMESTAMPTZ,
  ready_at            TIMESTAMPTZ,
  delivering_at       TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,

  -- Cancellation
  cancellation_reason_id UUID REFERENCES cancellation_reasons(id),
  cancellation_note   TEXT,
  cancelled_by        UUID REFERENCES profiles(id),

  -- Issues
  has_issue           BOOLEAN NOT NULL DEFAULT FALSE,
  issue_reason_id     UUID REFERENCES issue_reasons(id),
  issue_note          TEXT,
  issue_reported_at   TIMESTAMPTZ,
  issue_reported_by   UUID REFERENCES profiles(id)
);

CREATE INDEX idx_orders_status    ON orders(status);
CREATE INDEX idx_orders_type      ON orders(type);
CREATE INDEX idx_orders_driver    ON orders(driver_id);
CREATE INDEX idx_orders_cashier   ON orders(cashier_id);
CREATE INDEX idx_orders_created   ON orders(created_at DESC);
CREATE INDEX idx_orders_number    ON orders(order_number DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Status-change timestamp triggers
CREATE OR REPLACE FUNCTION orders_status_timestamps()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'preparing'  AND OLD.status != 'preparing'  THEN NEW.preparing_at  = NOW(); END IF;
  IF NEW.status = 'ready'      AND OLD.status != 'ready'      THEN NEW.ready_at      = NOW(); END IF;
  IF NEW.status = 'delivering' AND OLD.status != 'delivering' THEN NEW.delivering_at = NOW(); END IF;
  IF NEW.status = 'delivered'  AND OLD.status != 'delivered'  THEN NEW.delivered_at  = NOW(); END IF;
  IF NEW.status = 'cancelled'  AND OLD.status != 'cancelled'  THEN NEW.cancelled_at  = NOW(); END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_status_ts
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_status_timestamps();

-- ══════════════════════════════════════════════════════════════
-- ORDER ITEMS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  name         TEXT NOT NULL,  -- snapshot at time of order
  unit_price   NUMERIC(10,2) NOT NULL,
  quantity     INT NOT NULL CHECK (quantity > 0),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ══════════════════════════════════════════════════════════════
-- ACTIVITY LOGS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_order   ON activity_logs(order_id);
CREATE INDEX idx_activity_user    ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- ══════════════════════════════════════════════════════════════
-- PUSH TOKENS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE push_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL DEFAULT 'web',  -- web | android | ios
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_areas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_reasons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens       ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Profiles: users see own, admins see all
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR current_user_role() = 'admin');

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
  USING (current_user_role() = 'admin');

-- Menu: all authenticated can read; only admin can write
CREATE POLICY "menu_cat_read"  ON menu_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "menu_cat_write" ON menu_categories FOR ALL   USING (current_user_role() = 'admin');
CREATE POLICY "menu_item_read"  ON menu_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "menu_item_write" ON menu_items FOR ALL   USING (current_user_role() = 'admin');

-- Delivery areas: all read, admin write
CREATE POLICY "areas_read"  ON delivery_areas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "areas_write" ON delivery_areas FOR ALL   USING (current_user_role() = 'admin');

-- Reasons: all read, admin write
CREATE POLICY "cancel_read"  ON cancellation_reasons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cancel_write" ON cancellation_reasons FOR ALL   USING (current_user_role() = 'admin');
CREATE POLICY "issue_read"   ON issue_reasons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "issue_write"  ON issue_reasons FOR ALL   USING (current_user_role() = 'admin');

-- Orders: all staff can read; role-based writes
CREATE POLICY "orders_read_all" ON orders FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_cashier_insert" ON orders FOR INSERT
  WITH CHECK (current_user_role() IN ('cashier','admin'));

CREATE POLICY "orders_update_kitchen" ON orders FOR UPDATE
  USING (current_user_role() IN ('kitchen','field','delivery','admin','cashier'));

-- Order items: follow order access
CREATE POLICY "order_items_read" ON order_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (current_user_role() IN ('cashier','admin'));

-- Activity logs: all read; system inserts
CREATE POLICY "logs_read"   ON activity_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "logs_insert" ON activity_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Push tokens: own only
CREATE POLICY "push_own" ON push_tokens FOR ALL USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- REALTIME: enable tables
-- ══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
