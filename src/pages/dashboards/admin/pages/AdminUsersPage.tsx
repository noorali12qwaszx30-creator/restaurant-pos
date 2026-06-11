import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, ToggleLeft, ToggleRight, Search, X,
  ShieldCheck, Loader2, Trash2, Phone, User,
  RefreshCw, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNotify } from "@/components/notifications/NotificationContext";
import type { UserRole } from "@/types";

// ── Types ──────────────────────────────────────────────────────
interface StaffProfile {
  id: string;
  username: string;
  display_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────
const ROLES: { id: UserRole; label: string; color: string }[] = [
  { id: "admin",    label: "مدير",    color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { id: "cashier",  label: "كاشير",   color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  { id: "kitchen",  label: "مطبخ",    color: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  { id: "field",    label: "ميداني",  color: "bg-green-500/15 text-green-600 border-green-500/30" },
  { id: "delivery", label: "سائق",    color: "bg-purple-500/15 text-purple-600 border-purple-500/30" },
  { id: "takeaway", label: "تيك أواي", color: "bg-pink-500/15 text-pink-600 border-pink-500/30" },
];

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.id, r]));

// ── Helpers ────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_MAP[role];
  if (!cfg) return null;
  return (
    <span className={cn("text-[11px] font-semibold border rounded-full px-2 py-0.5 leading-none", cfg.color)}>
      {cfg.label}
    </span>
  );
}

function Avatar({ name, role }: { name: string; role: UserRole }) {
  const cfg = ROLE_MAP[role];
  return (
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border",
      cfg?.color ?? "bg-surface-elevated text-text-secondary border-border"
    )}>
      {name.charAt(0)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════
export function AdminUsersPage() {
  const [users,     setUsers]     = useState<StaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search,    setSearch]    = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");

  const { notify } = useNotify();
  const [addOpen,    setAddOpen]    = useState(false);
  const [editUser,   setEditUser]   = useState<StaffProfile | null>(null);
  const [resetUser,  setResetUser]  = useState<StaffProfile | null>(null);

  // ── Load ──
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setUsers(data as StaffProfile[]);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Toggle active ──
  async function toggleActive(user: StaffProfile) {
    const next = !user.is_active;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: next } : u));
    const { error } = await db.from("profiles").update({ is_active: next }).eq("id", user.id);
    if (error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: user.is_active } : u));
      notify({ type: "error", title: "فشل التحديث", message: "فشل تغيير حالة المستخدم" });
    } else {
      notify({ type: "success", title: next ? "تم التفعيل" : "تم التعطيل", message: user.display_name });
    }
  }

  // ── Filter ──
  const filtered = users.filter(u => {
    const matchRole   = filterRole === "all" || u.role === filterRole;
    const matchSearch = !search.trim() ||
      u.display_name.includes(search) ||
      u.username.includes(search) ||
      (u.phone ?? "").includes(search);
    return matchRole && matchSearch;
  });

  // ── Stats ──
  const activeCount   = users.filter(u => u.is_active).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="flex flex-col min-h-full pb-28">

      {/* ── Header ── */}
      <div className="sticky top-[var(--header-height)] z-20 bg-background border-b border-border px-4 py-3 flex flex-col gap-3">
        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-text-primary">{users.length}</span>
              <span className="text-[10px] text-text-muted leading-none">موظف</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-status-success">{activeCount}</span>
              <span className="text-[10px] text-text-muted leading-none">نشط</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-status-error">{inactiveCount}</span>
              <span className="text-[10px] text-text-muted leading-none">معطّل</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
            <Button size="sm" onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              إضافة موظف
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو المستخدم أو الهاتف..."
            className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
              <X className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setFilterRole("all")}
            className={cn("shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
              filterRole === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-text-muted"
            )}
          >
            الكل ({users.length})
          </button>
          {ROLES.map(r => {
            const count = users.filter(u => u.role === r.id).length;
            return (
              <button
                key={r.id}
                onClick={() => setFilterRole(r.id)}
                className={cn("shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                  filterRole === r.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-text-muted"
                )}
              >
                {r.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── List ── */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-2">
            <User className="w-10 h-10 text-text-muted/40" />
            <p className="text-text-muted text-sm">لا يوجد موظفون</p>
          </div>
        ) : (
          filtered.map(user => (
            <div
              key={user.id}
              className={cn(
                "bg-surface border rounded-2xl p-3.5 flex items-center gap-3 transition-all",
                user.is_active ? "border-border" : "border-border opacity-60"
              )}
            >
              <Avatar name={user.display_name} role={user.role} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-text-primary">{user.display_name}</p>
                  {!user.is_active && (
                    <span className="text-[10px] bg-status-error/10 text-status-error border border-status-error/20 rounded-full px-2 py-0.5 font-medium">
                      معطّل
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">@{user.username}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <RoleBadge role={user.role} />
                  {user.phone && (
                    <span className="text-[11px] text-text-muted flex items-center gap-0.5">
                      <Phone className="w-3 h-3" />{user.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleActive(user)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-elevated transition-colors"
                  title={user.is_active ? "تعطيل الحساب" : "تفعيل الحساب"}
                >
                  {user.is_active
                    ? <ToggleRight className="w-5 h-5 text-status-success" />
                    : <ToggleLeft  className="w-5 h-5 text-text-muted" />
                  }
                </button>
                <button
                  onClick={() => setResetUser(user)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-elevated hover:text-amber-500 transition-colors"
                  title="تغيير كلمة المرور"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditUser(user)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-elevated hover:text-primary transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Add Dialog ── */}
      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={(msg) => { notify({ type: "success", title: "تم إنشاء الحساب", message: msg }); loadUsers(); setAddOpen(false); }}
        onError={(msg) => notify({ type: "error", title: "فشل الإنشاء", message: msg })}
      />

      {/* ── Edit Dialog ── */}
      {editUser && (
        <EditUserDialog
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={(msg) => { notify({ type: "success", title: "تم التعديل", message: msg }); loadUsers(); setEditUser(null); }}
          onError={(msg) => notify({ type: "error", title: "فشل التعديل", message: msg })}
        />
      )}

      {/* ── Reset Password Dialog ── */}
      {resetUser && (
        <ResetPasswordDialog
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSuccess={(msg) => { notify({ type: "success", title: "تم إعادة التعيين", message: msg }); setResetUser(null); }}
          onError={(msg) => notify({ type: "error", title: "فشل", message: msg })}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Add User Dialog
// ══════════════════════════════════════════════════════════════
function AddUserDialog({
  open, onClose, onSuccess, onError,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    password: "",
    phone: "",
    role: "cashier" as UserRole,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.displayName.trim()) e.displayName = "الاسم مطلوب";
    if (!form.username.trim())    e.username    = "اسم المستخدم مطلوب";
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = "أحرف إنجليزية وأرقام فقط";
    if (form.password.length < 6) e.password = "6 أحرف على الأقل";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          username:     form.username.toLowerCase(),
          password:     form.password,
          display_name: form.displayName.trim(),
          role:         form.role,
          phone:        form.phone.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      onSuccess(`تم إنشاء حساب "${form.displayName}" بنجاح`);
      setForm({ displayName: "", username: "", password: "", phone: "", role: "cashier" });
      setErrors({});
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "";
      if (msg.includes("already") || msg.includes("duplicate")) {
        onError("اسم المستخدم مسجّل مسبقاً");
      } else if (msg.includes("Password") || msg.includes("password")) {
        onError("كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل");
      } else {
        onError("فشل إنشاء الحساب: " + msg);
      }
    } finally {
      setSaving(false);
    }
  }

  function set(key: keyof typeof form, val: string) {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: "" }));
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>إضافة موظف جديد</DialogTitle></DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-3">
            {/* Display Name */}
            <Field label="الاسم الكامل" error={errors.displayName}>
              <input
                value={form.displayName}
                onChange={e => set("displayName", e.target.value)}
                placeholder="مثال: أحمد محمد"
                className={inputCls(!!errors.displayName)}
              />
            </Field>

            {/* Username */}
            <Field label="اسم المستخدم" error={errors.username}
              hint="سيُستخدم لتسجيل الدخول (إنجليزي فقط)">
              <input
                value={form.username}
                onChange={e => set("username", e.target.value.toLowerCase())}
                placeholder="مثال: ahmed2"
                dir="ltr"
                className={inputCls(!!errors.username)}
              />
            </Field>

            {/* Password */}
            <Field label="كلمة المرور" error={errors.password}>
              <input
                type="password"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                placeholder="6 أحرف على الأقل"
                dir="ltr"
                className={inputCls(!!errors.password)}
              />
            </Field>

            {/* Phone */}
            <Field label="رقم الهاتف (اختياري)">
              <input
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="07xxxxxxxxxx"
                dir="ltr"
                className={inputCls(false)}
              />
            </Field>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">الدور</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => set("role", r.id)}
                    className={cn(
                      "py-2.5 rounded-xl border text-xs font-semibold transition-all",
                      form.role === r.id
                        ? "bg-primary text-primary-foreground border-primary shadow-card"
                        : "bg-surface-elevated border-border text-text-muted hover:border-primary/30"
                    )}
                  >
                    <ShieldCheck className={cn("w-4 h-4 mx-auto mb-1", form.role === r.id ? "opacity-100" : "opacity-0")} />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</> : "إنشاء الحساب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
// Reset Password Dialog
// ══════════════════════════════════════════════════════════════
function ResetPasswordDialog({
  user, onClose, onSuccess, onError,
}: {
  user: StaffProfile;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [newPass,   setNewPass]   = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  async function handleReset() {
    setError("");
    if (newPass.length < 6)  { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (newPass !== confirm)  { setError("كلمتا المرور غير متطابقتين"); return; }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { userId: user.id, password: newPass },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      onSuccess(`تم تغيير كلمة مرور "${user.display_name}" بنجاح ✓`);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "خطأ غير معروف";
      onError("فشل تغيير كلمة المرور: " + msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            تغيير كلمة المرور
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {/* User info */}
          <div className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl mb-4">
            <Avatar name={user.display_name} role={user.role} />
            <div>
              <p className="font-semibold text-text-primary">{user.display_name}</p>
              <p className="text-xs text-text-muted">@{user.username}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* New password */}
            <Field label="كلمة المرور الجديدة">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={newPass}
                  onChange={e => { setNewPass(e.target.value); setError(""); }}
                  placeholder="6 أحرف على الأقل"
                  dir="ltr"
                  className={inputCls(!!error)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Confirm */}
            <Field label="تأكيد كلمة المرور" error={error}>
              <input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                placeholder="أعد كتابة كلمة المرور"
                dir="ltr"
                className={inputCls(!!error)}
              />
            </Field>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button
            onClick={handleReset}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التغيير...</>
              : <><KeyRound className="w-4 h-4" /> تغيير كلمة المرور</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
// Edit User Dialog
// ══════════════════════════════════════════════════════════════
function EditUserDialog({
  user, onClose, onSuccess, onError,
}: {
  user: StaffProfile;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    displayName: user.display_name,
    phone:       user.phone ?? "",
    role:        user.role,
    is_active:   user.is_active,
  });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function handleSave() {
    if (!form.displayName.trim()) return;
    setSaving(true);
    const { error } = await db
      .from("profiles")
      .update({
        display_name: form.displayName.trim(),
        phone:        form.phone.trim() || null,
        role:         form.role,
        is_active:    form.is_active,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) { onError("فشل حفظ التعديلات"); return; }
    onSuccess("تم حفظ التعديلات بنجاح");
  }

  async function handleDeactivate() {
    setDeleting(true);
    const { error } = await db
      .from("profiles")
      .update({ is_active: false })
      .eq("id", user.id);
    setDeleting(false);
    if (error) { onError("فشل تعطيل الحساب"); return; }
    onSuccess(`تم تعطيل حساب "${user.display_name}"`);
  }

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(p => ({ ...p, [key]: val }));
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) { onClose(); setConfirmDel(false); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل بيانات الموظف</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {/* Profile header */}
          <div className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl mb-4">
            <Avatar name={user.display_name} role={user.role} />
            <div>
              <p className="font-semibold text-text-primary">{user.display_name}</p>
              <p className="text-xs text-text-muted">@{user.username}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Display Name */}
            <Field label="الاسم الكامل">
              <input
                value={form.displayName}
                onChange={e => set("displayName", e.target.value)}
                className={inputCls(false)}
              />
            </Field>

            {/* Phone */}
            <Field label="رقم الهاتف">
              <input
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="07xxxxxxxxxx"
                dir="ltr"
                className={inputCls(false)}
              />
            </Field>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">الدور</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => set("role", r.id)}
                    className={cn(
                      "py-2 rounded-xl border text-xs font-semibold transition-all",
                      form.role === r.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface-elevated border-border text-text-muted hover:border-primary/30"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active toggle */}
            <button
              onClick={() => set("is_active", !form.is_active)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all",
                form.is_active ? "bg-status-success/5 border-status-success/20" : "bg-surface-elevated border-border"
              )}
            >
              <span className="text-sm text-text-primary">حالة الحساب</span>
              {form.is_active
                ? <span className="flex items-center gap-1 text-status-success text-xs font-medium"><ToggleRight className="w-5 h-5" />نشط</span>
                : <span className="flex items-center gap-1 text-text-muted text-xs font-medium"><ToggleLeft className="w-5 h-5" />معطّل</span>
              }
            </button>

            {/* Danger zone */}
            {user.role !== "admin" && (
              <div className="border border-status-error/20 rounded-xl p-3 bg-status-error/5">
                <p className="text-xs font-medium text-status-error mb-2">منطقة الخطر</p>
                {!confirmDel ? (
                  <button
                    onClick={() => setConfirmDel(true)}
                    className="flex items-center gap-1.5 text-xs text-status-error font-medium hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    تعطيل الحساب نهائياً
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-text-secondary">هل أنت متأكد من تعطيل الحساب؟</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setConfirmDel(false)} className="flex-1">
                        إلغاء
                      </Button>
                      <button
                        onClick={handleDeactivate}
                        disabled={deleting}
                        className="flex-1 h-8 rounded-lg bg-status-error text-white text-xs font-semibold flex items-center justify-center gap-1 hover:bg-status-error/90 transition-colors"
                      >
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        تأكيد التعطيل
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</> : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Shared UI helpers ──────────────────────────────────────────
function Field({ label, error, hint, children }: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      {hint && <p className="text-[10px] text-text-muted -mt-1">{hint}</p>}
      {children}
      {error && <p className="text-xs text-status-error">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "bg-surface-elevated border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all",
    "focus:ring-2 focus:ring-primary/20 focus:border-primary",
    hasError ? "border-status-error" : "border-border"
  );
}
