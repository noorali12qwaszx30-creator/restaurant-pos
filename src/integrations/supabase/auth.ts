// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

import { supabase } from "./client";
import type { UserProfile, UserRole } from "@/types";
import type { Profile } from "./types";

// ── Helpers ────────────────────────────────────────────────────
function profileToUserProfile(p: Profile): UserProfile {
  return {
    uid: p.id,
    username: p.username,
    email: "",                     // not stored in profiles; comes from auth.users
    displayName: p.display_name,
    roles: [p.role as UserRole],
    isActive: p.is_active,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
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
