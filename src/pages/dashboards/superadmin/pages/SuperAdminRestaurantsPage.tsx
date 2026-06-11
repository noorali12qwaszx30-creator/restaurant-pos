/**
 * Super Admin — إدارة المطاعم
 */
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Building2, Users, ShoppingBag, ToggleRight, ToggleLeft,
  Loader2, RefreshCw, Phone, MapPin, Edit2, Hash, Copy, Check,
  UserPlus, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNotify } from "@/components/notifications/NotificationContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Restaurant {
  id: string; name: string; phone: string | null;
  address: string | null; logo: string | null;
  is_active: boolean; created_at: string;
  _stats?: { staff: number; orders: number };
}

export function SuperAdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [addOpen, setAddOpen]         = useState(false);
  const [editRest, setEditRest]       = useState<Restaurant | null>(null);
  const [addAdminFor, setAddAdminFor] = useState<Restaurant | null>(null);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const { notify } = useNotify();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: rests, error } = await db.from("restaurants").select("*").order("created_at", { ascending: false });
      if (error) throw error;

      const enriched = await Promise.all((rests ?? []).map(async (r: Restaurant) => {
        const [{ count: staff }, { count: orders }] = await Promise.all([
          db.from("profiles").select("id", { count: "exact", head: true }).eq("restaurant_id", r.id),
          db.from("orders").select("id",  { count: "exact", head: true }).eq("restaurant_id", r.id),
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
      notify({ type: "success", title: next ? "✓ تم تفعيل المطعم" : "تم تعطيل المطعم", message: r.name });
    }
  }

  const activeCount = restaurants.filter(r => r.is_active).length;
  const totalOrders = restaurants.reduce((s, r) => s + (r._stats?.orders ?? 0), 0);
  const totalStaff  = restaurants.reduce((s, r) => s + (r._stats?.staff  ?? 0), 0);

  return (
    <div className="flex flex-col pb-4">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4 pb-3">
        {[
          { label: "المطاعم",  value: restaurants.length, sub: `${activeCount} نشط` },
          { label: "الموظفون", value: totalStaff,          sub: "إجمالي"            },
          { label: "الطلبات",  value: totalOrders,         sub: "إجمالي"            },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-2xl px-3 py-3 text-center">
            <p className="text-xl font-black text-primary tabular-nums">{s.value.toLocaleString("en-US")}</p>
            <p className="text-[10px] text-text-muted">{s.label}</p>
            <p className="text-[10px] text-text-secondary">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="px-4 flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-text-primary">المطاعم المسجّلة</p>
        <div className="flex gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors">
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" /> مطعم جديد
          </Button>
        </div>
      </div>

      {/* ── List ── */}
      <div className="px-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <Building2 className="w-12 h-12 text-text-muted/20" />
            <p className="text-text-muted text-sm">لا توجد مطاعم</p>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 ml-1" /> أضف أول مطعم
            </Button>
          </div>
        ) : restaurants.map(r => (
          <div key={r.id} className={cn(
            "bg-surface border rounded-2xl overflow-hidden transition-all",
            r.is_active ? "border-border" : "border-border opacity-60"
          )}>
            {/* Main row */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg font-black",
                  r.is_active ? "bg-primary/15 text-primary" : "bg-surface-elevated text-text-muted"
                )}>
                  {r.logo ? <img src={r.logo} alt={r.name} className="w-full h-full object-cover rounded-xl" /> : r.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-text-primary truncate">{r.name}</p>
                    {!r.is_active && (
                      <span className="text-[10px] bg-status-error/10 text-status-error border border-status-error/20 rounded-full px-2 py-0.5 font-medium shrink-0">معطّل</span>
                    )}
                  </div>
                  {r.phone && <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{r.phone}</p>}
                  {r.address && <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{r.address}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setExpanded(e => e === r.id ? null : r.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-elevated transition-colors">
                    {expanded === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditRest(r)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-elevated hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleActive(r)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-elevated transition-colors">
                    {r.is_active
                      ? <ToggleRight className="w-5 h-5 text-status-success" />
                      : <ToggleLeft  className="w-5 h-5 text-text-muted" />
                    }
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Users className="w-3.5 h-3.5" />{r._stats?.staff ?? 0} موظف
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <ShoppingBag className="w-3.5 h-3.5" />{(r._stats?.orders ?? 0).toLocaleString("en-US")} طلب
                </span>
                <span className="mr-auto text-[10px] text-text-muted font-mono">
                  {new Date(r.created_at).toLocaleDateString("ar-IQ")}
                </span>
              </div>
            </div>

            {/* Expanded actions */}
            {expanded === r.id && (
              <div className="border-t border-border bg-surface-elevated px-4 py-3 flex gap-2">
                <button
                  onClick={() => { setAddAdminFor(r); setExpanded(null); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  إضافة مدير
                </button>
                <button
                  onClick={() => { setEditRest(r); setExpanded(null); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-border transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  تعديل
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dialogs */}
      <AddRestaurantDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={(msg) => { notify({ type: "success", title: "✓ تم إنشاء المطعم", message: msg }); load(); setAddOpen(false); }}
        onError={(msg) => notify({ type: "error", title: "فشل الإنشاء", message: msg })}
      />

      {editRest && (
        <EditRestaurantDialog
          restaurant={editRest}
          onClose={() => setEditRest(null)}
          onSuccess={(msg) => { notify({ type: "success", title: "✓ تم التحديث", message: msg }); load(); setEditRest(null); }}
          onError={(msg) => notify({ type: "error", title: "فشل التحديث", message: msg })}
        />
      )}

      {addAdminFor && (
        <AddAdminDialog
          restaurant={addAdminFor}
          onClose={() => setAddAdminFor(null)}
          onSuccess={(msg) => { notify({ type: "success", title: "✓ تم إنشاء المدير", message: msg }); load(); setAddAdminFor(null); }}
          onError={(msg) => notify({ type: "error", title: "فشل الإنشاء", message: msg })}
        />
      )}
    </div>
  );
}

// ══ Add Restaurant ════════════════════════════════════════════════
function AddRestaurantDialog({ open, onClose, onSuccess, onError }: {
  open: boolean; onClose: () => void;
  onSuccess: (msg: string) => void; onError: (msg: string) => void;
}) {
  const [form, setForm]         = useState({ name: "", phone: "", address: "", adminName: "" });
  const [saving, setSaving]     = useState(false);
  const [nameErr, setNameErr]   = useState("");
  const [adminErr, setAdminErr] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);

  function reset() { setForm({ name: "", phone: "", address: "", adminName: "" }); setCreatedCode(null); setCopied(false); }

  async function handleSubmit() {
    if (!form.name.trim())      { setNameErr("اسم المطعم مطلوب"); return; }
    if (!form.adminName.trim()) { setAdminErr("اسم المدير مطلوب"); return; }
    setSaving(true);
    try {
      // 1. إنشاء المطعم
      const { data: rest, error: restErr } = await db.from("restaurants").insert({
        name:    form.name.trim(),
        phone:   form.phone.trim() || null,
        address: form.address.trim() || null,
        is_active: true,
      }).select().single();
      if (restErr) throw restErr;

      // 2. إنشاء حساب المدير
      const { data: userData, error: fnErr } = await supabase.functions.invoke("create-user", {
        body: { display_name: form.adminName.trim(), role: "admin", restaurant_id: rest.id },
      });
      if (fnErr) throw fnErr;
      if (userData?.error) throw new Error(userData.error);

      setCreatedCode(userData?.profile?.login_code ?? null);
      onSuccess(`"${rest.name}" + مدير "${form.adminName}"`);
    } catch (e: unknown) {
      onError((e as { message?: string }).message ?? "خطأ غير معروف");
    } finally {
      setSaving(false);
    }
  }

  function copyCode() {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" />إنشاء مطعم جديد</DialogTitle></DialogHeader>
        <DialogBody>
          {createdCode ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-status-success/10 flex items-center justify-center">
                <Check className="w-7 h-7 text-status-success" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">تم إنشاء المطعم والمدير</p>
                <p className="text-xs text-text-muted mt-1">{form.name} · {form.adminName}</p>
              </div>
              <button onClick={copyCode} className="flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-2xl px-5 py-3 hover:bg-primary/20 transition-all">
                <Hash className="w-4 h-4 text-primary" />
                <span className="text-lg font-black tracking-widest text-primary font-mono">{createdCode}</span>
                {copied ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4 text-text-muted" />}
              </button>
              <p className="text-[11px] text-text-muted">كود دخول المدير — انسخه وشاركه معه</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* بيانات المطعم */}
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">بيانات المطعم</p>
              <F label="اسم المطعم *" error={nameErr}>
                <input value={form.name} onChange={e => { setForm(p=>({...p,name:e.target.value})); setNameErr(""); }}
                  placeholder="مثال: مطعم الأصالة" className={iCls(!!nameErr)} autoFocus />
              </F>
              <F label="رقم الهاتف">
                <input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))}
                  placeholder="07xxxxxxxxxx" dir="ltr" className={iCls(false)} />
              </F>
              <F label="العنوان">
                <input value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))}
                  placeholder="المدينة، الحي..." className={iCls(false)} />
              </F>
              {/* بيانات المدير */}
              <div className="border-t border-border pt-3 mt-1">
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">حساب المدير</p>
                <F label="اسم المدير *" error={adminErr}>
                  <input value={form.adminName} onChange={e => { setForm(p=>({...p,adminName:e.target.value})); setAdminErr(""); }}
                    placeholder="مثال: أحمد محمد" className={iCls(!!adminErr)} />
                </F>
                <p className="text-[11px] text-text-muted mt-2">سيتم توليد كود دخول من 10 أرقام تلقائياً</p>
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {createdCode ? (
            <Button className="w-full" onClick={() => { reset(); onClose(); }}>إغلاق</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>إلغاء</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الإنشاء...</> : "إنشاء"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══ Edit Restaurant ═══════════════════════════════════════════════
function EditRestaurantDialog({ restaurant, onClose, onSuccess, onError }: {
  restaurant: Restaurant; onClose: () => void;
  onSuccess: (msg: string) => void; onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({ name: restaurant.name, phone: restaurant.phone ?? "", address: restaurant.address ?? "" });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await db.from("restaurants").update({
      name: form.name.trim(), phone: form.phone.trim() || null, address: form.address.trim() || null,
    }).eq("id", restaurant.id);
    setSaving(false);
    if (error) { onError("فشل حفظ البيانات"); return; }
    onSuccess(`تم تحديث "${form.name}"`);
  }

  async function handleDelete() {
    setSaving(true);
    const { error } = await db.from("restaurants").update({ is_active: false }).eq("id", restaurant.id);
    setSaving(false);
    if (error) { onError("فشل التعطيل"); return; }
    onSuccess(`تم تعطيل "${restaurant.name}" نهائياً`);
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>تعديل بيانات المطعم</DialogTitle></DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-3">
            <F label="الاسم"><input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} className={iCls(false)} /></F>
            <F label="الهاتف"><input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} dir="ltr" className={iCls(false)} /></F>
            <F label="العنوان"><input value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} className={iCls(false)} /></F>

            {/* Danger */}
            <div className="border border-status-error/20 rounded-xl p-3 bg-status-error/5 mt-1">
              <p className="text-xs font-medium text-status-error mb-2">منطقة الخطر</p>
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)} className="flex items-center gap-1.5 text-xs text-status-error font-medium hover:underline">
                  <Trash2 className="w-3.5 h-3.5" />تعطيل المطعم نهائياً
                </button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConfirmDel(false)} className="flex-1">إلغاء</Button>
                  <button onClick={handleDelete} disabled={saving}
                    className="flex-1 h-8 rounded-lg bg-status-error text-white text-xs font-semibold flex items-center justify-center gap-1">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    تأكيد التعطيل
                  </button>
                </div>
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />حفظ...</> : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══ Add Admin for Restaurant ═══════════════════════════════════════
function AddAdminDialog({ restaurant, onClose, onSuccess, onError }: {
  restaurant: Restaurant; onClose: () => void;
  onSuccess: (msg: string) => void; onError: (msg: string) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving]           = useState(false);
  const [nameErr, setNameErr]         = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  async function handleSubmit() {
    if (!displayName.trim()) { setNameErr("الاسم مطلوب"); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { display_name: displayName.trim(), role: "admin", restaurant_id: restaurant.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCreatedCode(data?.profile?.login_code ?? null);
      onSuccess(`مدير "${displayName}" للمطعم "${restaurant.name}"`);
    } catch (e: unknown) {
      onError((e as { message?: string }).message ?? "فشل الإنشاء");
    } finally {
      setSaving(false);
    }
  }

  function copyCode() {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            إضافة مدير لـ {restaurant.name}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {createdCode ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-status-success/10 flex items-center justify-center">
                <Check className="w-7 h-7 text-status-success" />
              </div>
              <p className="text-sm font-bold text-text-primary">تم إنشاء حساب المدير</p>
              <button onClick={copyCode} className="flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-2xl px-5 py-3 hover:bg-primary/20 transition-all">
                <Hash className="w-4 h-4 text-primary" />
                <span className="text-lg font-black tracking-widest text-primary font-mono">{createdCode}</span>
                {copied ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4 text-text-muted" />}
              </button>
              <p className="text-[11px] text-text-muted">كود الدخول — انسخه وشاركه مع المدير</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-text-secondary">
                سيتم إنشاء حساب بدور <span className="text-primary font-bold">مدير مطعم</span> لـ <span className="font-bold text-text-primary">{restaurant.name}</span>
              </div>
              <F label="الاسم الكامل" error={nameErr}>
                <input value={displayName} onChange={e => { setDisplayName(e.target.value); setNameErr(""); }}
                  placeholder="مثال: أحمد محمد" className={iCls(!!nameErr)} autoFocus />
              </F>
              <p className="text-[11px] text-text-muted text-center">سيتم توليد كود دخول من 10 أرقام تلقائياً</p>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {createdCode ? (
            <Button className="w-full" onClick={onClose}>إغلاق</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />جاري...</> : "إنشاء المدير"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      {children}
      {error && <p className="text-xs text-status-error">{error}</p>}
    </div>
  );
}
function iCls(hasErr: boolean) {
  return cn(
    "bg-surface-elevated border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary",
    hasErr ? "border-status-error" : "border-border"
  );
}
