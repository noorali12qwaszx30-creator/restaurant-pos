/**
 * Super Admin — إدارة المطاعم
 * إنشاء مطاعم جديدة + تفعيل/تعطيل + عرض إحصائيات كل مطعم
 */
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Building2, Users, ShoppingBag, ToggleRight, ToggleLeft,
  Loader2, RefreshCw, Phone, MapPin, Check, Edit2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNotify } from "@/components/notifications/NotificationContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Restaurant {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo: string | null;
  is_active: boolean;
  created_at: string;
  _stats?: { staff: number; orders: number };
}

export function SuperAdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRest, setEditRest] = useState<Restaurant | null>(null);
  const { notify } = useNotify();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      // جلب المطاعم
      const { data: rests, error } = await db
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // جلب إحصائيات لكل مطعم (عدد الموظفين + الطلبات)
      const enriched = await Promise.all((rests ?? []).map(async (r: Restaurant) => {
        const [{ count: staff }, { count: orders }] = await Promise.all([
          db.from("profiles").select("id", { count: "exact", head: true }).eq("restaurant_id", r.id),
          db.from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", r.id),
        ]);
        return { ...r, _stats: { staff: staff ?? 0, orders: orders ?? 0 } };
      }));

      setRestaurants(enriched);
    } catch (err) {
      notify({ type: "error", title: "فشل التحميل", message: String(err) });
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(r: Restaurant) {
    const next = !r.is_active;
    setRestaurants(prev => prev.map(x => x.id === r.id ? { ...x, is_active: next } : x));
    const { error } = await db.from("restaurants").update({ is_active: next }).eq("id", r.id);
    if (error) {
      setRestaurants(prev => prev.map(x => x.id === r.id ? { ...x, is_active: r.is_active } : x));
      notify({ type: "error", title: "فشل التحديث" });
    } else {
      notify({ type: "success", title: next ? "تم تفعيل المطعم" : "تم تعطيل المطعم", message: r.name });
    }
  }

  const activeCount   = restaurants.filter(r => r.is_active).length;
  const totalOrders   = restaurants.reduce((s, r) => s + (r._stats?.orders ?? 0), 0);
  const totalStaff    = restaurants.reduce((s, r) => s + (r._stats?.staff  ?? 0), 0);

  return (
    <div className="flex flex-col pb-4">

      {/* ── Stats Summary ── */}
      <div className="grid grid-cols-3 gap-3 px-4 pt-4 pb-3">
        {[
          { label: "المطاعم", value: restaurants.length, sub: `${activeCount} نشط` },
          { label: "الموظفون", value: totalStaff, sub: "إجمالي" },
          { label: "الطلبات", value: totalOrders, sub: "إجمالي" },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-2xl px-3 py-3 text-center">
            <p className="text-xl font-black text-text-primary tabular-nums">{s.value.toLocaleString("en-US")}</p>
            <p className="text-[10px] text-text-muted font-medium">{s.label}</p>
            <p className="text-[10px] text-primary font-medium">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="px-4 flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-text-primary">قائمة المطاعم</p>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            مطعم جديد
          </Button>
        </div>
      </div>

      {/* ── List ── */}
      <div className="px-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <Building2 className="w-12 h-12 text-text-muted/30" />
            <p className="text-text-muted text-sm">لا توجد مطاعم بعد</p>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 ml-1" /> أضف أول مطعم
            </Button>
          </div>
        ) : (
          restaurants.map(r => (
            <div
              key={r.id}
              className={cn(
                "bg-surface border rounded-2xl p-4 transition-all",
                r.is_active ? "border-border" : "border-border opacity-60"
              )}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold",
                  r.is_active ? "bg-primary/10 text-primary" : "bg-surface-elevated text-text-muted"
                )}>
                  {r.logo ? (
                    <img src={r.logo} alt={r.name} className="w-full h-full object-cover rounded-xl" />
                  ) : r.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-text-primary truncate">{r.name}</p>
                    {!r.is_active && (
                      <span className="text-[10px] bg-status-error/10 text-status-error border border-status-error/20 rounded-full px-2 py-0.5 font-medium shrink-0">
                        معطّل
                      </span>
                    )}
                  </div>
                  {r.phone && (
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />{r.phone}
                    </p>
                  )}
                  {r.address && (
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{r.address}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditRest(r)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-elevated hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive(r)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-elevated transition-colors"
                  >
                    {r.is_active
                      ? <ToggleRight className="w-5 h-5 text-status-success" />
                      : <ToggleLeft  className="w-5 h-5 text-text-muted" />
                    }
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Users className="w-3.5 h-3.5" />
                  <span>{r._stats?.staff ?? 0} موظف</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{(r._stats?.orders ?? 0).toLocaleString("en-US")} طلب</span>
                </div>
                <div className="mr-auto text-[10px] text-text-muted">
                  {new Date(r.created_at).toLocaleDateString("ar-IQ")}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Add Restaurant Dialog ── */}
      <AddRestaurantDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={(msg) => { notify({ type: "success", title: "تم إنشاء المطعم", message: msg }); load(); setAddOpen(false); }}
        onError={(msg) => notify({ type: "error", title: "فشل الإنشاء", message: msg })}
      />

      {/* ── Edit Restaurant Dialog ── */}
      {editRest && (
        <EditRestaurantDialog
          restaurant={editRest}
          onClose={() => setEditRest(null)}
          onSuccess={(msg) => { notify({ type: "success", title: "تم التحديث", message: msg }); load(); setEditRest(null); }}
          onError={(msg) => notify({ type: "error", title: "فشل التحديث", message: msg })}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Add Restaurant Dialog
// ══════════════════════════════════════════════════════════════
function AddRestaurantDialog({ open, onClose, onSuccess, onError }: {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    name: "", phone: "", address: "",
    adminUsername: "", adminPassword: "", adminDisplayName: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2>(1);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "اسم المطعم مطلوب";
    if (step === 2) {
      if (!form.adminDisplayName.trim()) e.adminDisplayName = "الاسم مطلوب";
      if (!form.adminUsername.trim())    e.adminUsername = "اسم المستخدم مطلوب";
      if (!/^[a-zA-Z0-9_]+$/.test(form.adminUsername)) e.adminUsername = "إنجليزي فقط";
      if (form.adminPassword.length < 6) e.adminPassword = "6 أحرف على الأقل";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-restaurant", {
        body: {
          name:               form.name.trim(),
          phone:              form.phone.trim() || undefined,
          address:            form.address.trim() || undefined,
          admin_username:     form.adminUsername.toLowerCase(),
          admin_password:     form.adminPassword,
          admin_display_name: form.adminDisplayName.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      onSuccess(`تم إنشاء "${form.name}" بنجاح`);
      setForm({ name: "", phone: "", address: "", adminUsername: "", adminPassword: "", adminDisplayName: "" });
      setStep(1);
    } catch (err: unknown) {
      onError((err as { message?: string }).message ?? "خطأ غير معروف");
    } finally {
      setSaving(false);
    }
  }

  function set(key: keyof typeof form, val: string) {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: "" }));
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); setStep(1); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            إنشاء مطعم جديد
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2].map(s => (
              <div key={s} className={cn(
                "flex-1 h-1 rounded-full transition-all",
                s <= step ? "bg-primary" : "bg-border"
              )} />
            ))}
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-text-muted font-medium mb-1">الخطوة 1 — بيانات المطعم</p>
              <Field label="اسم المطعم *" error={errors.name}>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="مثال: مطعم الأصالة" className={inputCls(!!errors.name)} />
              </Field>
              <Field label="رقم الهاتف">
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="07xxxxxxxxxx" dir="ltr" className={inputCls(false)} />
              </Field>
              <Field label="العنوان">
                <input value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="بغداد، حي المنصور..." className={inputCls(false)} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-text-muted font-medium mb-1">الخطوة 2 — مدير المطعم</p>
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-text-secondary">
                سيتم إنشاء حساب مدير خاص بـ <span className="font-bold text-text-primary">{form.name}</span> — يمكنه إدارة الموظفين والطلبات
              </div>
              <Field label="الاسم الكامل *" error={errors.adminDisplayName}>
                <input value={form.adminDisplayName} onChange={e => set("adminDisplayName", e.target.value)}
                  placeholder="مثال: محمد علي" className={inputCls(!!errors.adminDisplayName)} />
              </Field>
              <Field label="اسم المستخدم *" error={errors.adminUsername} hint="إنجليزي فقط، للدخول">
                <input value={form.adminUsername} onChange={e => set("adminUsername", e.target.value.toLowerCase())}
                  placeholder="manager1" dir="ltr" className={inputCls(!!errors.adminUsername)} />
              </Field>
              <Field label="كلمة المرور *" error={errors.adminPassword}>
                <input type="password" value={form.adminPassword} onChange={e => set("adminPassword", e.target.value)}
                  placeholder="6 أحرف على الأقل" dir="ltr" className={inputCls(!!errors.adminPassword)} />
              </Field>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose}>إلغاء</Button>
              <Button onClick={() => { if (validate()) setStep(2); }}>
                التالي <Check className="w-4 h-4 mr-1" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>رجوع</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</> : "إنشاء المطعم"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
// Edit Restaurant Dialog
// ══════════════════════════════════════════════════════════════
function EditRestaurantDialog({ restaurant, onClose, onSuccess, onError }: {
  restaurant: Restaurant;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    name: restaurant.name,
    phone: restaurant.phone ?? "",
    address: restaurant.address ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await db.from("restaurants").update({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    }).eq("id", restaurant.id);
    setSaving(false);
    if (error) { onError("فشل حفظ البيانات"); return; }
    onSuccess(`تم تحديث بيانات "${form.name}"`);
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل بيانات المطعم</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-3">
            <Field label="اسم المطعم">
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={inputCls(false)} />
            </Field>
            <Field label="الهاتف">
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                dir="ltr" className={inputCls(false)} />
            </Field>
            <Field label="العنوان">
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className={inputCls(false)} />
            </Field>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</> : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Shared UI ────────────────────────────────────────────────
function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode;
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
