/**
 * AdminCommandCenterPage — مركز القيادة التشغيلية
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity, TrendingUp, Users, Clock, AlertTriangle,
  RefreshCw, Zap, Target, Award, Star,
  ArrowUpRight, ArrowDownRight,
  ShoppingBag, Truck, BarChart3,
  CheckCircle2, XCircle, AlertCircle,
  Timer, Brain, Flame, Layers,
  ChefHat, CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ── Types ──────────────────────────────────────────────────────
interface RawOrder {
  id: string;
  order_number: number;
  type: string;
  status: string;
  total: number;
  customer_name: string | null;
  cashier_id: string | null;
  driver_id: string | null;
  created_at: string;
  preparing_at: string | null;
  ready_at: string | null;
  delivering_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  has_issue: boolean | null;
}

interface StaffMember {
  id: string;
  display_name: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
}

// ── Helpers ────────────────────────────────────────────────────
function minutesAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}
function diffMin(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 60000));
}
function avgOf(nums: (number | null)[]): number {
  const v = nums.filter((n): n is number => n !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
}
function fmt(n: number) { return n.toLocaleString("en-US"); }

// ── Constants ──────────────────────────────────────────────────
const TABS = [
  { id: "live",        label: "لحظي",   icon: Activity  },
  { id: "performance", label: "الأداء",  icon: BarChart3 },
  { id: "team",        label: "الفريق",  icon: Users     },
  { id: "insights",    label: "رؤى",    icon: Brain     },
] as const;
type TabId = typeof TABS[number]["id"];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; lateMin: number }> = {
  pending:    { label: "انتظار",  color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20",   lateMin: 10  },
  preparing:  { label: "تحضير",   color: "text-primary",     bg: "bg-primary/10 border-primary/20",       lateMin: 25  },
  ready:      { label: "جاهز",    color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", lateMin: 15 },
  delivering: { label: "توصيل",   color: "text-sky-400",     bg: "bg-sky-400/10 border-sky-400/20",       lateMin: 45  },
  delivered:  { label: "مُسلَّم", color: "text-emerald-400", bg: "bg-emerald-400/8 border-emerald-400/15", lateMin: 999 },
  cancelled:  { label: "ملغي",   color: "text-red-400",     bg: "bg-red-400/8 border-red-400/15",        lateMin: 999 },
};

const ROLE_LABEL: Record<string, string> = {
  cashier: "كاشير", kitchen: "مطبخ", field: "ميداني",
  delivery: "سائق", takeaway: "تيك أواي", admin: "مدير",
};

// ══════════════════════════════════════════════════════════════
//   MAIN
// ══════════════════════════════════════════════════════════════
export function AdminCommandCenterPage() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurantId ?? null;

  const [tab, setTab]         = useState<TabId>("live");
  const [loading, setLoading] = useState(true);
  const [refreshed, setRefreshed] = useState(new Date());

  const [todayOrders, setTodayOrders] = useState<RawOrder[]>([]);
  const [weekOrders, setWeekOrders]   = useState<RawOrder[]>([]);
  const [staff, setStaff]             = useState<StaffMember[]>([]);
  const [todayItems, setTodayItems]   = useState<{ name: string; quantity: number; order_id: string }[]>([]);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const weekAgo    = new Date(Date.now() - 7 * 86400000);

      const [{ data: tDay }, { data: wOrders }, { data: staffData }] = await Promise.all([
        db.from("orders")
          .select("id,order_number,type,status,total,customer_name,cashier_id,driver_id,created_at,preparing_at,ready_at,delivering_at,delivered_at,cancelled_at,has_issue")
          .eq("restaurant_id", restaurantId)
          .gte("created_at", todayStart.toISOString()),
        db.from("orders")
          .select("id,status,total,type,created_at,delivering_at,delivered_at,cancelled_at")
          .eq("restaurant_id", restaurantId)
          .gte("created_at", weekAgo.toISOString())
          .lt("created_at", todayStart.toISOString()),
        db.from("profiles")
          .select("id,display_name,role,is_active,last_login_at")
          .eq("restaurant_id", restaurantId)
          .neq("role", "super_admin"),
      ]);

      const today: RawOrder[] = tDay ?? [];
      setTodayOrders(today);
      setWeekOrders(wOrders ?? []);
      setStaff(staffData ?? []);

      if (today.length > 0) {
        const { data: items } = await db.from("order_items")
          .select("name,quantity,order_id")
          .in("order_id", today.map((o: RawOrder) => o.id));
        setTodayItems(items ?? []);
      } else {
        setTodayItems([]);
      }
      setRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 90_000); return () => clearInterval(t); }, [load]);

  // ── Metrics ────────────────────────────────────────────────
  const M = useMemo(() => {
    const delivered = todayOrders.filter(o => o.status === "delivered");
    const cancelled = todayOrders.filter(o => o.status === "cancelled");
    const active    = todayOrders.filter(o => !["delivered","cancelled"].includes(o.status));
    const issues    = todayOrders.filter(o => o.has_issue);

    const revenue   = delivered.reduce((s, o) => s + Number(o.total), 0);
    const compRate  = (delivered.length + cancelled.length) > 0
      ? Math.round(delivered.length / (delivered.length + cancelled.length) * 100) : 0;

    const prepTimes  = delivered.map(o => diffMin(o.created_at, o.preparing_at));
    const readyTimes = delivered.map(o => diffMin(o.preparing_at, o.ready_at));
    const delivTimes = delivered.filter(o => o.type === "delivery").map(o => diffMin(o.delivering_at, o.delivered_at));

    const now = Date.now();
    const late = active.filter(o => {
      const elapsed = (now - new Date(o.created_at).getTime()) / 60000;
      return elapsed > (STATUS_CFG[o.status]?.lateMin ?? 999);
    });

    // Hourly today
    const hourly = Array(24).fill(0);
    todayOrders.forEach(o => { hourly[new Date(o.created_at).getHours()]++; });

    // Week daily (index 0 = 7 days ago, 6 = yesterday)
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekDaily  = Array(7).fill(0);
    weekOrders.forEach(o => {
      const day = Math.floor((todayStart.getTime() - new Date(o.created_at).getTime()) / 86400000);
      if (day >= 1 && day <= 7) weekDaily[7 - day]++;
    });

    // Yesterday revenue
    const yestStart  = new Date(todayStart.getTime() - 86400000);
    const yestRevenue = weekOrders
      .filter(o => { const t = new Date(o.created_at).getTime(); return t >= yestStart.getTime() && t < todayStart.getTime() && o.status === "delivered"; })
      .reduce((s, o) => s + Number(o.total), 0);

    // Top items
    const itemMap: Record<string, { name: string; qty: number }> = {};
    todayItems.forEach(it => {
      if (!itemMap[it.name]) itemMap[it.name] = { name: it.name, qty: 0 };
      itemMap[it.name].qty += it.quantity;
    });
    const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Order types
    const types = { delivery: 0, takeaway: 0, pickup: 0 } as Record<string, number>;
    todayOrders.forEach(o => { if (o.type in types) types[o.type]++; });

    // Staff activity
    const staffActivity = staff.map(s => ({
      ...s,
      asCashier: todayOrders.filter(o => o.cashier_id === s.id).length,
      asDriver:  todayOrders.filter(o => o.driver_id  === s.id && o.status === "delivered").length,
    }));

    // Peak hour (weighted: week * 1 + today * 2)
    const allHourly = Array(24).fill(0);
    weekOrders.forEach(o => { allHourly[new Date(o.created_at).getHours()]++; });
    todayOrders.forEach(o => { allHourly[new Date(o.created_at).getHours()] += 2; });
    const peakHour = allHourly.indexOf(Math.max(...allHourly));

    // Cancellation by hour
    const cancelByHour = Array(24).fill(0);
    todayOrders.filter(o => o.status === "cancelled").forEach(o => {
      cancelByHour[new Date(o.created_at).getHours()]++;
    });

    return {
      total: todayOrders.length, active, delivered, cancelled,
      activeCount: active.length, deliveredCount: delivered.length,
      cancelledCount: cancelled.length, issueCount: issues.length,
      revenue, yestRevenue, compRate, late,
      avgPrepTime:  avgOf(prepTimes),
      avgReadyTime: avgOf(readyTimes),
      avgDelivTime: avgOf(delivTimes),
      hourly, weekDaily, topItems, types, staffActivity, peakHour, cancelByHour,
    };
  }, [todayOrders, weekOrders, staff, todayItems]);

  return (
    <div className="flex flex-col gap-0 -mx-4">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-[var(--header-height)] z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-black text-text-primary flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary" />
            مركز القيادة التشغيلية
          </h1>
          <p className="text-[9px] text-text-muted">
            آخر تحديث {refreshed.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {M.late.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-400/10 border border-red-400/25 rounded-full text-[9px] font-bold text-red-400 animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" />{M.late.length} متأخر
            </span>
          )}
          <button onClick={load} disabled={loading}
            className="w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary disabled:opacity-40 transition-colors">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-4 border-b border-border bg-surface">
        {[
          { label: "اليوم",    value: M.total,          icon: ShoppingBag, color: "text-primary"      },
          { label: "نشط",      value: M.activeCount,    icon: Zap,         color: "text-amber-400"    },
          { label: "مُسلَّم",  value: M.deliveredCount, icon: CheckCircle2,color: "text-emerald-400"  },
          { label: "ملغي",     value: M.cancelledCount, icon: XCircle,     color: "text-red-400"      },
        ].map((k, i) => (
          <div key={k.label} className={cn("flex flex-col items-center py-3", i > 0 && "border-r border-border")}>
            <k.icon className={cn("w-3.5 h-3.5 mb-1", k.color)} />
            <p className={cn("text-xl font-black tabular-nums font-mono leading-none", k.color)}>{k.value}</p>
            <p className="text-[9px] text-text-muted mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex border-b border-border bg-surface sticky top-[calc(var(--header-height)+72px)] z-10">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-all",
              tab === t.id
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted hover:text-text-secondary"
            )}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-4 pb-4 flex flex-col gap-4">
        {tab === "live"        && <LiveTab        M={M} loading={loading && M.total === 0} />}
        {tab === "performance" && <PerformanceTab M={M} loading={loading && M.total === 0} />}
        {tab === "team"        && <TeamTab        M={M} loading={loading && M.total === 0} />}
        {tab === "insights"    && <InsightsTab    M={M} loading={loading && M.total === 0} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB 1 — LIVE
// ══════════════════════════════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LiveTab({ M, loading }: { M: any; loading: boolean }) {
  if (loading) return <Skeleton />;
  return (
    <div className="flex flex-col gap-4">

      {/* Critical: late orders */}
      {M.late.length > 0 && (
        <section className="bg-red-400/6 border border-red-400/20 rounded-2xl p-3">
          <p className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />تدخل فوري مطلوب
          </p>
          <div className="flex flex-col gap-1.5">
            {M.late.slice(0, 5).map((o: RawOrder) => {
              const elapsed = minutesAgo(o.created_at);
              const cfg = STATUS_CFG[o.status];
              return (
                <div key={o.id} className="flex items-center justify-between bg-red-400/5 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-400/15 text-[9px] font-black text-red-400 flex items-center justify-center">#{o.order_number}</span>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{o.customer_name ?? "عميل"}</p>
                      <span className={cn("text-[9px] font-bold", cfg?.color)}>{cfg?.label}</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-red-400 font-mono">{elapsed}د</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Issue alerts */}
      {M.issueCount > 0 && (
        <div className="flex items-center gap-2.5 bg-amber-400/6 border border-amber-400/20 rounded-2xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs font-semibold text-amber-400">{M.issueCount} طلب يحتوي مشكلة مُبلَّغة</p>
        </div>
      )}

      {/* Pipeline grid */}
      <section>
        <SectionHeader icon={Activity} title="خط سير الطلبات" />
        <div className="grid grid-cols-2 gap-2">
          {(["pending","preparing","ready","delivering"] as const).map(status => {
            const orders: RawOrder[] = M.active.filter((o: RawOrder) => o.status === status);
            const cfg = STATUS_CFG[status];
            const oldest = orders.length > 0 ? Math.max(...orders.map((o: RawOrder) => minutesAgo(o.created_at))) : null;
            const isOverdue = oldest !== null && oldest > cfg.lateMin;
            return (
              <div key={status} className={cn("rounded-2xl border p-3.5 relative overflow-hidden", cfg.bg)}>
                {isOverdue && (
                  <div className="absolute top-2 left-2">
                    <Timer className="w-3 h-3 text-red-400" />
                  </div>
                )}
                <p className={cn("text-[10px] font-bold mb-1.5", cfg.color)}>{cfg.label}</p>
                <p className={cn("text-3xl font-black font-mono tabular-nums leading-none", cfg.color)}>{orders.length}</p>
                {oldest !== null && (
                  <p className={cn("text-[9px] mt-1.5", isOverdue ? "text-red-400 font-bold" : "text-text-muted")}>
                    أقدم: {oldest} دقيقة
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Active order list */}
      {M.active.length > 0 && (
        <section>
          <SectionHeader icon={Zap} title="قائمة الطلبات النشطة" />
          <div className="flex flex-col gap-1.5">
            {M.active.slice(0, 10).map((o: RawOrder) => {
              const elapsed = minutesAgo(o.created_at);
              const cfg = STATUS_CFG[o.status];
              const isLate = elapsed > (cfg?.lateMin ?? 999);
              return (
                <div key={o.id} className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
                  isLate ? "bg-red-400/5 border-red-400/20" : "bg-surface-elevated border-border"
                )}>
                  <span className="text-[9px] font-black text-text-muted font-mono w-7 shrink-0">#{o.order_number}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{o.customer_name ?? "—"}</p>
                    <span className={cn("text-[9px] font-bold", cfg?.color)}>{cfg?.label}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={cn("text-xs font-black font-mono tabular-nums", isLate ? "text-red-400" : "text-text-muted")}>{elapsed}د</span>
                    <span className="text-[9px] text-text-muted">{fmt(Number(o.total))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {M.active.length === 0 && (
        <EmptyState icon={CheckCircle2} title="لا توجد طلبات نشطة" sub="كل الطلبات مكتملة" />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB 2 — PERFORMANCE
// ══════════════════════════════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PerformanceTab({ M, loading }: { M: any; loading: boolean }) {
  if (loading) return <Skeleton />;

  const revTrend = M.yestRevenue > 0
    ? Math.round((M.revenue - M.yestRevenue) / M.yestRevenue * 100) : null;

  return (
    <div className="flex flex-col gap-4">

      {/* Revenue hero */}
      <div className="bg-primary/6 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">إيراد اليوم</p>
          {revTrend !== null && (
            <TrendBadge value={revTrend} />
          )}
        </div>
        <p className="text-3xl font-black text-primary tabular-nums font-mono">{fmt(M.revenue)}</p>
        <p className="text-[10px] text-text-muted mt-1.5 border-t border-primary/15 pt-1.5">
          الأمس: {fmt(M.yestRevenue)} د.ع · متوسط الطلب: {M.deliveredCount > 0 ? fmt(Math.round(M.revenue / M.deliveredCount)) : "—"} د.ع
        </p>
      </div>

      {/* Processing times */}
      <section>
        <SectionHeader icon={Clock} title="متوسط أوقات المعالجة" />
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "انتظار→تحضير", value: M.avgPrepTime,  color: "text-primary"   },
            { label: "تحضير→جاهز",   value: M.avgReadyTime, color: "text-amber-400" },
            { label: "توصيل للعميل",  value: M.avgDelivTime, color: "text-sky-400"   },
          ].map(k => (
            <div key={k.label} className="bg-surface-elevated border border-border rounded-2xl p-3 text-center">
              <p className={cn("text-2xl font-black font-mono tabular-nums leading-none", k.color)}>
                {k.value || "—"}
              </p>
              <p className="text-[9px] text-text-muted mt-1">دقيقة</p>
              <p className="text-[9px] font-medium text-text-secondary mt-1 leading-tight">{k.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Completion rate ring */}
      <div className="flex items-center gap-4 bg-surface-elevated border border-border rounded-2xl px-4 py-3.5">
        <RingChart value={M.compRate} size={60} />
        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">معدل الإتمام</p>
          <p className="text-[10px] text-text-muted mt-0.5">{M.deliveredCount} مُسلَّم · {M.cancelledCount} ملغي من {M.total} طلب</p>
          <p className={cn("text-xs font-bold mt-1.5",
            M.compRate >= 85 ? "text-emerald-400" : M.compRate >= 65 ? "text-amber-400" : "text-red-400"
          )}>
            {M.compRate >= 85 ? "✓ أداء ممتاز" : M.compRate >= 65 ? "⚠ أداء مقبول" : "✗ يحتاج مراجعة"}
          </p>
        </div>
      </div>

      {/* Order types */}
      <section>
        <SectionHeader icon={Layers} title="توزيع أنواع الطلبات" />
        <div className="flex flex-col gap-2.5">
          {[
            { key: "delivery", label: "توصيل",   colorBar: "bg-sky-400",     icon: Truck       },
            { key: "takeaway", label: "تيك أواي", colorBar: "bg-primary",     icon: ShoppingBag },
            { key: "pickup",   label: "استلام",   colorBar: "bg-emerald-400", icon: ChefHat     },
          ].map(t => {
            const count = M.types[t.key] ?? 0;
            const pct   = M.total > 0 ? Math.round(count / M.total * 100) : 0;
            return (
              <div key={t.key} className="flex items-center gap-3">
                <t.icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <p className="text-xs text-text-secondary w-16 shrink-0">{t.label}</p>
                <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", t.colorBar)}
                    style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs font-bold text-text-primary tabular-nums font-mono w-16 text-left shrink-0">
                  {count} <span className="text-[9px] text-text-muted font-normal">({pct}%)</span>
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hourly heatmap */}
      <section>
        <SectionHeader icon={BarChart3} title="توزيع الطلبات بالساعة" />
        <div className="bg-surface-elevated border border-border rounded-2xl p-3">
          <HourlyBars data={M.hourly} />
        </div>
      </section>

      {/* Top items */}
      {M.topItems.length > 0 && (
        <section>
          <SectionHeader icon={Star} title="الأكثر طلباً اليوم" />
          <div className="flex flex-col gap-1.5">
            {M.topItems.map((item: { name: string; qty: number }, i: number) => {
              const maxQty = M.topItems[0].qty;
              return (
                <div key={item.name} className="flex items-center gap-3 bg-surface-elevated border border-border rounded-xl px-3 py-2.5">
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0",
                    i === 0 ? "bg-amber-400/20 text-amber-400" :
                    i === 1 ? "bg-slate-400/15 text-slate-400" :
                    "bg-surface text-text-muted border border-border"
                  )}>{i + 1}</span>
                  <p className="text-xs text-text-primary flex-1 truncate">{item.name}</p>
                  <div className="w-14 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(item.qty / maxQty) * 100}%` }} />
                  </div>
                  <span className="text-xs font-black text-primary tabular-nums font-mono w-5 text-left">{item.qty}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB 3 — TEAM
// ══════════════════════════════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TeamTab({ M, loading }: { M: any; loading: boolean }) {
  if (loading) return <Skeleton />;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topPerformer = M.staffActivity.reduce((best: any, s: any) => {
    const score = s.asCashier + s.asDriver;
    const bestScore = (best?.asCashier ?? 0) + (best?.asDriver ?? 0);
    return score > bestScore ? s : best;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, null as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeToday = M.staffActivity.filter((s: any) => s.asCashier + s.asDriver > 0).length;

  return (
    <div className="flex flex-col gap-4">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "إجمالي الفريق", value: M.staffActivity.length,              color: "text-primary"      },
          { label: "نشط الآن",      value: M.staffActivity.filter((s: any) => s.is_active).length, color: "text-emerald-400" },
          { label: "نشط اليوم",    value: activeToday,                          color: "text-amber-400"    },
        ].map(k => (
          <div key={k.label} className="bg-surface-elevated border border-border rounded-2xl p-3 text-center">
            <p className={cn("text-2xl font-black font-mono tabular-nums leading-none", k.color)}>{k.value}</p>
            <p className="text-[9px] text-text-muted mt-1.5 leading-tight">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Top performer */}
      {topPerformer && (topPerformer.asCashier + topPerformer.asDriver) > 0 && (
        <div className="bg-amber-400/6 border border-amber-400/20 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-black text-base shrink-0">
            {topPerformer.display_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-text-primary truncate">{topPerformer.display_name}</p>
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <p className="text-[10px] text-text-muted">{ROLE_LABEL[topPerformer.role] ?? topPerformer.role}</p>
            <p className="text-[10px] text-amber-400 font-bold mt-0.5">{topPerformer.asCashier + topPerformer.asDriver} طلب اليوم</p>
          </div>
          <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded-full shrink-0">الأفضل</span>
        </div>
      )}

      {/* Staff list */}
      <section>
        <SectionHeader icon={Users} title="تفاصيل الفريق" />
        <div className="flex flex-col gap-2">
          {M.staffActivity.length === 0 ? (
            <EmptyState icon={Users} title="لا يوجد موظفون" sub="أضف موظفين من قسم الموظفين" />
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            M.staffActivity.map((s: any) => {
              const lastSeen = s.last_login_at ? minutesAgo(s.last_login_at) : null;
              const totalAct = s.asCashier + s.asDriver;
              return (
                <div key={s.id} className="bg-surface-elevated border border-border rounded-2xl px-3 py-3 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-black text-primary">
                      {s.display_name?.charAt(0)}
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-elevated",
                      s.is_active ? "bg-emerald-400" : "bg-text-muted/30"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{s.display_name}</p>
                    <p className="text-[9px] text-text-muted">{ROLE_LABEL[s.role] ?? s.role}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1">
                      {s.asCashier > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          <CreditCard className="w-2.5 h-2.5" />{s.asCashier}
                        </span>
                      )}
                      {s.asDriver > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded-full">
                          <Truck className="w-2.5 h-2.5" />{s.asDriver}
                        </span>
                      )}
                      {totalAct === 0 && <span className="text-[9px] text-text-muted/50">—</span>}
                    </div>
                    {lastSeen !== null && (
                      <p className="text-[9px] text-text-muted">{lastSeen < 60 ? `${lastSeen}د` : `${Math.floor(lastSeen / 60)}س`} مضت</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB 4 — INSIGHTS
// ══════════════════════════════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InsightsTab({ M, loading }: { M: any; loading: boolean }) {
  if (loading) return <Skeleton />;

  const now          = new Date();
  const currentHour  = now.getHours();
  const elapsed      = Math.max(currentHour, 1);
  const rate         = M.total / elapsed;
  const remaining    = 23 - currentHour;
  const forecast     = Math.round(rate * remaining);
  const avgOrderVal  = M.deliveredCount > 0 ? M.revenue / M.deliveredCount : 0;
  const forecastRev  = Math.round(forecast * avgOrderVal * (M.compRate / 100));
  const cancelRate   = M.total > 0 ? Math.round(M.cancelledCount / M.total * 100) : 0;

  const insights = [
    M.late.length >= 3 && {
      type: "critical" as const, icon: AlertTriangle,
      title: "اختناق تشغيلي",
      body: `${M.late.length} طلبات تجاوزت الوقت المسموح. راجع طاقة المطبخ أو توزيع العمل.`,
    },
    M.issueCount > 0 && {
      type: "warning" as const, icon: AlertCircle,
      title: `${M.issueCount} مشكلة مُبلَّغة`,
      body: "طلبات تحتوي تقارير مشاكل تحتاج مراجعتك الفورية.",
    },
    cancelRate > 15 && {
      type: "warning" as const, icon: XCircle,
      title: "معدل إلغاء مرتفع",
      body: `معدل الإلغاء اليوم ${cancelRate}%. تحقق من أسباب الإلغاء وجودة الخدمة.`,
    },
    M.avgPrepTime > 20 && {
      type: "warning" as const, icon: Timer,
      title: "وقت استلام طويل",
      body: `متوسط ${M.avgPrepTime} دقيقة حتى بدء التحضير. يُنصح بمراجعة تدفق الاستقبال.`,
    },
    M.peakHour > 0 && {
      type: "info" as const, icon: Flame,
      title: `ذروة حركة متوقعة ${M.peakHour}:00`,
      body: `استناداً لبيانات الأسبوع، هذا الوقت يشهد أعلى حركة. تأكد من جاهزية الفريق.`,
    },
    forecast > 0 && {
      type: "info" as const, icon: TrendingUp,
      title: "توقع بقية اليوم",
      body: `بمعدل ${rate.toFixed(1)} طلب/ساعة، متوقع ${forecast} طلب إضافي وإيراد تقديري ${fmt(forecastRev)} د.ع.`,
    },
    M.compRate >= 90 && {
      type: "success" as const, icon: CheckCircle2,
      title: "أداء ممتاز اليوم",
      body: `معدل إتمام ${M.compRate}%. استمر بنفس الزخم ومستوى الخدمة.`,
    },
  ].filter(Boolean) as { type: "critical"|"warning"|"info"|"success"; icon: React.ElementType; title: string; body: string }[];

  const typeStyle = {
    critical: "bg-red-400/6 border-red-400/20 [&_svg]:text-red-400 text-red-400",
    warning:  "bg-amber-400/6 border-amber-400/20 [&_svg]:text-amber-400 text-amber-400",
    info:     "bg-primary/6 border-primary/20 [&_svg]:text-primary text-primary",
    success:  "bg-emerald-400/6 border-emerald-400/20 [&_svg]:text-emerald-400 text-emerald-400",
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Forecast */}
      <div className="bg-surface-elevated border border-border rounded-2xl p-4">
        <SectionHeader icon={Brain} title="توقعات بقية اليوم" />
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div>
            <p className="text-2xl font-black text-primary tabular-nums font-mono leading-none">+{forecast}</p>
            <p className="text-[10px] text-text-muted mt-1">طلب متوقع إضافي</p>
          </div>
          <div>
            <p className="text-2xl font-black text-primary tabular-nums font-mono leading-none">{fmt(forecastRev)}</p>
            <p className="text-[10px] text-text-muted mt-1">إيراد تقديري (د.ع)</p>
          </div>
        </div>
        <p className="text-[9px] text-text-muted mt-3 pt-2 border-t border-border">
          بمعدل {rate.toFixed(1)} طلب/ساعة · {remaining} ساعة متبقية · نسبة إتمام {M.compRate}%
        </p>
      </div>

      {/* Insights */}
      {insights.length > 0 ? (
        <section>
          <SectionHeader icon={Zap} title={`رؤى ذكية (${insights.length})`} />
          <div className="flex flex-col gap-2.5">
            {insights.map((ins, i) => (
              <div key={i} className={cn("border rounded-2xl p-3.5 flex gap-3", typeStyle[ins.type])}>
                <ins.icon className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold mb-0.5">{ins.title}</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{ins.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState icon={Target} title="لا توجد رؤى حرجة" sub="كل المؤشرات ضمن النطاق الطبيعي" />
      )}

      {/* Week trend */}
      {M.weekDaily.some((v: number) => v > 0) && (
        <section>
          <SectionHeader icon={BarChart3} title="مقارنة آخر 7 أيام" />
          <div className="bg-surface-elevated border border-border rounded-2xl p-3">
            <WeekBars data={M.weekDaily} />
          </div>
        </section>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="w-3 h-3 text-text-muted" />
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{title}</p>
    </div>
  );
}

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={cn(
      "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
      up ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
    )}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function RingChart({ value, size = 60 }: { value: number; size?: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const color = value >= 85 ? "hsl(142 71% 45%)" : value >= 65 ? "hsl(38 92% 50%)" : "hsl(4 84% 60%)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 56 56" width={size} height={size} className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--color-border))" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(value / 100) * c} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-text-primary tabular-nums">{value}%</span>
      </div>
    </div>
  );
}

function HourlyBars({ data }: { data: number[] }) {
  const max  = Math.max(...data, 1);
  const hour = new Date().getHours();
  return (
    <div className="flex items-end gap-px h-14">
      {data.map((v, h) => (
        <div key={h} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
          <div className={cn("w-full rounded-sm", h === hour ? "bg-primary" : v > 0 ? "bg-primary/45" : "bg-surface")}
            style={{ height: `${Math.max((v / max) * 40, v > 0 ? 2 : 1)}px` }} />
          {h % 6 === 0 && <p className="text-[6px] text-text-muted">{h}</p>}
        </div>
      ))}
    </div>
  );
}

function WeekBars({ data }: { data: number[] }) {
  const DAYS = ["أحد","اثن","ثلا","أرب","خمي","جمع","سبت"];
  const max  = Math.max(...data, 1);
  const labels = Array(7).fill(0).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return DAYS[d.getDay()];
  });
  return (
    <div className="flex items-end gap-2 h-20">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          {v > 0 && <p className="text-[8px] text-text-muted tabular-nums">{v}</p>}
          <div className="w-full rounded-sm" style={{
            height: `${Math.max((v / max) * 52, v > 0 ? 3 : 1)}px`,
            background: "hsl(var(--color-primary) / 0.55)",
          }} />
          <p className="text-[8px] text-text-muted">{labels[i]}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Icon className="w-10 h-10 text-text-muted/20" />
      <p className="text-sm font-bold text-text-secondary">{title}</p>
      <p className="text-xs text-text-muted">{sub}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className={cn("bg-surface-elevated rounded-2xl animate-pulse", i === 0 ? "h-24" : "h-16")} />
      ))}
    </div>
  );
}
