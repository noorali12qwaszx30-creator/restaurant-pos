/**
 * Edge Function: create-restaurant
 * يُنشئ مطعم جديد + مدير له (super_admin فقط)
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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // super_admin فقط
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("roles")
      .eq("id", caller.id)
      .single();

    if (!callerProfile?.roles?.includes("super_admin")) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as {
      name: string;
      phone?: string;
      address?: string;
      logo?: string;
      // بيانات المدير الأول
      admin_username: string;
      admin_password: string;
      admin_display_name: string;
    };

    const { name, phone, address, logo, admin_username, admin_password, admin_display_name } = body;

    if (!name || !admin_username || !admin_password || !admin_display_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. إنشاء المطعم
    const { data: restaurant, error: restError } = await supabaseAdmin
      .from("restaurants")
      .insert({ name, phone: phone ?? null, address: address ?? null, logo: logo ?? null, is_active: true })
      .select()
      .single();

    if (restError || !restaurant) {
      return new Response(JSON.stringify({ error: restError?.message ?? "Failed to create restaurant" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. إنشاء مدير المطعم في Auth
    const email = `${admin_username}@restaurant.local`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: admin_password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      // تراجع: حذف المطعم
      await supabaseAdmin.from("restaurants").delete().eq("id", restaurant.id);
      return new Response(JSON.stringify({ error: authError?.message ?? "Failed to create admin user" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. إنشاء profile للمدير
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        username: admin_username,
        display_name: admin_display_name,
        role: "admin",
        roles: ["admin"],
        is_active: true,
        restaurant_id: restaurant.id,
      });

    if (profileError) {
      // تراجع
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from("restaurants").delete().eq("id", restaurant.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, restaurant }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
