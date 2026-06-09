import { useState, useEffect, useMemo } from "react";
import {
  Clock, CheckCircle2, Truck, XCircle, TrendingUp,
  Users, Zap, AlertTriangle, RefreshCw, Activity,
  UtensilsCrossed, Package, Timer
} from "lucide-react";
import { useOrders } from "@/contexts/OrderContext";
import { MOCK_STAFF }  from "@/data/mock-users";
import { TODAY_STATS, HOURLY_DATA } from "@/data/mock-stats";
import { cn } from "@/lib/utils";

/* ─── types ─────────────────────────────────────────────────── */
interface PulseKpi {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  pulse?: boolean;
}

/* ─── helpers ────────────────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString("ar-SA");
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

/* ─── KPI Card ───────────────────────────────────────────────── */
function KpiCard({ kpi }: { kpi: PulseKpi }) {
  return (
    <div className={cn("relative bg-surface border rounded-2xl p-3.5 flex flex-col gap-2 shadow-card", kpi.color)}>
      <div className="flex items-start justify-between">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", kpi.bg)}>
          <kpi.icon className="w-4.5 h-4.5" style={{ color: "currentColor" }} />
        </div>
        {kpi.pulse && (
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary leading-none">{kpi.value}</p>
        <p className="text-[11px] text-text-muted mt-0.5 leading-tight">{kpi.label}</p>
        {kpi.sub && <p className="text-[10px] text-text-muted/70 mt-0.5">{kpi.sub}</p>}
      </div>
    </div>
  );
}

/* ─── Status Pipeline ────────────────────────────────────────── */
function StatusPipeline({ orders }: { orders: { status: string }[] }) {
  const stages = [
    { key: "pending",    label: "انتظار", color: "bg-status-warning/20 text-status-warning",  dot: "bg-status-warning" },
    { key: "preparing",  label: "تحضير",  color: "bg-primary/15 text-primary",                dot: "bg-primary" },
    { key: "ready",      label: "جاهز",   color: "bg-status-success/20 text-status-success",  dot: "bg-status-success" },
    { key: "delivering", label: "توصيل",  color: "bg-status-info/20 text-status-info",        dot: "bg-status-info" },
    { key: "delivered",  label: "تسليم",  color: "bg-status-success/15 text-status-success",  dot: "bg-status-success" },
    { key: "cancelled",  label: "ملغي",   color: "bg-status-error/10 text-status-error",      dot: "bg-status-error" },
  ] as const;

  const counts = Object.fromEntries(
    stages.map(s => [s.key, orders.filter(o => o.status === s.key).length])
  );

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        خط سير الطلبات اللحظي
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {stages.map(s => (
          <div key={s.key} className={cn("rounded-xl p-2.5 text-center", s.color)}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
            </div>
            <p className="text-xl font-bold leading-none">{counts[s.key]}</p>
            <p className="text-[9px] mt-0.5 font-medium leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Revenue Bar ────────────────────────────────────────────── */
function RevenueBar() {
  const max = Math.max(...HOURLY_DATA.map(h => h.revenue));
  const currentHour = new Date().getHours();
  const activeIdx = HOURLY_DATA.findIndex((_, i) => {
    const h = 8 + Math.floor(i * (12 / HOURLY_DATA.length));
    return h >= currentHour;
  });

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-status-success" />
          الإيرادات بالساعة
        </h3>
        <span className="text-xs font-bold text-status-success">
          {fmt(TODAY_STATS.totalRevenue.value)} د.ع
        </span>
      </div>
      <div className="flex items-end gap-1 h-20">
        {HOURLY_DATA.map((h, i) => {
          const pct = (h.revenue / max) * 100;
          const isActive = i === activeIdx;
          return (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={cn("w-full rounded-t-sm transition-all", isActive ? "bg-primary" : "bg-primary/25")}
                style={{ height: `${Math.max(pct * 0.75, 4)}px` }}
              />
              <span className={cn("text-[8px] leading-none", isActive ? "text-primary font-bold" : "text-text-muted")}>
                {h.hour.replace(" ", "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Connected Users ────────────────────────────────────────── */
function ConnectedUsers() {
  const online = MOCK_STAFF.filter(u => u.isActive && u.lastLogin &&
    (Date.now() - u.lastLogin.getTime()) < 3600000
  );

  const roleColor: Record<string, string> = {
    admin:    "bg-status-warning/15 text-status-warning",
    cashier:  "bg-primary/15 text-primary",
    field:    "bg-status-info/15 text-status-info",
    delivery: "bg-status-success/15 text-status-success",
    kitchen:  "bg-status-error/15 text-status-error",
    takeaway: "bg-status-warning/10 text-status-warning",
  };
  const roleLabel: Record<string, string> = {
    admin:"مدير", cashier:"كاشير", field:"ميدان",
    delivery:"توصيل", kitchen:"مطبخ", takeaway:"تيك أواي",
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          المتصلون الآن
        </h3>
        <span className="text-xs font-bold text-status-success bg-status-success/10 border border-status-success/20 rounded-full px-2 py-0.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
          {online.length} متصل
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {online.slice(0, 6).map(u => (
          <div key={u.id} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {u.displayName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{u.displayName}</p>
              <p className="text-[10px] text-text-muted">{u.lastLogin ? fmtTime(u.lastLogin) : "—"}</p>
            </div>
            <span className={cn("text-[10px] font-medium rounded-full px-1.5 py-0.5", roleColor[u.roles[0]] ?? "bg-surface-elevated text-text-muted")}>
              {roleLabel[u.roles[0]] ?? u.roles[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Recent Issues ──────────────────────────────────────────── */
function RecentAlerts({ orders }: { orders: { id: string; status: string; hasIssue?: boolean; issueReason?: string; createdAt: Date }[] }) {
  const issues = orders.filter(o => o.hasIssue);
  const longWait = orders.filter(o =>
    ["pending","preparing"].includes(o.status) &&
    (Date.now() - o.createdAt.getTime()) > 25 * 60000
  );

  if (issues.length === 0 && longWait.length === 0) {
    return (
      <div className="bg-status-success/5 border border-status-success/20 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
        <div>
          <p className="text-sm font-semibold text-status-success">لا توجد تنبيهات</p>
          <p className="text-xs text-text-muted">جميع العمليات تسير بشكل طبيعي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-status-warning mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        تنبيهات تستوجب المتابعة
      </h3>
      <div className="flex flex-col gap-2">
        {longWait.map(o => (
          <div key={o.id} className="flex items-center gap-2.5 bg-status-warning/5 border border-status-warning/20 rounded-xl px-3 py-2">
            <Timer className="w-3.5 h-3.5 text-status-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary">{o.id}</p>
              <p className="text-[10px] text-text-muted truncate">انتظار {Math.floor((Date.now()-o.createdAt.getTime())/60000)} دقيقة</p>
            </div>
            <span className="text-[10px] font-bold text-status-warning">تأخير</span>
          </div>
        ))}
        {issues.map(o => (
          <div key={o.id} className="flex items-center gap-2.5 bg-status-error/5 border border-status-error/20 rounded-xl px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-status-error shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary">{o.id}</p>
              <p className="text-[10px] text-text-muted truncate">{o.issueReason ?? "مشكلة مُبلَّغ عنها"}</p>
            </div>
            <span className="text-[10px] font-bold text-status-error">مشكلة</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export function AdminHomePage() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const { orders } = useOrders();

  const kpis: PulseKpi[] = useMemo(() => {
    const active     = orders.filter(o => !["delivered","cancelled"].includes(o.status)).length;
    const preparing  = orders.filter(o => o.status === "preparing").length;
    const ready      = orders.filter(o => o.status === "ready").length;
    const delivering = orders.filter(o => o.status === "delivering").length;
    const delivered  = orders.filter(o => o.status === "delivered").length;
    const cancelled  = orders.filter(o => o.status === "cancelled").length;
    const revenue    = orders
      .filter(o => o.status === "delivered")
      .reduce((s, o) => s + o.total, TODAY_STATS.totalRevenue.value - 300);
    const connected  = MOCK_STAFF.filter(u => u.isActive && u.lastLogin &&
      (Date.now() - u.lastLogin.getTime()) < 3600000).length;

    return [
      { label: "الطلبات النشطة",    value: active,     icon: Zap,          color: "border-primary/20",             bg: "bg-primary/10 text-primary",            pulse: active > 0 },
      { label: "قيد التحضير",       value: preparing,  icon: UtensilsCrossed, color:"border-status-info/20",         bg: "bg-status-info/10 text-status-info"        },
      { label: "جاهزة للتسليم",     value: ready,      icon: Package,      color: "border-status-success/20",       bg: "bg-status-success/10 text-status-success"   },
      { label: "قيد التوصيل",       value: delivering, icon: Truck,        color: "border-status-warning/20",       bg: "bg-status-warning/10 text-status-warning"   },
      { label: "مكتملة اليوم",      value: delivered,  icon: CheckCircle2, color: "border-status-success/20",       bg: "bg-status-success/10 text-status-success"   },
      { label: "ملغية اليوم",       value: cancelled,  icon: XCircle,      color: "border-status-error/20",         bg: "bg-status-error/10 text-status-error"        },
      { label: "الإيرادات اليوم",   value: `${fmt(Math.round(revenue))} د.ع`, icon: TrendingUp, color:"border-status-success/30", bg:"bg-status-success/10 text-status-success" },
      { label: "متوسط التجهيز",     value: "18 د",     icon: Clock,        color: "border-border",                  bg: "bg-surface-elevated text-text-muted",  sub: "دقيقة لكل طلب"   },
      { label: "متوسط التوصيل",     value: "32 د",     icon: Timer,        color: "border-border",                  bg: "bg-surface-elevated text-text-muted",  sub: "دقيقة لكل رحلة"  },
      { label: "المتصلون حالياً",   value: connected,  icon: Users,        color: "border-status-info/20",          bg: "bg-status-info/10 text-status-info",    pulse: true            },
    ];
  }, [orders, tick]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

      {/* Header badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text-primary">لوحة المدير</h2>
          <p className="text-xs text-text-muted mt-0.5">التحديث كل 30 ثانية</p>
        </div>
        <div className="flex items-center gap-1.5 bg-status-success/10 border border-status-success/20 rounded-full px-3 py-1.5">
          <RefreshCw className="w-3 h-3 text-status-success animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-[10px] font-semibold text-status-success">مباشر</span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {kpis.map((k, i) => <KpiCard key={i} kpi={k} />)}
      </div>

      {/* Alerts */}
      <RecentAlerts orders={orders} />

      {/* Status pipeline */}
      <StatusPipeline orders={orders} />

      {/* Revenue chart */}
      <RevenueBar />

      {/* Connected users */}
      <ConnectedUsers />
    </div>
  );
}
