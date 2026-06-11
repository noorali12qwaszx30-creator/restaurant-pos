/**
 * ينشئ حساب superadmin بشكل صحيح عبر Supabase Admin API
 */
const https = require("https");

const PROJECT_REF = "ywuojrjsoomyuzfdulam";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error("❌ يجب تمرير SUPABASE_SERVICE_KEY");
  process.exit(1);
}

async function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "apikey": SERVICE_KEY,
        "Content-Length": Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", d => raw += d);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("🔧 إنشاء حساب superadmin...");

  // 1. إنشاء المستخدم في Auth
  const res = await request("/auth/v1/admin/users", "POST", {
    email: "superadmin@restaurant.local",
    password: "SuperAdmin@2024",
    email_confirm: true,
    user_metadata: { username: "superadmin", display_name: "المدير العام" },
  });

  if (res.status !== 200 && res.status !== 201) {
    console.error("❌ فشل إنشاء المستخدم:", res.body);
    process.exit(1);
  }

  const userId = res.body.id;
  console.log("✅ تم إنشاء Auth User:", userId);

  // 2. إنشاء الـ Profile
  const { Client } = require("pg");
  const DB = {
    host: "aws-1-ap-south-1.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: "postgres.ywuojrjsoomyuzfdulam",
    password: "07829774473s",
    ssl: { rejectUnauthorized: false },
  };

  const pg = new Client(DB);
  await pg.connect();

  // احسب الكود الفريد للسوبر أدمن (restaurant_id IS NULL)
  const codeRes = await pg.query(
    `SELECT LPAD((COUNT(*) + 1)::text, 4, '0') as code FROM profiles WHERE restaurant_id IS NULL`
  );
  const loginCode = codeRes.rows[0].code;

  await pg.query(
    `INSERT INTO profiles (id, username, display_name, role, roles, is_active, restaurant_id, login_code)
     VALUES ($1, 'superadmin', 'المدير العام', 'admin', ARRAY['super_admin'], true, NULL, $2)
     ON CONFLICT (id) DO UPDATE SET roles = ARRAY['super_admin'], login_code = $2`,
    [userId, loginCode]
  );

  console.log("✅ تم إنشاء Profile");
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👑 بيانات المدير العام`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`كود الدخول : ${loginCode}`);
  console.log(`المسار السري: /sys-9x7k`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━`);

  await pg.end();
}

main().catch(console.error);
