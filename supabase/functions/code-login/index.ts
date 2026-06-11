/**
 * Edge Function: code-login
 * تسجيل دخول الموظف باختيار المطعم + كود الموظف
 * لا يحتاج إلى كلمة مرور
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { restaurant_id, login_code } = await req.json();

    if (!restaurant_id || !login_code) {
      return json({ error: "يرجى اختيار المطعم وإدخال الكود" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 1. ابحث عن الموظف ──
    const isSuperAdminLogin = restaurant_id === "__system__";
    let query = supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("login_code", login_code.trim())
      .eq("is_active", true);

    if (isSuperAdminLogin) {
      query = query.contains("roles", ["super_admin"]).is("restaurant_id", null);
    } else {
      query = query.eq("restaurant_id", restaurant_id);
    }

    const { data: profile, error: profileError } = await query.single();

    if (profileError || !profile) {
      return json({ error: "الكود غير صحيح أو الموظف غير نشط" }, 401);
    }

    // ── 2. ابنِ الإيميل من اسم المستخدم مباشرة ──
    const email = `${profile.username}@restaurant.local`;

    // ── 3. أنشئ رابط سحري (OTP) ──
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      return json({ error: "فشل إنشاء رمز الدخول" }, 500);
    }

    // ── 4. استبدل الرمز بجلسة كاملة ──
    const { data: sessionData, error: sessionErr } = await supabaseAdmin.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "email",
    });

    if (sessionErr || !sessionData?.session) {
      return json({ error: "فشل تسجيل الدخول: " + (sessionErr?.message ?? "خطأ غير معروف") }, 500);
    }

    // ── 5. سجّل آخر وقت دخول ──
    await supabaseAdmin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", profile.id);

    return json({ session: sessionData.session, profile });

  } catch (err) {
    console.error("code-login error:", err);
    return json({ error: "خطأ داخلي في الخادم" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
