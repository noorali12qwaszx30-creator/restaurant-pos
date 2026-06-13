import { useState, useEffect } from "react";
import {
  Globe, Bell, Shield, Sliders, ToggleRight, ToggleLeft,
  ChevronDown, ChevronUp, Info, Palette, Database,
  Save, Loader2, RefreshCw, Key, Clock, Volume2,
  CheckCircle2, AlertTriangle, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SACard, SASection, SABadge, PulseDot } from "../components/SACard";
import { useNotify } from "@/components/notifications/NotificationContext";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ── Storage helpers ────────────────────────────────────────────
function loadSetting<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(`sa_${key}`); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function saveSetting<T>(key: string, val: T) {
  localStorage.setItem(`sa_${key}`, JSON.stringify(val));
}

interface FeatureFlag { id: string; label: string; description: string; enabled: boolean; category: string; }

const DEFAULT_FLAGS: FeatureFlag[] = [
  { id: "realtime_orders",    label: "الطلبات المباشرة",    description: "تحديثات الطلبات في الوقت الفعلي",          enabled: true,  category: "النظام"      },
  { id: "multi_restaurant",   label: "تعدد المطاعم",        description: "دعم إدارة أكثر من مطعم من حساب واحد",      enabled: true,  category: "النظام"      },
  { id: "delivery_tracking",  label: "تتبع التوصيل",        description: "تتبع السائق وحالة التوصيل المباشر",        enabled: true,  category: "الطلبات"     },
  { id: "analytics_advanced", label: "التحليلات المتقدمة",  description: "رسوم بيانية مفصلة ومقارنات",              enabled: true,  category: "التقارير"    },
  { id: "auto_assign_driver", label: "تعيين سائق تلقائي",   description: "تعيين أقرب سائق متاح تلقائياً",           enabled: false, category: "الطلبات"     },
  { id: "customer_feedback",  label: "تقييمات العملاء",      description: "نظام تقييم للعملاء بعد التوصيل",          enabled: false, category: "العملاء"     },
  { id: "inventory_mgmt",     label: "إدارة المخزون",        description: "تتبع المخزون والمواد الخام",               enabled: false, category: "المطاعم"     },
  { id: "whatsapp_notify",    label: "إشعارات واتساب",       description: "إشعارات الطلبات عبر واتساب للعملاء",      enabled: false, category: "الإشعارات"   },
  { id: "dark_mode_customer", label: "وضع داكن للعميل",      description: "وضع داكن في واجهة العملاء",               enabled: false, category: "المظهر"      },
  { id: "pos_integration",    label: "ربط بنظام POS",        description: "ربط مع أجهزة نقاط البيع الخارجية",        enabled: false, category: "النظام"      },
];

const PLATFORM_INFO = [
  { label: "الإصدار", value: "v1.4.0" },
  { label: "قاعدة البيانات", value: "Supabase PostgreSQL" },
  { label: "المصادقة", value: "Supabase Auth" },
  { label: "الاستضافة", value: "GitHub Pages" },
];

const ACCENT_COLORS = [
  { name: "أخضر",    value: "128 52% 44%" },
  { name: "زمردي",   value: "155 85% 42%" },
  { name: "ذهبي",    value: "38 95% 52%"  },
  { name: "أزرق",    value: "217 91% 60%" },
  { name: "بنفسجي",  value: "262 83% 68%" },
  { name: "أحمر",    value: "0 72% 51%"   },
];

export function SuperAdminSettingsPage() {
  const { notify } = useNotify();

  // ── Feature Flags ──────────────────────────────────────────
  const [flags, setFlags] = useState<FeatureFlag[]>(() =>
    loadSetting("feature_flags", DEFAULT_FLAGS)
  );

  // ── Platform settings ──────────────────────────────────────
  const [platformName, setPlatformName] = useState(() => loadSetting("platform_name", "النظام للإدارة المتكاملة"));
  const [platformSaving, setPlatformSaving] = useState(false);

  // ── Notification settings ─────────────────────────────────
  const [notifSettings, setNotifSettings] = useState(() => loadSetting("notif_settings", {
    sound: true, newOrder: true, loginAlert: true, cancelAlert: true, duration: 5,
  }));

  // ── Security settings ─────────────────────────────────────
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [codeSaving, setCodeSaving] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(() => loadSetting("session_timeout", 60));

  // ── Appearance ────────────────────────────────────────────
  const [accentColor, setAccentColor] = useState(() => loadSetting("accent_color", "128 52% 44%"));

  // Apply accent color on mount + change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", accentColor);
    saveSetting("accent_color", accentColor);
  }, [accentColor]);

  // ── DB stats ──────────────────────────────────────────────
  const [dbStats, setDbStats] = useState<{ table: string; count: number }[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  // ── Expanded section ──────────────────────────────────────
  const [openSection, setOpenSection] = useState<string | null>(null);

  // ── Danger zone state ─────────────────────────────────────
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ orders: number; items: number } | null>(null);
  void showDeleteDialog; void deleteConfirmText; void deleteLoading; void deleteResult; void executeDeleteOperationalData;

  async function loadDbStats() {
    setDbLoading(true);
    const t0 = Date.now();
    try {
      const [
        { count: restaurants },
        { count: profiles },
        { count: orders },
        { count: menu_items },
        { count: menu_categories },
      ] = await Promise.all([
        db.from("restaurants").select("id", { count: "exact", head: true }),
        db.from("profiles").select("id",     { count: "exact", head: true }),
        db.from("orders").select("id",        { count: "exact", head: true }),
        db.from("menu_items").select("id",    { count: "exact", head: true }),
        db.from("menu_categories").select("id",{ count: "exact", head: true }),
      ]);
      setDbLatency(Date.now() - t0);
      setDbStats([
        { table: "restaurants",    count: restaurants    ?? 0 },
        { table: "profiles",       count: profiles       ?? 0 },
        { table: "orders",         count: orders         ?? 0 },
        { table: "menu_items",     count: menu_items     ?? 0 },
        { table: "menu_categories",count: menu_categories ?? 0 },
      ]);
    } finally {
      setDbLoading(false);
    }
  }

  function toggleSection(s: string) {
    const next = openSection === s ? null : s;
    setOpenSection(next);
    if (next === "database") loadDbStats();
  }

  // ── Handlers ──────────────────────────────────────────────
  function toggleFlag(id: string) {
    const updated = flags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    setFlags(updated);
    saveSetting("feature_flags", updated);
    const flag = flags.find(f => f.id === id);
    if (flag) notify({ type: "success", title: `${flag.label} — ${flag.enabled ? "معطّل" : "مفعّل"}` });
  }

  async function savePlatformName() {
    setPlatformSaving(true);
    await new Promise(r => setTimeout(r, 400));
    saveSetting("platform_name", platformName.trim() || "النظام للإدارة المتكاملة");
    setPlatformSaving(false);
    notify({ type: "success", title: "✓ تم حفظ اسم المنصة", message: platformName });
  }

  function saveNotifSettings() {
    saveSetting("notif_settings", notifSettings);
    notify({ type: "success", title: "✓ تم حفظ إعدادات الإشعارات" });
  }

  async function changeSuperAdminCode() {
    if (!newCode || newCode.length !== 10 || !/^\d{10}$/.test(newCode)) {
      notify({ type: "error", title: "الكود يجب أن يكون 10 أرقام" }); return;
    }
    if (newCode !== confirmCode) {
      notify({ type: "error", title: "الكودان غير متطابقان" }); return;
    }
    setCodeSaving(true);
    try {
      // Check code not taken by another user
      const { data: existing } = await db.from("profiles")
        .select("id").eq("login_code", newCode).neq("restaurant_id", null).limit(1);
      if (existing && existing.length > 0) {
        notify({ type: "error", title: "الكود مستخدم بالفعل من موظف آخر" }); return;
      }
      const { error } = await db.from("profiles")
        .update({ login_code: newCode })
        .is("restaurant_id", null)
        .eq("role", "admin"); // super_admin profile
      if (error) throw error;
      notify({ type: "success", title: "✓ تم تغيير الكود", message: "الكود الجديد: " + newCode });
      setNewCode(""); setConfirmCode("");
    } catch {
      notify({ type: "error", title: "فشل تغيير الكود" });
    } finally {
      setCodeSaving(false);
    }
  }

  function saveSessionTimeout() {
    saveSetting("session_timeout", sessionTimeout);
    notify({ type: "success", title: `✓ مهلة الجلسة: ${sessionTimeout} دقيقة` });
  }

  async function executeDeleteOperationalData() {
    setDeleteLoading(true);
    try {
      // حذف order_items أولاً (foreign key) ثم orders
      const { count: itemsCount } = await db
        .from("order_items").select("id", { count: "exact", head: true });
      const { count: ordersCount } = await db
        .from("orders").select("id", { count: "exact", head: true });

      const { error: e1 } = await db.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (e1) throw e1;
      const { error: e2 } = await db.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (e2) throw e2;

      setDeleteResult({ orders: ordersCount ?? 0, items: itemsCount ?? 0 });
      notify({ type: "success", title: "✓ تم حذف البيانات التشغيلية", message: `${ordersCount ?? 0} طلب، ${itemsCount ?? 0} عنصر` });
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
      // Refresh DB stats if open
      if (openSection === "database") loadDbStats();
    } catch {
      notify({ type: "error", title: "فشل الحذف — تحقق من الصلاحيات" });
    } finally {
      setDeleteLoading(false);
    }
  }

  const categories = [...new Set(flags.map(f => f.category))];

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-6">

      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-text-primary">الإعدادات</h1>
        <p className="text-[11px] text-text-muted">إعدادات المنصة والميزات</p>
      </div>

      {/* ── Quick Settings ── */}
      <SASection title="إعدادات سريعة">
        <div className="flex flex-col gap-2">

          {/* Platform settings */}
          <SettingsPanel
            icon={Globe} label="إعدادات المنصة" sub="الاسم والهوية"
            id="platform" openSection={openSection} toggle={toggleSection}
          >
            <div className="flex flex-col gap-3 pt-1">
              <div>
                <p className="text-[11px] text-text-muted mb-1.5">اسم المنصة</p>
                <input
                  value={platformName}
                  onChange={e => setPlatformName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="اسم المنصة"
                />
              </div>
              <div className="flex gap-2 text-[11px] text-text-muted bg-surface-elevated rounded-xl p-3">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p>يظهر في الشاشات الرئيسية وعناوين الصفحات</p>
              </div>
              <button onClick={savePlatformName} disabled={platformSaving}
                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
                {platformSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ
              </button>
            </div>
          </SettingsPanel>

          {/* Notifications */}
          <SettingsPanel
            icon={Bell} label="الإشعارات" sub="صوت وتنبيهات الطلبات"
            id="notifications" openSection={openSection} toggle={toggleSection}
          >
            <div className="flex flex-col gap-3 pt-1">
              {[
                { key: "sound",       icon: Volume2,       label: "صوت الإشعارات",        desc: "تشغيل صوت عند وصول طلب جديد" },
                { key: "newOrder",    icon: Bell,          label: "طلب جديد",              desc: "إشعار فوري عند إنشاء طلب" },
                { key: "loginAlert",  icon: Shield,        label: "تنبيه دخول",            desc: "إشعار عند تسجيل دخول جديد" },
                { key: "cancelAlert", icon: AlertTriangle, label: "تنبيه إلغاء",           desc: "إشعار عند إلغاء طلب" },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-3">
                  <item.icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">{item.label}</p>
                    <p className="text-[10px] text-text-muted">{item.desc}</p>
                  </div>
                  <button onClick={() => setNotifSettings(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                    className="shrink-0 transition-all active:scale-90">
                    {notifSettings[item.key as keyof typeof notifSettings]
                      ? <ToggleRight className="w-6 h-6 text-primary" />
                      : <ToggleLeft  className="w-6 h-6 text-text-muted" />
                    }
                  </button>
                </div>
              ))}
              <div>
                <p className="text-[11px] text-text-muted mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />مدة الإشعار (ثانية): {notifSettings.duration}
                </p>
                <input type="range" min={2} max={15} value={notifSettings.duration}
                  onChange={e => setNotifSettings(p => ({ ...p, duration: Number(e.target.value) }))}
                  className="w-full accent-[hsl(var(--primary))]"
                />
              </div>
              <button onClick={saveNotifSettings}
                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                <Save className="w-4 h-4" />حفظ الإشعارات
              </button>
            </div>
          </SettingsPanel>

          {/* Security */}
          <SettingsPanel
            icon={Shield} label="الأمان" sub="كود الدخول ومهلة الجلسة"
            id="security" openSection={openSection} toggle={toggleSection}
          >
            <div className="flex flex-col gap-4 pt-1">
              {/* Change superadmin code */}
              <div className="bg-background rounded-xl p-3 border border-border">
                <p className="text-xs font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-primary" />تغيير كود مدير النظام
                </p>
                <div className="flex flex-col gap-2">
                  <input value={newCode} onChange={e => setNewCode(e.target.value.replace(/\D/g,"").slice(0,10))}
                    placeholder="الكود الجديد (10 أرقام)" dir="ltr"
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm font-mono text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tracking-widest"
                  />
                  <input value={confirmCode} onChange={e => setConfirmCode(e.target.value.replace(/\D/g,"").slice(0,10))}
                    placeholder="تأكيد الكود" dir="ltr"
                    className={cn(
                      "w-full bg-surface-elevated border rounded-xl px-3 py-2 text-sm font-mono text-text-primary outline-none focus:ring-2 focus:ring-primary/20 tracking-widest",
                      confirmCode && newCode !== confirmCode ? "border-red-500/50" : "border-border focus:border-primary"
                    )}
                  />
                  {confirmCode && newCode !== confirmCode && (
                    <p className="text-[11px] text-red-400">الكودان غير متطابقان</p>
                  )}
                  <button onClick={changeSuperAdminCode}
                    disabled={codeSaving || newCode.length !== 10 || newCode !== confirmCode}
                    className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
                    {codeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
                    تغيير الكود
                  </button>
                </div>
              </div>
              {/* Session timeout */}
              <div className="bg-background rounded-xl p-3 border border-border">
                <p className="text-xs font-bold text-text-primary mb-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  مهلة الجلسة: {sessionTimeout} دقيقة
                </p>
                <input type="range" min={15} max={480} step={15} value={sessionTimeout}
                  onChange={e => setSessionTimeout(Number(e.target.value))}
                  className="w-full accent-[hsl(var(--primary))] mb-2"
                />
                <div className="flex justify-between text-[10px] text-text-muted mb-3">
                  <span>15د</span><span>2س</span><span>4س</span><span>8س</span>
                </div>
                <button onClick={saveSessionTimeout}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-surface-elevated border border-border text-text-secondary font-semibold text-xs hover:border-primary/30 transition-colors">
                  <Save className="w-3.5 h-3.5" />حفظ المهلة
                </button>
              </div>
            </div>
          </SettingsPanel>

          {/* Appearance */}
          <SettingsPanel
            icon={Palette} label="المظهر" sub="لون التمييز والهوية البصرية"
            id="appearance" openSection={openSection} toggle={toggleSection}
          >
            <div className="flex flex-col gap-3 pt-1">
              <p className="text-[11px] text-text-muted">لون التمييز الرئيسي</p>
              <div className="grid grid-cols-6 gap-2">
                {ACCENT_COLORS.map(c => (
                  <button key={c.value} onClick={() => setAccentColor(c.value)}
                    className={cn("flex flex-col items-center gap-1 group")}
                    title={c.name}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl border-2 transition-all active:scale-90",
                      accentColor === c.value ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                    )}
                      style={{ background: `hsl(${c.value})` }}
                    />
                    <p className="text-[9px] text-text-muted">{c.name}</p>
                  </button>
                ))}
              </div>
              <div className="bg-background border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: `hsl(${accentColor})` }} />
                <div>
                  <p className="text-xs font-semibold text-text-primary">اللون الحالي</p>
                  <p className="text-[10px] text-text-muted font-mono">{accentColor}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-auto" />
              </div>
              <p className="text-[10px] text-text-muted text-center">التغيير يُطبَّق فوراً على جميع الصفحات</p>
            </div>
          </SettingsPanel>

          {/* Database */}
          <SettingsPanel
            icon={Database} label="قاعدة البيانات" sub="الحالة والإحصائيات"
            id="database" openSection={openSection} toggle={toggleSection}
          >
            <div className="flex flex-col gap-3 pt-1">
              {/* Latency */}
              {dbLatency !== null && (
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  dbLatency < 200 ? "bg-emerald-500/8 border-emerald-500/20" :
                  dbLatency < 500 ? "bg-amber-500/8 border-amber-500/20" :
                  "bg-red-500/8 border-red-500/20"
                )}>
                  <PulseDot color={dbLatency < 200 ? "success" : dbLatency < 500 ? "warning" : "error"} />
                  <p className="text-xs text-text-secondary flex-1">زمن الاستجابة</p>
                  <p className={cn("text-sm font-black font-mono",
                    dbLatency < 200 ? "text-emerald-400" : dbLatency < 500 ? "text-amber-400" : "text-red-400"
                  )}>
                    {dbLatency}ms
                  </p>
                </div>
              )}
              {/* Table counts */}
              {dbLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : dbStats.length > 0 ? (
                <div className="bg-background border border-border rounded-xl overflow-hidden">
                  {dbStats.map((s, i) => (
                    <div key={s.table} className={cn(
                      "flex items-center justify-between px-3 py-2.5",
                      i < dbStats.length - 1 && "border-b border-border"
                    )}>
                      <p className="text-xs text-text-secondary font-mono">{s.table}</p>
                      <p className="text-sm font-black text-primary tabular-nums font-mono">{s.count.toLocaleString("en-US")}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <button onClick={loadDbStats} disabled={dbLoading}
                className="flex items-center justify-center gap-2 h-9 rounded-xl bg-surface-elevated border border-border text-text-secondary font-semibold text-xs hover:border-primary/30 transition-colors disabled:opacity-40">
                <RefreshCw className={cn("w-3.5 h-3.5", dbLoading && "animate-spin")} />
                تحديث الإحصائيات
              </button>
            </div>
          </SettingsPanel>

        </div>
      </SASection>

      {/* ── Feature Flags ── */}
      <SASection title="Feature Flags" subtitle="تفعيل أو تعطيل ميزات المنصة"
        action={<SABadge color="info">{flags.filter(f => f.enabled).length} مفعّل</SABadge>}>
        {categories.map(cat => (
          <div key={cat} className="mb-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-3 h-3" />{cat}
            </p>
            <div className="flex flex-col gap-2">
              {flags.filter(f => f.category === cat).map(flag => (
                <SACard key={flag.id} className="px-3.5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary">{flag.label}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{flag.description}</p>
                  </div>
                  <button onClick={() => toggleFlag(flag.id)} className="shrink-0 transition-all active:scale-90">
                    {flag.enabled
                      ? <ToggleRight className="w-7 h-7 text-primary" />
                      : <ToggleLeft  className="w-7 h-7 text-text-muted" />
                    }
                  </button>
                </SACard>
              ))}
            </div>
          </div>
        ))}
      </SASection>

      {/* ── Platform info ── */}
      <SASection title="معلومات المنصة">
        <SACard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-bold text-primary">بيانات النظام</p>
          </div>
          <div className="flex flex-col gap-2">
            {PLATFORM_INFO.map(item => (
              <div key={item.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="text-xs font-semibold text-text-primary font-mono">{item.value}</p>
              </div>
            ))}
          </div>
        </SACard>
      </SASection>

    </div>
  );
}

// ── Reusable expandable panel ──────────────────────────────────
function SettingsPanel({
  icon: Icon, label, sub, id, openSection, toggle, children,
}: {
  icon: React.ElementType; label: string; sub: string;
  id: string; openSection: string | null; toggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = openSection === id;
  return (
    <SACard className={cn("overflow-hidden transition-all", isOpen && "border-primary/30")}>
      <button
        onClick={() => toggle(id)}
        className={cn(
          "w-full px-4 py-3.5 flex items-center gap-3 transition-colors",
          isOpen ? "bg-primary/8" : "hover:bg-surface-elevated"
        )}
      >
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          isOpen ? "bg-primary/20" : "bg-surface-elevated")}>
          <Icon className={cn("w-4 h-4 transition-colors", isOpen ? "text-primary" : "text-text-muted")} />
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-text-primary">{label}</p>
          <p className="text-[11px] text-text-muted">{sub}</p>
        </div>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-primary shrink-0" />
          : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
        }
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border/50">
          {children}
        </div>
      )}
    </SACard>
  );
}
