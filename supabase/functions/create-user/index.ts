/**
 * Edge Function: create-user
 * ينشئ مستخدم Supabase Auth + profile في جدول profiles
 * يتطلب: JWT من admin أو super_admin
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
    // ── تحقق من هوية المستدعي ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // عميل بصلاحيات المستخدم الحالي (للتحقق من دوره)
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // عميل Admin (service_role) لإنشاء المستخدمين
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // تحقق أن المستدعي admin أو super_admin
    const { data: { user: caller } } = await supabaseUser.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("roles, restaurant_id")
      .eq("id", caller.id)
      .single();

    const isSuperAdmin = callerProfile?.roles?.includes("super_admin");
    const isAdmin = callerProfile?.roles?.includes("admin");

    if (!isSuperAdmin && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── قراءة بيانات المستخدم الجديد ──
    const body = await req.json() as {
      username: string;
      password: string;
      display_name: string;
      role: string;
      phone?: string;
      restaurant_id?: string;
    };

    const { username, password, display_name, role, phone, restaurant_id } = body;

    if (!username || !password || !display_name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // admin عادي: يُنشئ فقط في مطعمه
    const targetRestaurantId = isSuperAdmin
      ? (restaurant_id ?? null)
      : callerProfile?.restaurant_id;

    // إنشاء المستخدم في Supabase Auth
    const email = `${username}@restaurant.local`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: authError?.message ?? "Failed to create auth user" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // إنشاء profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        username,
        display_name,
        role,
        roles: [role],
        phone: phone ?? null,
        is_active: true,
        restaurant_id: targetRestaurantId,
      })
      .select()
      .single();

    if (profileError) {
      // حذف المستخدم من Auth إذا فشل إنشاء الـ profile
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, profile }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
