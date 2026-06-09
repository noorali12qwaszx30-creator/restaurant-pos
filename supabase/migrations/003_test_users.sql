-- ══════════════════════════════════════════════════════════════
-- Test Users — 5 roles for development/testing
-- Run this ONLY in development Supabase projects.
--
-- After running, login credentials:
--   admin    / admin123
--   cashier  / cashier123
--   kitchen  / kitchen123
--   field    / field123
--   delivery / delivery123
-- ══════════════════════════════════════════════════════════════

-- ── Disable trigger temporarily to control profile insert ─────
-- (profiles are created via trigger handle_new_user automatically)

-- ── 1. Admin ──────────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  'a1000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@restaurant.local',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"admin","display_name":"مدير النظام","role":"admin"}',
  'authenticated', 'authenticated', now(), now()
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'admin@restaurant.local',
  '{"sub":"a1000000-0000-0000-0000-000000000001","email":"admin@restaurant.local"}'::jsonb,
  'email', now(), now(), now()
);

-- ── 2. Cashier ────────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  'a1000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'cashier@restaurant.local',
  crypt('cashier123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"cashier","display_name":"كاشير 1","role":"cashier"}',
  'authenticated', 'authenticated', now(), now()
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000002',
  'cashier@restaurant.local',
  '{"sub":"a1000000-0000-0000-0000-000000000002","email":"cashier@restaurant.local"}'::jsonb,
  'email', now(), now(), now()
);

-- ── 3. Kitchen ────────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  'a1000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'kitchen@restaurant.local',
  crypt('kitchen123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"kitchen","display_name":"مطبخ 1","role":"kitchen"}',
  'authenticated', 'authenticated', now(), now()
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000003',
  'kitchen@restaurant.local',
  '{"sub":"a1000000-0000-0000-0000-000000000003","email":"kitchen@restaurant.local"}'::jsonb,
  'email', now(), now(), now()
);

-- ── 4. Field ──────────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  'a1000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'field@restaurant.local',
  crypt('field123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"field","display_name":"موظف الميدان","role":"field"}',
  'authenticated', 'authenticated', now(), now()
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000004',
  'field@restaurant.local',
  '{"sub":"a1000000-0000-0000-0000-000000000004","email":"field@restaurant.local"}'::jsonb,
  'email', now(), now(), now()
);

-- ── 5. Delivery Driver ────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  'a1000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'delivery@restaurant.local',
  crypt('delivery123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"delivery","display_name":"سائق التوصيل","role":"delivery"}',
  'authenticated', 'authenticated', now(), now()
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'a1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000005',
  'delivery@restaurant.local',
  '{"sub":"a1000000-0000-0000-0000-000000000005","email":"delivery@restaurant.local"}'::jsonb,
  'email', now(), now(), now()
);

-- ── Verify ────────────────────────────────────────────────────
-- After running, check profiles were auto-created:
-- SELECT username, display_name, role FROM profiles;
