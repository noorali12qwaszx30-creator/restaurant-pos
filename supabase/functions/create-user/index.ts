/**
 * Edge Function: create-user
 * يتطلب فقط: display_name + role (اسم المستخدم وكلمة المرور تُولَّدان تلقائياً)
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user: caller } } = await supabaseUser.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("roles, restaurant_id")
      .eq("id", caller.id)
      .single();

    const isSuperAdmin = callerProfile?.roles?.includes("super_admin");
    const isAdmin      = callerProfile?.roles?.includes("admin");
    if (!isSuperAdmin && !isAdmin) return json({ error: "Forbidden" }, 403);

    // ── المدخلات المطلوبة فقط ──
    const body = await req.json() as {
      display_name: string;
      role: string;
      restaurant_id?: string;
    };

    const { display_name, role } = body;
    if (!display_name?.trim() || !role) return json({ error: "display_name و role مطلوبان" }, 400);

    const targetRestaurantId: string | null = isSuperAdmin
      ? (body.restaurant_id ?? null)
      : (callerProfile?.restaurant_id ?? null);

    // ── توليد كود دخول 10 أرقام فريد ──
    async function generateLoginCode(restaurantId: string | null): Promise<string> {
      for (let i = 0; i < 300; i++) {
        const code = String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000));
        let q = supabaseAdmin.from("profiles").select("id").eq("login_code", code);
        q = restaurantId ? q.eq("restaurant_id", restaurantId) : q.is("restaurant_id", null);
        const { data } = await q.maybeSingle();
        if (!data) return code;
      }
      throw new Error("فشل توليد كود فريد");
    }

    const loginCode = await generateLoginCode(targetRestaurantId);

    // ── توليد بيانات Auth تلقائية ──
    const uid      = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const username = `emp_${uid}`;
    const password = crypto.randomUUID(); // لا يُستخدم — الدخول بالكود فقط
    const email    = `${username}@restaurant.local`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return json({ error: authError?.message ?? "فشل إنشاء الحساب" }, 400);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id:            authData.user.id,
        username,
        display_name:  display_name.trim(),
        role,
        roles:         [role],
        is_active:     true,
        restaurant_id: targetRestaurantId,
        login_code:    loginCode,
      })
      .select()
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return json({ error: profileError.message }, 400);
    }

    return json({ success: true, profile });

  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
