import { Banknote, ClipboardList, BarChart2, Bike, UtensilsCrossed, ShoppingBag } from "lucide-react";
import { TODAY_STATS, HOURLY_DATA, TOP_ITEMS, WEEKLY_REVENUE } from "@/data/mock-stats";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Progress } from "@/components/ui/progress";

export function ReportsTab() {
  const maxRevenue = Math.max(...HOURLY_DATA.map((h) => h.revenue));
  const maxWeekly = Math.max(...WEEKLY_REVENUE.map((d) => d.revenue));

  return (
    <div className="flex flex-col gap-5">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="إجمالي الإيرادات" value={TODAY_STATS.totalRevenue.value} suffix=" د.ع" change={TODAY_STATS.totalRevenue.change} icon={<Banknote className="w-4 h-4" />} />
        <StatsCard label="إجمالي الطلبات" value={TODAY_STATS.totalOrders.value} change={TODAY_STATS.totalOrders.change} icon={<ClipboardList className="w-4 h-4" />} />
        <StatsCard label="متوسط الطلب" value={TODAY_STATS.avgOrderValue.value} suffix=" د.ع" change={TODAY_STATS.avgOrderValue.change} icon={<BarChart2 className="w-4 h-4" />} />
        <StatsCard label="طلبات التوصيل" value={TODAY_STATS.delivery.value} change={TODAY_STATS.delivery.change} icon={<Bike className="w-4 h-4" />} />
      </div>

      {/* Order type breakdown */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">توزيع الطلبات حسب النوع</p>
        <div className="flex flex-col gap-3">
          {[
            { label: "تناول داخلي", value: TODAY_STATS.dineIn.value,   total: TODAY_STATS.totalOrders.value, Icon: UtensilsCrossed },
            { label: "تيك أواي",    value: TODAY_STATS.takeaway.value, total: TODAY_STATS.totalOrders.value, Icon: ShoppingBag     },
            { label: "توصيل",       value: TODAY_STATS.delivery.value, total: TODAY_STATS.totalOrders.value, Icon: Bike            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-text-secondary"><item.Icon className="w-3.5 h-3.5" />{item.label}</span>
                <span className="font-medium text-text-primary">{item.value} ({Math.round(item.value / item.total * 100)}%)</span>
              </div>
              <Progress value={(item.value / item.total) * 100} />
            </div>
          ))}
        </div>
      </div>

      {/* Hourly bar chart (visual) */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">الإيرادات بالساعة</p>
        <div className="flex items-end gap-1 h-28">
          {HOURLY_DATA.map((h) => (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm bg-primary/20 flex items-end justify-center" style={{ height: `${(h.revenue / maxRevenue) * 100}%` }}>
                <div className="w-full rounded-t-sm bg-primary" style={{ height: `${(h.revenue / maxRevenue) * 70}%` }} />
              </div>
              <span className="text-[9px] text-text-muted">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">إيرادات الأسبوع</p>
        <div className="flex items-end gap-2 h-28">
          {WEEKLY_REVENUE.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-primary" style={{ height: `${(d.revenue / maxWeekly) * 100}%` }} />
              <span className="text-[9px] text-text-muted text-center leading-tight">{d.day.slice(0, 3)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-muted">
          <span>أدنى: {Math.min(...WEEKLY_REVENUE.map((d) => d.revenue)).toLocaleString("en-US")} د.ع</span>
          <span>أعلى: {maxWeekly.toLocaleString("en-US")} د.ع</span>
        </div>
      </div>

      {/* Top items */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">الأصناف الأكثر مبيعاً</p>
        <div className="flex flex-col gap-2">
          {TOP_ITEMS.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-lg font-bold text-text-muted w-5">{i + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-primary">{item.name}</span>
                  <span className="text-text-muted">{item.sold} وحدة</span>
                </div>
                <Progress value={(item.sold / TOP_ITEMS[0].sold) * 100} />
              </div>
              <span className="text-xs font-medium text-primary">{item.revenue} د.ع</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
