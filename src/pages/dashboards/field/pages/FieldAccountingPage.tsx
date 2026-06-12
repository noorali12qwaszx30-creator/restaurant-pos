/**
 * FieldAccountingPage — محاسبة الدليفري
 * مستحقات كل سائق + طلباته المنجزة اليوم
 */
import { useState, useMemo } from "react";
import { Bike, ChevronDown, ChevronUp, Package, Wallet, TrendingUp } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

function timeLabel(d: Date) {
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function isToday(d: Date) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

interface DriverSummary {
  driverId: string;
  driverName: string;
  orders: LiveOrder[];
  totalDeliveryFees: number;
  totalOrderValue: number;
}

function DriverCard({ driver }: { driver: DriverSummary }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
      {/* رأس البطاقة */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full p-4 flex items-center gap-3 text-right"
      >
        {/* أيقونة السائق */}
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bike className="w-5 h-5 text-primary" />
        </div>

        {/* بيانات السائق */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary">{driver.driverName}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {driver.orders.length} طلب مكتمل
          </p>
        </div>

        {/* المستحقات */}
        <div className="text-left shrink-0">
          <p className="text-base font-bold text-status-success">
            {driver.totalDeliveryFees.toFixed(0)}
            <span className="text-[10px] font-normal text-text-muted"> د.ع</span>
          </p>
          <p className="text-[10px] text-text-muted">رسوم توصيل</p>
        </div>

        {expanded
          ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
          : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
        }
      </button>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border border-t border-border">
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold text-text-primary">{driver.orders.length}</p>
          <p className="text-[10px] text-text-muted">طلبات</p>
        </div>
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold text-status-success">{driver.totalDeliveryFees.toFixed(0)}</p>
          <p className="text-[10px] text-text-muted">مستحقات</p>
        </div>
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold text-primary">{driver.totalOrderValue.toFixed(0)}</p>
          <p className="text-[10px] text-text-muted">قيمة الطلبات</p>
        </div>
      </div>

      {/* تفاصيل الطلبات */}
      {expanded && (
        <div className="border-t border-border">
          {driver.orders.map((o, i) => (
            <div
              key={o.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-xs",
                i !== driver.orders.length - 1 && "border-b border-border/50"
              )}
            >
              <Package className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-text-primary">#{o.orderNumber ?? o.id.slice(0,6)}</span>
                {o.zone && <span className="text-text-muted"> · {o.zone}</span>}
                {o.updatedAt && (
                  <span className="text-text-muted"> · {timeLabel(o.updatedAt)}</span>
                )}
              </div>
              <div className="text-left shrink-0">
                <span className="font-semibold text-status-success">
                  {(o.deliveryFee ?? 0).toFixed(0)}
                </span>
                <span className="text-text-muted"> / </span>
                <span className="font-medium text-text-primary">{o.total.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FieldAccountingPage() {
  const { orders } = useOrders();
  const [showAll, setShowAll] = useState(false);

  // الطلبات المسلمة اليوم
  const todayDelivered = useMemo(
    () => orders.filter(o =>
      o.status === "delivered" &&
      o.driverId &&
      o.updatedAt && isToday(o.updatedAt)
    ),
    [orders]
  );

  // تجميع حسب السائق
  const drivers = useMemo<DriverSummary[]>(() => {
    const map = new Map<string, DriverSummary>();
    const source = showAll
      ? orders.filter(o => o.status === "delivered" && o.driverId)
      : todayDelivered;

    for (const o of source) {
      const id = o.driverId!;
      if (!map.has(id)) {
        map.set(id, {
          driverId: id,
          driverName: o.driverName ?? "سائق غير معروف",
          orders: [],
          totalDeliveryFees: 0,
          totalOrderValue: 0,
        });
      }
      const d = map.get(id)!;
      d.orders.push(o);
      d.totalDeliveryFees += o.deliveryFee ?? 0;
      d.totalOrderValue   += o.total;
    }

    return [...map.values()].sort((a, b) => b.orders.length - a.orders.length);
  }, [orders, showAll, todayDelivered]);

  const totalFees  = drivers.reduce((s, d) => s + d.totalDeliveryFees, 0);
  const totalOrders = drivers.reduce((s, d) => s + d.orders.length, 0);

  return (
    <div className="flex flex-col gap-0 pb-6">

      {/* ── ملخص يومي ── */}
      <div className="px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text-primary">
            {showAll ? "إجمالي المستحقات" : "مستحقات اليوم"}
          </h2>
          <button
            onClick={() => setShowAll(p => !p)}
            className="text-[11px] text-primary font-medium border border-primary/30 rounded-full px-3 py-1"
          >
            {showAll ? "اليوم فقط" : "كل الوقت"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-status-success/6 border border-status-success/20 rounded-2xl p-3 text-center">
            <Wallet className="w-4 h-4 text-status-success mx-auto mb-1" />
            <p className="text-base font-bold text-status-success leading-none">{totalFees.toFixed(0)}</p>
            <p className="text-[10px] text-text-muted mt-1">إجمالي المستحقات</p>
          </div>
          <div className="bg-primary/6 border border-primary/20 rounded-2xl p-3 text-center">
            <Package className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-base font-bold text-primary leading-none">{totalOrders}</p>
            <p className="text-[10px] text-text-muted mt-1">طلب مسلّم</p>
          </div>
          <div className="bg-status-info/6 border border-status-info/20 rounded-2xl p-3 text-center">
            <TrendingUp className="w-4 h-4 text-status-info mx-auto mb-1" />
            <p className="text-base font-bold text-status-info leading-none">{drivers.length}</p>
            <p className="text-[10px] text-text-muted mt-1">سائق نشط</p>
          </div>
        </div>
      </div>

      {/* ── بطاقات السائقين ── */}
      <section className="px-4 pt-4 flex flex-col gap-3">
        {drivers.length === 0 ? (
          <EmptyState
            icon={<Bike className="w-8 h-8" />}
            title="لا توجد طلبات مسلّمة"
            description={showAll ? "لا توجد بيانات توصيل مسجّلة" : "لم يتم تسليم أي طلب اليوم بعد"}
          />
        ) : (
          drivers.map(d => <DriverCard key={d.driverId} driver={d} />)
        )}
      </section>

      {/* ملاحظة */}
      {drivers.length > 0 && (
        <p className="text-center text-[10px] text-text-muted px-4 pt-4">
          المستحقات = رسوم التوصيل لكل طلب — تُدفع للسائق بشكل منفصل عن إيرادات المطعم
        </p>
      )}
    </div>
  );
}
