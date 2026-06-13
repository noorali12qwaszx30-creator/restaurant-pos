import { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Users, MapPin, Truck,
  UtensilsCrossed, ShoppingBag, DollarSign, Star, Clock,
  Package, Repeat, CreditCard, ChevronDown, ChevronUp
} from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { useMenuData, type MenuItemData, type MenuCategory } from "@/hooks/useMenuData";
import { netRevenue, deliveryFeesTotal } from "@/lib/revenue";
import { cn } from "@/lib/utils";

/* ─── helpers ────────────────────────────────────────────────── */
function pct(a: number, b: number) { return b === 0 ? 0 : Math.round(a / b * 100); }
function currency(n: number)       { return n.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " د.ع"; }
function avgLabel(ms: number)      { const m = Math.round(ms / 60000); return m < 60 ? `${m} د` : `${Math.floor(m/60)}س ${m%60}د`; }

/* ─── mini components ────────────────────────────────────────── */
function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-elevated"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-text-primary">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function Bar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const w = max === 0 ? 0 : Math.max(2, Math.round(value / max * 100));
  return (
    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${w}%` }} />
    </div>
  );
}

function KpiMini({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up"|"down" }) {
  return (
    <div className="bg-surface-elevated border border-border rounded-xl p-3 flex flex-col gap-0.5">
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className="text-lg font-bold text-text-primary leading-tight">{value}</p>
      {sub && (
        <p className={cn("text-[10px] flex items-center gap-0.5", trend === "up" ? "text-status-success" : trend === "down" ? "text-status-error" : "text-text-muted")}>
          {trend === "up" && <TrendingUp className="w-2.5 h-2.5" />}
          {trend === "down" && <TrendingDown className="w-2.5 h-2.5" />}
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── Data computation ───────────────────────────────────────── */
function useStats(period: "day" | "week" | "month", allOrders: LiveOrder[], menuItems: MenuItemData[], menuCats: MenuCategory[]) {
  return useMemo(() => {
    const now = Date.now();
    const cutoff = now - (period === "day" ? 86400000 : period === "week" ? 7*86400000 : 30*86400000);
    const orders = allOrders.filter(o => o.createdAt.getTime() >= cutoff);
    const delivered = orders.filter(o => o.status === "delivered");

    // إيراد المطعم = Σ(total − delivery_fee) للمسلّمة (مصدر موحّد)
    const revenue = netRevenue(orders);
    const deliveryFees = deliveryFeesTotal(orders);
    const cancelled = orders.filter(o => o.status === "cancelled");

    // By type
    const pickup   = orders.filter(o => o.type === "pickup");
    const takeaway = orders.filter(o => o.type === "takeaway");
    const delivery = orders.filter(o => o.type === "delivery");

    // Product sales
    const itemMap: Record<string, { qty: number; revenue: number }> = {};
    delivered.forEach(o => o.items.forEach(i => {
      if (!itemMap[i.menuItemId]) itemMap[i.menuItemId] = { qty: 0, revenue: 0 };
      itemMap[i.menuItemId].qty += i.quantity;
      itemMap[i.menuItemId].revenue += i.unitPrice * i.quantity;
    }));
    const allItems = menuItems.map(mi => ({
      id: mi.id, name: mi.name, category: mi.category_id,
      qty: itemMap[mi.id]?.qty ?? 0,
      revenue: itemMap[mi.id]?.revenue ?? 0,
    }));
    const topByQty    = [...allItems].sort((a,b) => b.qty - a.qty).slice(0, 10);
    const topByRev    = [...allItems].sort((a,b) => b.revenue - a.revenue).slice(0, 10);
    const zeroSales   = allItems.filter(i => i.qty === 0);

    // By category
    const catMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    menuCats.forEach(c => { catMap[c.id] = { name: c.name, qty: 0, revenue: 0 }; });
    allItems.forEach(i => {
      if (catMap[i.category]) { catMap[i.category].qty += i.qty; catMap[i.category].revenue += i.revenue; }
    });
    const catStats = Object.values(catMap).sort((a,b) => b.revenue - a.revenue);

    // Daily chart (last 7 days regardless of period)
    const dayMap: Record<string, { count: number; revenue: number }> = {};
    for (let d = 6; d >= 0; d--) {
      const t = new Date(); t.setDate(t.getDate() - d);
      const key = t.toISOString().slice(0, 10);
      dayMap[key] = { count: 0, revenue: 0 };
    }
    orders.forEach(o => {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (dayMap[key]) {
        dayMap[key].count++;
        if (o.status === "delivered") {
          dayMap[key].revenue += o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        }
      }
    });
    const dailyData = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

    // Hourly distribution
    const hourMap = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    orders.forEach(o => { hourMap[o.createdAt.getHours()].count++; });
    const peakHour = hourMap.reduce((a, b) => b.count > a.count ? b : a, hourMap[0]);

    // Zone stats
    const zoneMap: Record<string, { count: number; revenue: number; avgDelivery: number; total: number }> = {};
    delivery.forEach(o => {
      const z = o.zone ?? "غير محدد";
      if (!zoneMap[z]) zoneMap[z] = { count: 0, revenue: 0, avgDelivery: 0, total: 0 };
      zoneMap[z].count++;
      if (o.status === "delivered") {
        zoneMap[z].revenue += o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      }
    });
    const zoneStats = Object.entries(zoneMap).map(([zone, v]) => ({ zone, ...v })).sort((a,b) => b.count - a.count);

    // Customer analytics
    const custMap: Record<string, { name: string; phone: string; count: number; revenue: number }> = {};
    delivered.forEach(o => {
      const k = o.customerPhone ?? o.customerName ?? "مجهول";
      if (!custMap[k]) custMap[k] = { name: o.customerName ?? "—", phone: o.customerPhone ?? "—", count: 0, revenue: 0 };
      custMap[k].count++;
      custMap[k].revenue += o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    });
    const topCustomers = Object.values(custMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const repeatCustomers = Object.values(custMap).filter(c => c.count > 1).length;
    const totalCustomers  = Object.values(custMap).length;

    // Avg prep time (rough estimate from createdAt to updatedAt for delivered orders)
    const prepTimes = delivered.map(o => o.updatedAt.getTime() - o.createdAt.getTime()).filter(t => t > 0 && t < 3600000);
    const avgPrep = prepTimes.length ? prepTimes.reduce((a,b) => a+b, 0) / prepTimes.length : 0;

    return {
      orders, delivered, cancelled, revenue, deliveryFees,
      pickup, takeaway, delivery,
      topByQty, topByRev, zeroSales, catStats,
      dailyData, hourMap, peakHour,
      zoneStats, topCustomers, repeatCustomers, totalCustomers,
      avgPrep,
    };
  }, [allOrders, period, menuItems, menuCats]);
}

/* ─── Main Page ──────────────────────────────────────────────── */
export function AdminStatsPage() {
  const { orders: allOrders } = useOrders();
  const { items: menuItems, categories: menuCats } = useMenuData();
  const [period, setPeriod] = useState<"day"|"week"|"month">("week");
  const s = useStats(period, allOrders, menuItems, menuCats);

  const maxDailyCount = Math.max(...s.dailyData.map(d => d.count), 1);
  const maxZoneCount  = Math.max(...s.zoneStats.map(z => z.count), 1);
  const maxCatRev     = Math.max(...s.catStats.map(c => c.revenue), 1);
  const maxItemQty    = Math.max(...s.topByQty.map(i => i.qty), 1);
  const maxItemRev    = Math.max(...s.topByRev.map(i => i.revenue), 1);
  const maxHour       = Math.max(...s.hourMap.map(h => h.count), 1);

  const DAYS_AR = ["أحد","إثن","ثلا","أرب","خمس","جمع","سبت"];

  return (
    <div className="flex flex-col gap-3 px-4 py-4 pb-8">

      {/* Period selector */}
      <div className="flex gap-2">
        {(["day","week","month"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn("flex-1 py-2 rounded-xl border text-xs font-semibold transition-all",
              period === p ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
            )}>
            {p === "day" ? "اليوم" : p === "week" ? "الأسبوع" : "الشهر"}
          </button>
        ))}
      </div>

      {/* ── 1. Product Analysis ─────────────────────────────── */}
      <Section title="تحليل المنتجات" icon={Package}>
        <p className="text-[10px] text-text-muted mb-3">بناءً على الطلبات المسلّمة فقط</p>

        <p className="text-xs font-bold text-text-secondary mb-2">الأكثر مبيعاً (بالكمية)</p>
        <div className="flex flex-col gap-1.5 mb-4">
          {s.topByQty.map((it, i) => (
            <div key={it.id} className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted w-4 text-center">{i+1}</span>
              <span className="text-xs text-text-primary flex-1 truncate">{it.name}</span>
              <span className="text-[10px] font-bold text-primary w-8 text-left">{it.qty}</span>
              <Bar value={it.qty} max={maxItemQty} color="bg-primary" />
            </div>
          ))}
          {s.topByQty.length === 0 && <p className="text-xs text-text-muted">لا بيانات</p>}
        </div>

        <p className="text-xs font-bold text-text-secondary mb-2">الأعلى إيراداً</p>
        <div className="flex flex-col gap-1.5 mb-4">
          {s.topByRev.map((it, i) => (
            <div key={it.id} className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted w-4 text-center">{i+1}</span>
              <span className="text-xs text-text-primary flex-1 truncate">{it.name}</span>
              <span className="text-[10px] font-bold text-status-success w-16 text-left">{currency(it.revenue)}</span>
              <Bar value={it.revenue} max={maxItemRev} color="bg-status-success" />
            </div>
          ))}
        </div>

        {s.zeroSales.length > 0 && (
          <>
            <p className="text-xs font-bold text-status-error mb-1.5">بدون مبيعات ({s.zeroSales.length})</p>
            <div className="flex flex-wrap gap-1">
              {s.zeroSales.map(it => (
                <span key={it.id} className="text-[10px] text-status-error bg-status-error/8 border border-status-error/15 rounded-lg px-1.5 py-0.5">{it.name}</span>
              ))}
            </div>
          </>
        )}

        <p className="text-xs font-bold text-text-secondary mt-4 mb-2">الإيراد حسب الفئة</p>
        <div className="flex flex-col gap-1.5">
          {s.catStats.map(c => (
            <div key={c.name} className="flex items-center gap-2">
              <span className="text-xs text-text-primary flex-1 truncate">{c.name}</span>
              <span className="text-[10px] text-text-muted w-8 text-left">{c.qty}</span>
              <span className="text-[10px] font-semibold text-status-success w-20 text-left">{currency(c.revenue)}</span>
              <Bar value={c.revenue} max={maxCatRev} color="bg-amber-400" />
            </div>
          ))}
        </div>
      </Section>

      {/* ── 2. Orders Charts ────────────────────────────────── */}
      <Section title="مخططات الطلبات" icon={BarChart3}>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <KpiMini label="إجمالي الطلبات" value={String(s.orders.length)} />
          <KpiMini label="مسلّمة" value={String(s.delivered.length)} sub={`${pct(s.delivered.length, s.orders.length)}%`} trend="up" />
          <KpiMini label="ملغاة" value={String(s.cancelled.length)} sub={`${pct(s.cancelled.length, s.orders.length)}%`} trend="down" />
          <KpiMini label="متوسط وقت التحضير" value={avgLabel(s.avgPrep)} />
        </div>

        {/* Daily chart */}
        <p className="text-xs font-bold text-text-secondary mb-2">الطلبات اليومية (آخر 7 أيام)</p>
        <div className="flex items-end gap-1 h-20 mb-1">
          {s.dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              <span className="text-[8px] text-text-muted">{d.count || ""}</span>
              <div className="w-full rounded-t-sm bg-primary/80 transition-all"
                   style={{ height: `${maxDailyCount === 0 ? 2 : Math.max(4, d.count / maxDailyCount * 64)}px` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mb-4">
          {s.dailyData.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[8px] text-text-muted">{DAYS_AR[new Date(d.date).getDay()]}</span>
            </div>
          ))}
        </div>

        {/* Hourly distribution */}
        <p className="text-xs font-bold text-text-secondary mb-2">التوزيع بالساعة</p>
        <p className="text-[10px] text-text-muted mb-2">أعلى ساعة: {s.peakHour.hour}:00 ({s.peakHour.count} طلب)</p>
        <div className="flex items-end gap-0.5 h-12">
          {s.hourMap.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              <div className={cn("w-full rounded-t-sm transition-all",
                h.count === s.peakHour.count ? "bg-primary" : "bg-primary/30"
              )} style={{ height: `${maxHour === 0 ? 1 : Math.max(1, h.count / maxHour * 40)}px` }} />
            </div>
          ))}
        </div>

        {/* Type breakdown */}
        <p className="text-xs font-bold text-text-secondary mt-4 mb-2">توزيع نوع الطلب</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "استلام",  count: s.pickup.length,   Icon: UtensilsCrossed, color: "bg-primary/10 border-primary/25 text-primary" },
            { label: "سفري",   count: s.takeaway.length, Icon: ShoppingBag,     color: "bg-status-info/10 border-status-info/25 text-status-info" },
            { label: "توصيل",  count: s.delivery.length, Icon: Truck,           color: "bg-status-success/10 border-status-success/25 text-status-success" },
          ].map(t => (
            <div key={t.label} className={cn("border rounded-xl p-2.5 text-center", t.color)}>
              <t.Icon className="w-4 h-4 mx-auto mb-1" />
              <p className="text-base font-bold leading-none">{t.count}</p>
              <p className="text-[10px] mt-0.5">{t.label}</p>
              <p className="text-[9px] opacity-70">{pct(t.count, s.orders.length)}%</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 3. Finance ──────────────────────────────────────── */}
      <Section title="التحليل المالي" icon={DollarSign}>
        <p className="text-[10px] text-text-muted mb-3">الإيرادات من الطلبات المسلّمة فقط · رسوم التوصيل لا تدخل في إيرادات المطعم</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
            <p className="text-[10px] text-text-muted">صافي إيرادات المطعم</p>
            <p className="text-2xl font-bold text-primary">{currency(s.revenue)}</p>
            <p className="text-[10px] text-text-muted">{s.delivered.length} طلب مسلّم</p>
          </div>
          <div className="bg-surface-elevated border border-border rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-text-muted">رسوم التوصيل</p>
            <p className="text-sm font-bold text-status-info">{currency(s.deliveryFees)}</p>
            <p className="text-[9px] text-text-muted">للسائقين</p>
          </div>
          <div className="bg-surface-elevated border border-border rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-text-muted">متوسط قيمة الطلب</p>
            <p className="text-sm font-bold text-text-primary">{s.delivered.length ? currency(s.revenue / s.delivered.length) : "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-status-error/5 border border-status-error/15 rounded-xl px-3 py-2">
          <CreditCard className="w-4 h-4 text-status-error shrink-0" />
          <div>
            <p className="text-[10px] text-text-muted">خسارة من الإلغاء</p>
            <p className="text-sm font-semibold text-status-error">
              {currency(s.cancelled.reduce((t, o) => t + o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), 0))}
            </p>
          </div>
        </div>
      </Section>

      {/* ── 4. Customer Analytics ───────────────────────────── */}
      <Section title="تحليل العملاء" icon={Users}>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <KpiMini label="إجمالي العملاء" value={String(s.totalCustomers)} />
          <KpiMini label="عملاء متكررون" value={String(s.repeatCustomers)} sub={`${pct(s.repeatCustomers, s.totalCustomers)}%`} trend="up" />
          <KpiMini label="مرة في المتوسط" value={s.totalCustomers ? (s.delivered.length / s.totalCustomers).toFixed(1) : "—"} />
        </div>
        <p className="text-xs font-bold text-text-secondary mb-2">أعلى 10 عملاء (بالإيراد)</p>
        <div className="flex flex-col gap-1.5">
          {s.topCustomers.map((c, i) => (
            <div key={c.phone} className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted w-4 text-center">{i+1}</span>
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                {c.name[0] ?? "؟"}
              </div>
              <span className="text-xs text-text-primary flex-1 truncate">{c.name}</span>
              <span className="text-[10px] text-text-muted">{c.count} طلب</span>
              <span className="text-[10px] font-semibold text-status-success">{currency(c.revenue)}</span>
            </div>
          ))}
          {s.topCustomers.length === 0 && <p className="text-xs text-text-muted">لا بيانات</p>}
        </div>
      </Section>

      {/* ── 5. Delivery Area Analytics ──────────────────────── */}
      <Section title="تحليل مناطق التوصيل" icon={MapPin}>
        <div className="flex flex-col gap-1.5">
          {s.zoneStats.map(z => (
            <div key={z.zone} className="bg-surface-elevated border border-border rounded-xl px-3 py-2 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-status-info shrink-0" />
              <span className="text-xs font-medium text-text-primary flex-1 truncate">{z.zone}</span>
              <span className="text-[10px] text-text-muted">{z.count} طلب</span>
              <Bar value={z.count} max={maxZoneCount} color="bg-status-info/60" />
              <span className="text-[10px] font-semibold text-status-success w-20 text-left">{currency(z.revenue)}</span>
            </div>
          ))}
          {s.zoneStats.length === 0 && <p className="text-xs text-text-muted">لا توجد طلبات توصيل في هذه الفترة</p>}
        </div>
      </Section>

      {/* ── 6. Behavior Analysis ────────────────────────────── */}
      <Section title="تحليل سلوك الطلب" icon={Star}>
        <div className="grid grid-cols-2 gap-2">
          <KpiMini label="أكثر طريقة طلب" value={
            s.pickup.length >= s.takeaway.length && s.pickup.length >= s.delivery.length ? "استلام" :
            s.takeaway.length >= s.delivery.length ? "سفري" : "توصيل"
          } />
          <KpiMini label="معدل الإلغاء" value={`${pct(s.cancelled.length, s.orders.length)}%`}
            sub={s.cancelled.length > 5 ? "مرتفع" : "طبيعي"}
            trend={s.cancelled.length > 5 ? "down" : "up"} />
          <KpiMini label="معدل التكرار" value={`${pct(s.repeatCustomers, s.totalCustomers)}%`} trend="up" />
          <KpiMini label="ذروة الطلبات" value={`${s.peakHour.hour}:00`} sub={`${s.peakHour.count} طلب`} />
        </div>
      </Section>

      {/* ── 7. Predictive Analysis ──────────────────────────── */}
      <Section title="التحليل التنبؤي" icon={TrendingUp} defaultOpen={false}>
        <p className="text-[10px] text-text-muted mb-3">تحليل تنبؤي مبني على أنماط الطلبات التاريخية</p>
        <div className="flex flex-col gap-2">
          {[
            {
              icon: Clock, color: "text-primary", bg: "bg-primary/8 border-primary/15",
              title: "وقت الذروة المتوقع",
              body: `الذروة القادمة متوقعة حول الساعة ${s.peakHour.hour}:00 بناءً على الأنماط الأسبوعية.`
            },
            {
              icon: Package, color: "text-amber-500", bg: "bg-amber-500/8 border-amber-500/15",
              title: "المنتج الأكثر طلباً قريباً",
              body: s.topByQty[0]
                ? `يُتوقع أن يستمر "${s.topByQty[0].name}" في الصدارة بناءً على السجل الحالي.`
                : "لا بيانات كافية للتنبؤ."
            },
            {
              icon: Repeat, color: "text-status-success", bg: "bg-status-success/8 border-status-success/15",
              title: "العملاء المتكررون",
              body: s.repeatCustomers > 0
                ? `${s.repeatCustomers} عميلاً من أصل ${s.totalCustomers} يطلب أكثر من مرة — فرصة لبرنامج الولاء.`
                : "لا يوجد بيانات عملاء متكررين حتى الآن."
            },
            {
              icon: Truck, color: "text-status-info", bg: "bg-status-info/8 border-status-info/15",
              title: "الطلب على التوصيل",
              body: s.delivery.length > 0
                ? `${pct(s.delivery.length, s.orders.length)}% من الطلبات توصيل — يُنصح بمراجعة طاقة السائقين في ساعات الذروة.`
                : "لا طلبات توصيل في هذه الفترة."
            },
          ].map((item, i) => (
            <div key={i} className={cn("border rounded-xl p-3", item.bg)}>
              <div className="flex items-center gap-2 mb-1">
                <item.icon className={cn("w-4 h-4 shrink-0", item.color)} />
                <p className="text-xs font-bold text-text-primary">{item.title}</p>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}
