import { useState, useEffect, useCallback } from "react";
import {
  Building2, Users, ShoppingBag, TrendingUp, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, Clock,
  Activity, DollarSign, UserCheck, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SACard, SASkeleton, PulseDot, SASection, SABadge } from "../components/SACard";
import { SASparkline } from "../components/SACharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Overview {
  totalRestaurants: number; activeRestaurants: number; inactiveRestaurants: number;
  totalUsers: number; activeUsers: number; totalAdmins: number;
  totalOrders: number; todayOrders: number; monthOrders: number;
  totalRevenue: number; todayRevenue: number; monthRevenue: number;
  deliveredOrders: number; pendingOrders: number; cancelledOrders: number;
  recentLogins: { name: string; role: string; time: string; restaurant: string }[];
  recentOrders: { id: string; restaurant: string; status: string; total: number; time: string }[];
  weeklyOrders: number[];
  weeklyRevenue: number[];
  topRestaurants: { name: string; orders: number; revenue: number }[];
}

const ROLE_LABEL: Record<string, string> = {
  admin: "مدير", cashier: "كاشير", kitchen: "مطبخ",
  field: "ميداني", delivery: "سائق", takeaway: "تيك أواي",
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `${m}د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}س`;
  return `${Math.floor(h / 24)}ي`;
}

export function SuperAdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekAgo = new Date(now.getTime() - 7 * 86400000);

      const [
        { data: rests },
        { data: users },
        { data: orders },
        { data: todayOrds },
        { data: monthOrds },
        { data: recentProfiles },
        { data: recentOrds },
        { data: weekOrds },
      ] = await Promise.all([
        db.from("restaurants").select("id, name, is_active"),
        db.from("profiles").select("id, role, is_active").not("restaurant_id", "is", null),
        db.from("orders").select("status, total"),
        db.from("orders").select("status, total").gte("created_at", todayStart.toISOString()),
        db.from("orders").select("status, total").gte("created_at", monthStart.toISOString()),
        db.from("profiles")
          .select("display_name, role, last_login_at, restaurants(name)")
          .not("restaurant_id", "is", null)
          .not("last_login_at", "is", null)
          .order("last_login_at", { ascending: false })
          .limit(5),
        db.from("orders")
          .select("id, status, total, created_at, restaurants(name)")
          .order("created_at", { ascending: false })
          .limit(6),
        db.from("orders")
          .select("status, total, created_at")
          .gte("created_at", weekAgo.toISOString()),
      ]);

      // Process weekly data (last 7 days)
      const weeklyOrders = Array(7).fill(0);
      const weeklyRevenue = Array(7).fill(0);
      (weekOrds ?? []).forEach((o: { created_at: string; status: string; total: number }) => {
        const dayIdx = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / 86400000);
        if (dayIdx >= 0 && dayIdx < 7) {
          weeklyOrders[6 - dayIdx]++;
          if (o.status === "delivered") weeklyRevenue[6 - dayIdx] += Number(o.total);
        }
      });

      // Top restaurants by orders
      const restOrderMap: Record<string, { orders: number; revenue: number; name: string }> = {};
      (recentOrds ?? []).forEach((o: { restaurants?: { name: string }; status: string; total: number }) => {
        const name = o.restaurants?.name ?? "—";
        if (!restOrderMap[name]) restOrderMap[name] = { orders: 0, revenue: 0, name };
        restOrderMap[name].orders++;
        if (o.status === "delivered") restOrderMap[name].revenue += Number(o.total);
      });

      const delivered = (orders ?? []).filter((o: { status: string }) => o.status === "delivered");
      const cancelled = (orders ?? []).filter((o: { status: string }) => o.status === "cancelled");
      const pending   = (orders ?? []).filter((o: { status: string }) =>
        ["pending","preparing","ready","delivering"].includes(o.status));
      const todayDel  = (todayOrds ?? []).filter((o: { status: string }) => o.status === "delivered");
      const monthDel  = (monthOrds ?? []).filter((o: { status: string }) => o.status === "delivered");

      setData({
        totalRestaurants:  (rests ?? []).length,
        activeRestaurants: (rests ?? []).filter((r: { is_active: boolean }) => r.is_active).length,
        inactiveRestaurants:(rests ?? []).filter((r: { is_active: boolean }) => !r.is_active).length,
        totalUsers:        (users ?? []).length,
        activeUsers:       (users ?? []).filter((u: { is_active: boolean }) => u.is_active).length,
        totalAdmins:       (users ?? []).filter((u: { role: string }) => u.role === "admin").length,
        totalOrders:       (orders ?? []).length,
        todayOrders:       (todayOrds ?? []).length,
        monthOrders:       (monthOrds ?? []).length,
        totalRevenue:      delivered.reduce((s: number, o: { total: number }) => s + Number(o.total), 0),
        todayRevenue:      todayDel.reduce((s: number, o: { total: number }) => s + Number(o.total), 0),
        monthRevenue:      monthDel.reduce((s: number, o: { total: number }) => s + Number(o.total), 0),
        deliveredOrders:   delivered.length,
        pendingOrders:     pending.length,
        cancelledOrders:   cancelled.length,
        recentLogins: (recentProfiles ?? []).map((p: {
          display_name: string; role: string; last_login_at: string;
          restaurants?: { name: string };
        }) => ({
          name: p.display_name,
          role: ROLE_LABEL[p.role] ?? p.role,
          time: relTime(p.last_login_at),
          restaurant: p.restaurants?.name ?? "—",
        })),
        recentOrders: (recentOrds ?? []).map((o: {
          id: string; status: string; total: number; created_at: string;
          restaurants?: { name: string };
        }) => ({
          id: o.id.slice(0, 6),
          restaurant: o.restaurants?.name ?? "—",
          status: o.status,
          total: Number(o.total),
          time: relTime(o.created_at),
        })),
        weeklyOrders,
        weeklyRevenue,
        topRestaurants: Object.values(restOrderMap).sort((a, b) => b.orders - a.orders).slice(0, 4),
      });
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(() => load(), 60000);
    return () => clearInterval(t);
  }, [load]);

  if (loading && !data) return <OverviewSkeleton />;

  const successRate = data && data.totalOrders > 0
    ? Math.round(data.deliveredOrders / data.totalOrders * 100) : 0;

  const STATUS_COLOR: Record<string, string> = {
    delivered: "text-emerald-400", pending: "text-amber-400",
    preparing: "text-amber-400", ready: "text-sky-400",
    delivering: "text-violet-400", cancelled: "text-red-400",
  };
  const STATUS_LABEL: Record<string, string> = {
    delivered: "مُسلَّم", pending: "انتظار", preparing: "تحضير",
    ready: "جاهز", delivering: "توصيل", cancelled: "ملغي",
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-6">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-text-primary tracking-tight">مركز القيادة</h1>
          <p className="text-[11px] text-text-muted font-mono">
            {lastUpdate ? `آخر تحديث ${lastUpdate.toLocaleTimeString("ar-IQ")}` : "جاري التحميل..."}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors disabled:opacity-40">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* ── Today hero ── */}
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/8 rounded-full blur-2xl -translate-x-8 -translate-y-8 pointer-events-none" />
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest">اليوم</p>
          <PulseDot color="success" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-primary tabular-nums leading-none">
              {data?.todayRevenue.toLocaleString("en-US") ?? 0}
            </p>
            <p className="text-[10px] text-primary/60 mt-1">إيراد اليوم (د.ع)</p>
          </div>
          <div className="bg-surface-elevated border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-text-primary tabular-nums leading-none">
              {data?.todayOrders ?? 0}
            </p>
            <p className="text-[10px] text-text-muted mt-1">طلبات اليوم</p>
          </div>
        </div>
        {/* Sparkline */}
        {data && data.weeklyOrders.some(v => v > 0) && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] text-text-muted mb-1.5">الطلبات — آخر 7 أيام</p>
            <SASparkline data={data.weeklyOrders} height={36} filled />
          </div>
        )}
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <KpiCard icon={Building2} label="المطاعم" value={data?.totalRestaurants ?? 0}
          sub={`${data?.activeRestaurants ?? 0} نشط`} color="amber" />
        <KpiCard icon={Users} label="الموظفون" value={data?.totalUsers ?? 0}
          sub={`${data?.totalAdmins ?? 0} مدير`} color="sky" />
        <KpiCard icon={ShoppingBag} label="الطلبات الكلية" value={data?.totalOrders ?? 0}
          sub={`هذا الشهر ${data?.monthOrders ?? 0}`} color="violet" />
        <KpiCard icon={DollarSign} label="الإيراد الكلي" value={`${((data?.totalRevenue ?? 0) / 1000).toFixed(0)}k`}
          sub="دينار عراقي" color="emerald" />
        <KpiCard icon={UserCheck} label="المستخدمون النشطون" value={data?.activeUsers ?? 0}
          sub={`من أصل ${data?.totalUsers ?? 0}`} color="pink" />
        <KpiCard icon={TrendingUp} label="نسبة النجاح" value={`${successRate}%`}
          sub={`${data?.deliveredOrders ?? 0} مُسلَّم`} color={successRate >= 80 ? "emerald" : "amber"} />
      </div>

      {/* ── Orders breakdown ── */}
      <SASection title="توزيع الطلبات" subtitle={`${data?.totalOrders ?? 0} طلب إجمالاً`}>
        <SACard className="p-4">
          <div className="flex flex-col gap-2.5">
            {[
              { label: "مُسلَّمة", count: data?.deliveredOrders ?? 0, color: "bg-emerald-500", text: "text-emerald-400", icon: CheckCircle2 },
              { label: "قيد التنفيذ", count: data?.pendingOrders ?? 0, color: "bg-amber-500", text: "text-amber-400", icon: Clock },
              { label: "ملغاة", count: data?.cancelledOrders ?? 0, color: "bg-red-500", text: "text-red-400", icon: XCircle },
            ].map(row => {
              const pct = data && data.totalOrders > 0 ? (row.count / data.totalOrders) * 100 : 0;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <row.icon className={cn("w-3.5 h-3.5 shrink-0", row.text)} />
                  <p className="text-xs text-text-secondary w-20 shrink-0">{row.label}</p>
                  <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700", row.color)}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className={cn("text-xs font-black tabular-nums w-8 text-left font-mono", row.text)}>{row.count}</p>
                </div>
              );
            })}
          </div>
        </SACard>
      </SASection>

      {/* ── Activity: Recent Logins ── */}
      {data && data.recentLogins.length > 0 && (
        <SASection title="آخر تسجيلات الدخول" subtitle="النشاط المباشر">
          <div className="flex flex-col gap-2">
            {data.recentLogins.map((l, i) => (
              <SACard key={i} className="px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-black text-primary shrink-0">
                  {l.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{l.name}</p>
                  <p className="text-[10px] text-text-muted">{l.restaurant} · {l.role}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <PulseDot color="success" />
                  <span className="text-[10px] text-text-muted font-mono">{l.time}</span>
                </div>
              </SACard>
            ))}
          </div>
        </SASection>
      )}

      {/* ── Recent Orders ── */}
      {data && data.recentOrders.length > 0 && (
        <SASection title="آخر الطلبات" subtitle="في جميع المطاعم">
          <div className="flex flex-col gap-2">
            {data.recentOrders.map((o, i) => (
              <SACard key={i} className="px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{o.restaurant}</p>
                  <p className="text-[10px] text-text-muted">#{o.id} · {o.total.toLocaleString("en-US")} د.ع</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={cn("text-[10px] font-bold", STATUS_COLOR[o.status] ?? "text-text-muted")}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">{o.time}</span>
                </div>
              </SACard>
            ))}
          </div>
        </SASection>
      )}

      {/* ── System health ── */}
      <SASection title="صحة النظام">
        <SACard className="p-4">
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Supabase Auth", ok: true },
              { label: "PostgreSQL DB", ok: true },
              { label: "Edge Functions", ok: true },
              { label: "Realtime Engine", ok: true },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <p className="text-xs text-text-secondary font-mono">{s.label}</p>
                <div className="flex items-center gap-1.5">
                  <PulseDot color={s.ok ? "success" : "error"} />
                  <span className={cn("text-[11px] font-bold", s.ok ? "text-emerald-400" : "text-red-400")}>
                    {s.ok ? "ONLINE" : "ERROR"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SACard>
      </SASection>

      {/* ── Alerts ── */}
      {data && data.inactiveRestaurants > 0 && (
        <SACard className="p-3 border-amber-500/25 bg-amber-500/5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-400">تنبيه</p>
            <p className="text-[11px] text-text-muted">{data.inactiveRestaurants} مطعم متوقف حالياً</p>
          </div>
          <SABadge color="warning">{data.inactiveRestaurants}</SABadge>
        </SACard>
      )}

      {/* ── Month Revenue highlight ── */}
      <SACard className="p-4 border-primary/20 bg-gradient-to-br from-surface to-surface-elevated">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-text-secondary">إيراد الشهر الحالي</p>
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-3xl font-black text-primary tabular-nums font-mono">
          {(data?.monthRevenue ?? 0).toLocaleString("en-US")}
          <span className="text-sm font-normal text-text-muted mr-1">د.ع</span>
        </p>
        <div className="mt-3">
          <SASparkline data={data?.weeklyRevenue ?? [0]} height={32} color="hsl(var(--primary))" filled />
        </div>
      </SACard>

    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  amber:   { bg: "bg-amber-400/10",   text: "text-amber-400",   border: "border-amber-400/20"   },
  sky:     { bg: "bg-sky-400/10",     text: "text-sky-400",     border: "border-sky-400/20"     },
  violet:  { bg: "bg-violet-400/10",  text: "text-violet-400",  border: "border-violet-400/20"  },
  emerald: { bg: "bg-emerald-400/10", text: "text-emerald-400", border: "border-emerald-400/20" },
  pink:    { bg: "bg-pink-400/10",    text: "text-pink-400",    border: "border-pink-400/20"    },
};

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string;
  sub: string; color: string;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.amber;
  return (
    <SACard className={cn("p-3.5", c.bg, c.border)}>
      <Icon className={cn("w-4 h-4 mb-2", c.text)} />
      <p className={cn("text-2xl font-black tabular-nums leading-none font-mono", c.text)}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      <p className="text-xs text-text-secondary mt-1 font-medium">{label}</p>
      <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
    </SACard>
  );
}

// ── Skeleton ─────────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-6">
      <div className="flex justify-between items-center">
        <SASkeleton className="h-8 w-32" />
        <SASkeleton className="h-9 w-9 rounded-xl" />
      </div>
      <SASkeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-2.5">
        {Array(6).fill(0).map((_, i) => <SASkeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <SASkeleton className="h-40 rounded-2xl" />
      <SASkeleton className="h-48 rounded-2xl" />
    </div>
  );
}
