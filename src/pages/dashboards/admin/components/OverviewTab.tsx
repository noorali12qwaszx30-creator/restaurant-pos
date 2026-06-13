import { TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, Clock } from "lucide-react";
import { TODAY_STATS, HOURLY_DATA, TOP_ITEMS, WEEKLY_REVENUE } from "@/data/mock-stats";
import { useOrders } from "@/contexts/OrderContext";

function StatCard({ icon: Icon, label, value, sub, trend }: {
  icon: React.ElementType; label: string; value: string; sub?: string; trend?: number;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? "text-status-success" : "text-status-error"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
        {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-text-muted w-8 text-left">{label}</span>
      <div className="flex-1 bg-surface-elevated rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-text-secondary w-12 text-left">{value} د.ع</span>
    </div>
  );
}

export function OverviewTab() {
  const { orders } = useOrders();
  const maxHourly = Math.max(...HOURLY_DATA.map((h) => h.revenue));
  const maxWeekly = Math.max(...WEEKLY_REVENUE.map((w) => w.revenue));

  const pickup   = orders.filter((o) => o.type === "pickup").length;
  const takeaway = orders.filter((o) => o.type === "takeaway").length;
  const delivery = orders.filter((o) => o.type === "delivery").length;
  const total    = pickup + takeaway + delivery;

  return (
    <div className="flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} label="إيرادات اليوم" value={`${TODAY_STATS.totalRevenue.value.toLocaleString()} د.ع`} trend={TODAY_STATS.totalRevenue.change} />
        <StatCard icon={ShoppingBag} label="طلبات اليوم" value={String(TODAY_STATS.totalOrders.value)} trend={TODAY_STATS.totalOrders.change} />
        <StatCard icon={Users} label="عملاء جدد" value="14" trend={-3} />
        <StatCard icon={Clock} label="متوسط الوقت" value="18 د" sub="لكل طلب" />
      </div>

      {/* Order type breakdown */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">توزيع أنواع الطلبات</h3>
        <div className="flex gap-3 mb-3">
          {[
            { label: "استلام", value: pickup, color: "bg-primary" },
            { label: "تيك أواي", value: takeaway, color: "bg-status-info" },
            { label: "توصيل", value: delivery, color: "bg-status-warning" },
          ].map((t) => (
            <div key={t.label} className="flex-1 text-center">
              <p className="text-xl font-bold text-text-primary">{t.value}</p>
              <div className={`${t.color} h-1 rounded-full w-8 mx-auto my-1`} />
              <p className="text-xs text-text-muted">{t.label}</p>
            </div>
          ))}
        </div>
        {/* Stacked bar */}
        <div className="flex rounded-full overflow-hidden h-2 gap-0.5">
          <div className="bg-primary rounded-full" style={{ width: `${(pickup/total)*100}%` }} />
          <div className="bg-status-info rounded-full" style={{ width: `${(takeaway/total)*100}%` }} />
          <div className="bg-status-warning rounded-full" style={{ width: `${(delivery/total)*100}%` }} />
        </div>
      </div>

      {/* Hourly chart */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">الإيرادات بالساعة</h3>
        <div className="flex flex-col gap-1.5">
          {HOURLY_DATA.filter((_, i) => i % 2 === 0).map((h) => (
            <MiniBar key={h.hour} label={h.hour} value={h.revenue} max={maxHourly} />
          ))}
        </div>
      </div>

      {/* Weekly */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">الإيرادات الأسبوعية</h3>
        <div className="flex flex-col gap-1.5">
          {WEEKLY_REVENUE.map((w) => (
            <MiniBar key={w.day} label={w.day} value={w.revenue} max={maxWeekly} />
          ))}
        </div>
      </div>

      {/* Top items */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">الأصناف الأكثر طلباً</h3>
        <div className="flex flex-col gap-2">
          {TOP_ITEMS.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i+1}</span>
              <span className="flex-1 text-sm text-text-primary">{item.name}</span>
              <span className="text-xs text-text-muted">{item.sold} طلب</span>
              <span className="text-xs font-medium text-text-secondary">{item.revenue} د.ع</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
