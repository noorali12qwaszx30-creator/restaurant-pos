// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

import { supabase } from "./client";
import type { UserProfile, UserRole } from "@/types";
import type { Profile } from "./types";

// ── Helpers ────────────────────────────────────────────────────
function profileToUserProfile(p: Profile): UserProfile {
  const roles: UserRole[] = Array.isArray(p.roles) && p.roles.length > 0
    ? p.roles as UserRole[]
    : [p.role as UserRole];

  const isSuperAdmin = roles.includes("super_admin");

  return {
    uid:          p.id,
    username:     p.username,
    email:        "",          // not stored in profiles; comes from auth.users
    displayName:  p.display_name,
    roles,
    isActive:     p.is_active,
    restaurantId: isSuperAdmin ? null : (p.restaurant_id ?? null),
    isSuperAdmin,
    createdAt:    new Date(p.created_at),
    updatedAt:    new Date(p.updated_at),
  };
}

// ── Sign In ────────────────────────────────────────────────────
export async function signIn(
  username: string,
  password: string
): Promise<UserProfile> {
  // Supabase Auth needs an email; we use username@restaurant.local as convention
  const email = username.includes("@") ? username : `${username}@restaurant.local`;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(mapAuthError(error.message));

  const { data: profile, error: pErr } = await (supabase as unknown as AnyRecord)
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (pErr || !profile) throw new Error("لم يتم العثور على الملف الشخصي");
  if (!(profile as Profile).is_active) throw new Error("الحساب غير مفعّل");

  return profileToUserProfile(profile as Profile);
}

// ── Code Login ────────────────────────────────────────────────
export async function loginWithCode(
  restaurantId: string,
  loginCode: string
): Promise<UserProfile> {
  const { data, error } = await (supabase as unknown as AnyRecord).functions.invoke("code-login", {
    body: { restaurant_id: restaurantId, login_code: loginCode.trim() },
  });

  if (error) throw new Error(error.message ?? "فشل الاتصال بالخادم");
  if (data?.error) throw new Error(data.error);

  const { session, profile } = data as { session: { access_token: string; refresh_token: string }; profile: AnyRecord };

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (sessionError) throw new Error("فشل تفعيل الجلسة");

  return profileToUserProfile(profile as Parameters<typeof profileToUserProfile>[0]);
}

// ── Sign Out ───────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ── Get Current Profile ────────────────────────────────────────
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await (supabase as unknown as AnyRecord)
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;
  return profileToUserProfile(profile as Profile);
}

// ── Auth State Observer ────────────────────────────────────────
export function onAuthStateChanged(
  callback: (profile: UserProfile | null) => void
): () => void {
  // 1. Resolve immediately from the stored session (no network call)
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!session?.user) {
      callback(null);
      return;
    }
    const profile = await getCurrentProfile();
    callback(profile);
  });

  // 2. Keep listening for future changes (sign-in, sign-out, refresh)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!session?.user) {
        callback(null);
        return;
      }
      const profile = await getCurrentProfile();
      callback(profile);
    }
  );
  return () => subscription.unsubscribe();
}

// ── Error map ─────────────────────────────────────────────────
function mapAuthError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "auth/wrong-password";
  if (msg.includes("Email not confirmed"))       return "auth/email-not-verified";
  if (msg.includes("User not found"))            return "auth/user-not-found";
  return msg;
}
