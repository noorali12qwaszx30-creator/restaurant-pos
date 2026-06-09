import { useState, useMemo } from "react";
import { TrendingUp, Clock, Star, Package, Wallet } from "lucide-react";
import { useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month";

// Simulate daily data for the week chart
const WEEK_DATA = [
  { day: "الأحد",    count: 4, fees: 58 },
  { day: "الاثنين",  count: 6, fees: 84 },
  { day: "الثلاثاء", count: 3, fees: 45 },
  { day: "الأربعاء", count: 7, fees: 98 },
  { day: "الخميس",   count: 5, fees: 70 },
  { day: "الجمعة",   count: 9, fees: 126 },
  { day: "السبت",    count: 6, fees: 84 },  // today
];

const maxCount = Math.max(...WEEK_DATA.map(d => d.count));

function BarChart({ data }: { data: typeof WEEK_DATA }) {
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const pct = maxCount ? (d.count / maxCount) * 100 : 0;
        const isToday = i === data.length - 1;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-text-muted font-bold">{d.count}</span>
            <div
              className={cn("w-full rounded-t-md transition-all", isToday ? "bg-primary" : "bg-primary/30")}
              style={{ height: `${Math.max(pct * 0.7, 4)}px` }}
            />
            <span className={cn("text-[9px] leading-none truncate w-full text-center", isToday ? "text-primary font-bold" : "text-text-muted")}>
              {d.day.slice(0, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-3.5">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-text-muted">{label}</p>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color + "/10")}>
          <Icon className={cn("w-3.5 h-3.5", color)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function StatsPage() {
  const { orders } = useOrders();
  const { profile } = useAuth();
  const driverId = profile?.uid ?? "mock-delivery-001";

  const myOrders = useMemo(
    () => orders.filter(o => o.driverId === driverId || o.driverId === "mock-delivery-001"),
    [orders, driverId]
  );
  const delivered = myOrders.filter(o => o.status === "delivered");

  const [period, setPeriod] = useState<Period>("today");

  const todayCount   = delivered.length;
  const weekCount    = delivered.length + 27;
  const monthCount   = delivered.length + 85;
  const count = period === "today" ? todayCount : period === "week" ? weekCount : monthCount;

  const totalFees = delivered.reduce((s, o) => s + o.deliveryFee, 0);
  const weekFees  = WEEK_DATA.reduce((s, d) => s + d.fees, 0);
  const fees = period === "today" ? totalFees : period === "week" ? weekFees : weekFees * 4.3;

  const completionRate = myOrders.length ? Math.round((delivered.length / myOrders.length) * 100) : 0;
  const avgDeliveryMin = 24;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

      {/* Period tabs */}
      <div className="flex gap-1.5 bg-surface-elevated rounded-xl p-1">
        {([
          { id: "today", label: "اليوم" },
          { id: "week",  label: "الأسبوع" },
          { id: "month", label: "الشهر" },
        ] as { id: Period; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setPeriod(t.id)}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              period === t.id ? "bg-surface text-text-primary shadow-card" : "text-text-muted hover:text-text-secondary"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="طلبات مكتملة" value={count}
          sub={period === "today" ? "اليوم" : period === "week" ? "هذا الأسبوع" : "هذا الشهر"}
          icon={Package} color="text-primary" />
        <KpiCard label="رسوم التوصيل" value={`${fees.toFixed(0)} د.ع`}
          sub="مستحقة لك"
          icon={Wallet} color="text-status-success" />
        <KpiCard label="متوسط وقت التوصيل" value={`${avgDeliveryMin} د`}
          sub="لكل طلب"
          icon={Clock} color="text-status-info" />
        <KpiCard label="نسبة الإنجاز" value={`${completionRate}%`}
          sub="من الطلبات المسندة"
          icon={TrendingUp} color="text-status-warning" />
      </div>

      {/* Weekly chart */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">الطلبات اليومية هذا الأسبوع</h3>
        <BarChart data={WEEK_DATA} />
      </div>

      {/* Performance score */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
          <Star className="w-6 h-6 text-primary mb-0.5" />
          <span className="text-lg font-bold text-primary leading-none">4.8</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">تقييم الأداء</p>
          <p className="text-xs text-text-muted mt-0.5">بناءً على سرعة التوصيل والالتزام</p>
          <div className="flex gap-1 mt-1.5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={cn("h-1.5 w-6 rounded-full", i <= 4 ? "bg-primary" : "bg-primary/30")} />
            ))}
          </div>
        </div>
      </div>

      {/* Late orders rate */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">توزيع أوقات التوصيل</h3>
        {[
          { label: "أقل من 20 دقيقة",  pct: 45, color: "bg-status-success" },
          { label: "20–30 دقيقة",       pct: 35, color: "bg-primary" },
          { label: "30–40 دقيقة",       pct: 15, color: "bg-status-warning" },
          { label: "أكثر من 40 دقيقة", pct: 5,  color: "bg-status-error" },
        ].map(r => (
          <div key={r.label} className="flex items-center gap-3 mb-2 last:mb-0">
            <p className="text-xs text-text-muted w-32 shrink-0">{r.label}</p>
            <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", r.color)} style={{ width: `${r.pct}%` }} />
            </div>
            <p className="text-xs font-bold text-text-secondary w-8 text-left">{r.pct}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
