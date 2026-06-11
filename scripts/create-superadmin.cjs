/**
 * ينشئ مستخدم super_admin مباشرة في Supabase
 * الاستخدام: node scripts/create-superadmin.cjs
 */
const { Client } = require("pg");

const DB = {
  host:     "aws-1-ap-south-1.pooler.supabase.com",
  port:     5432,
  database: "postgres",
  user:     "postgres.ywuojrjsoomyuzfdulam",
  password: "07829774473s",
  ssl:      { rejectUnauthorized: false },
};

// ── بيانات الحساب — عدّلها كما تريد ──
const SUPERADMIN = {
  email:        "superadmin@system.local",
  username:     "superadmin",
  display_name: "المدير العام",
};

async function main() {
  const c = new Client(DB);
  await c.connect();

  try {
    // 1. تحقق إذا موجود
    const check = await c.query(
      `SELECT id FROM profiles WHERE username = $1 LIMIT 1`,
      [SUPERADMIN.username]
    );

    if (check.rows.length > 0) {
      console.log("✅ المستخدم موجود بالفعل. جاري تحديث الدور...");
      await c.query(
        `UPDATE profiles SET roles = ARRAY['super_admin'], restaurant_id = NULL WHERE username = $1`,
        [SUPERADMIN.username]
      );
      console.log("✅ تم تحديث الدور إلى super_admin");
      console.log(`\nبيانات الدخول:`);
      console.log(`  المستخدم: ${SUPERADMIN.username}`);
      console.log(`  (كلمة المرور: نفس كلمة المرور الحالية)`);
      return;
    }

    // 2. إنشاء مستخدم في auth.users باستخدام Supabase auth.create_user function
    // (يتطلب امتيازات supabase_admin أو service_role)
    const result = await c.query(`
      SELECT extensions.uuid_generate_v4() as new_id
    `);
    const newId = result.rows[0]?.new_id;

    if (!newId) {
      console.error("❌ فشل توليد UUID");
      return;
    }

    // إدخال مباشر في auth.users (يعمل مع صلاحيات postgres)
    const password_hash = "$2a$10$PXAMdEXsNlylM2n2fGBYuOZaJFfpnFTuFCLHJkzDAWYqmOHQW5x3C"; // placeholder

    await c.query(`
      INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role
      ) VALUES (
        $1, $2, $3, NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"username":"superadmin","display_name":"المدير العام"}'::jsonb,
        false, 'authenticated'
      )
      ON CONFLICT (email) DO NOTHING
    `, [newId, SUPERADMIN.email, password_hash]);

    // إنشاء profile
    await c.query(`
      INSERT INTO profiles (id, username, display_name, role, roles, is_active, restaurant_id)
      VALUES ($1, $2, $3, 'admin', ARRAY['super_admin'], true, NULL)
      ON CONFLICT (id) DO UPDATE SET roles = ARRAY['super_admin'], restaurant_id = NULL
    `, [newId, SUPERADMIN.username, SUPERADMIN.display_name]);

    console.log("✅ تم إنشاء المستخدم في قاعدة البيانات");
    console.log("\n⚠️  لكن كلمة المرور مُشفَّرة بشكل عشوائي.");
    console.log("   انتقل لـ: Supabase Dashboard → Authentication → Users");
    console.log(`   ابحث عن: ${SUPERADMIN.email}`);
    console.log("   اضغط على 'Send Magic Link' أو 'Reset Password' لتعيين كلمة مرور");

  } catch (err) {
    console.error("❌ خطأ:", err.message);

    // الحل البديل: تحديث مستخدم موجود
    console.log("\n── الحل البديل: تحديث مستخدم موجود ──");
    console.log("شغّل هذا الأمر لتحويل أي مستخدم موجود إلى super_admin:");
    console.log(`\nnode scripts/db.cjs "UPDATE profiles SET roles = ARRAY['super_admin'], restaurant_id = NULL WHERE username = 'admin'"`);
  } finally {
    await c.end();
  }
}

main();
