// Supabase Edge Function — admin-reset-password
// يُغيِّر كلمة مرور أي موظف بواسطة المدير فقط
// يُستدعى من AdminUsersPage.tsx عبر supabase.functions.invoke()

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
    const serviceKey     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey        = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader     = req.headers.get("Authorization") ?? "";

    if (!authHeader) throw new Error("Unauthorized");

    // ── تحقق من أن المُستدعي مدير ──
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    const { data: profile, error: profErr } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profErr || !profile) throw new Error("Unauthorized");
    if (profile.role !== "admin") throw new Error("ممنوع: للمدير فقط");

    // ── استخرج البيانات من الطلب ──
    const { userId, password } = await req.json() as { userId: string; password: string };
    if (!userId || !password)   throw new Error("userId و password مطلوبان");
    if (password.length < 6)    throw new Error("كلمة المرور قصيرة جداً (6 أحرف كحد أدنى)");

    // ── غيِّر كلمة المرور ──
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: resetErr } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (resetErr) throw resetErr;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const message = (err as { message?: string }).message ?? "خطأ غير معروف";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
