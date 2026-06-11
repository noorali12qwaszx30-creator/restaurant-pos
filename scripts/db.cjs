/**
 * db.js — helper لتشغيل SQL مباشرة على Supabase
 * الاستخدام: node scripts/db.js "SELECT * FROM profiles LIMIT 3"
 * أو:       node scripts/db.js < scripts/migration.sql
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

async function runSQL(sql) {
  const c = new Client(DB);
  await c.connect();
  try {
    const r = await c.query(sql);
    if (r.rows?.length) console.table(r.rows);
    else console.log("Done. rowCount:", r.rowCount);
  } catch (e) {
    console.error("SQL Error:", e.message);
  } finally {
    await c.end();
  }
}

const sql = process.argv[2];
if (sql) runSQL(sql);
else {
  let buf = "";
  process.stdin.on("data", d => buf += d);
  process.stdin.on("end", () => runSQL(buf));
}
