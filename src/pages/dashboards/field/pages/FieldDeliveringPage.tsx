/**
 * FieldDeliveringPage — الطلبات قيد التوصيل
 * جميع الطلبات بحالة "delivering" مع قدرة تسليم مباشرة
 */
import { useState, useMemo } from "react";
import { Bike, MapPin, Phone, Clock, CheckCircle2, Package } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

function elapsed(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `${m} د`;
  return `${Math.floor(m / 60)} س ${m % 60} د`;
}
function timeLabel(d: Date) {
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function DeliveryCard({ order, onView, onDeliver }: {
  order: LiveOrder;
  onView: () => void;
  onDeliver: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const startTime = order.deliveringAt ?? order.updatedAt;
  const mins = startTime ? Math.floor((Date.now() - startTime.getTime()) / 60000) : 0;
  const isLate = mins > 40;

  async function handleDeliver() {
    setLoading(true);
    await onDeliver();
    setLoading(false);
  }

  return (
    <div className={cn(
      "bg-surface border rounded-2xl overflow-hidden shadow-card",
      isLate ? "border-status-error/40" : "border-status-info/30"
    )}>
      {/* شريط الحالة العلوي */}
      <div className={cn("h-1", isLate ? "bg-status-error" : "bg-status-info")} />

      <div className="p-3 flex flex-col gap-2.5">
        {/* الرأس */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-text-primary">
              #{order.orderNumber ?? order.id.slice(0, 6)}
            </span>
            <span className={cn(
              "text-[10px] font-bold rounded-full px-2 py-0.5 border inline-flex items-center gap-1",
              isLate
                ? "bg-status-error/10 text-status-error border-status-error/25"
                : "bg-status-info/10 text-status-info border-status-info/25"
            )}>
              <Clock className="w-2.5 h-2.5" />
              {startTime ? elapsed(startTime) : "—"}
              {isLate && " · متأخر"}
            </span>
          </div>
          <button onClick={onView} className="text-[10px] text-primary underline underline-offset-2 shrink-0">
            تفاصيل
          </button>
        </div>

        {/* معلومات */}
        <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
          {order.driverName && (
            <div className="flex items-center gap-2">
              <Bike className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium">{order.driverName}</span>
            </div>
          )}
          {order.zone && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-status-info shrink-0" />
              <span>{order.zone}</span>
            </div>
          )}
          {order.customerPhone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <a href={`tel:${order.customerPhone}`} className="text-primary">
                {order.customerPhone}
              </a>
            </div>
          )}
        </div>

        {/* السعر + التوقيت */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="text-[11px] text-text-muted">
            {startTime && `خرج الساعة ${timeLabel(startTime)}`}
          </div>
          <div className="text-sm font-bold text-text-primary">
            {order.total.toFixed(0)} <span className="text-[10px] font-normal text-text-muted">د.ع</span>
          </div>
        </div>

        {/* زر التسليم */}
        <button
          onClick={handleDeliver}
          disabled={loading}
          className="w-full h-10 rounded-xl bg-status-success text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <><CheckCircle2 className="w-4 h-4" /> تأكيد التسليم</>
          }
        </button>
      </div>
    </div>
  );
}

export function FieldDeliveringPage() {
  const { orders, markDelivered } = useOrders();
  const [selected, setSelected] = useState<LiveOrder | null>(null);

  const deliveringOrders = useMemo(
    () => orders
      .filter(o => o.status === "delivering")
      .sort((a, b) => (a.deliveringAt ?? a.updatedAt).getTime() - (b.deliveringAt ?? b.updatedAt).getTime()),
    [orders]
  );

  const lateCount = deliveringOrders.filter(o => {
    const t = o.deliveringAt ?? o.updatedAt;
    return t && (Date.now() - t.getTime()) / 60000 > 40;
  }).length;

  return (
    <div className="flex flex-col gap-0 pb-6">

      {/* ── ملخص أعلى الصفحة ── */}
      <div className="px-4 pt-3 pb-3 border-b border-border">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-status-info/5 border border-status-info/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-status-info">{deliveringOrders.length}</p>
            <p className="text-xs text-text-muted mt-0.5">في الطريق</p>
          </div>
          <div className={cn(
            "border rounded-2xl p-3 text-center",
            lateCount > 0 ? "bg-status-error/5 border-status-error/20" : "bg-surface-elevated border-border"
          )}>
            <p className={cn("text-2xl font-bold", lateCount > 0 ? "text-status-error" : "text-text-muted")}>
              {lateCount}
            </p>
            <p className="text-xs text-text-muted mt-0.5">متأخرة (+40 د)</p>
          </div>
        </div>
      </div>

      {/* ── قائمة الطلبات ── */}
      <section className="px-4 pt-4 flex flex-col gap-3">
        {deliveringOrders.length === 0 ? (
          <EmptyState
            icon={<Bike className="w-8 h-8" />}
            title="لا توجد طلبات في الطريق"
            description="جميع الطلبات تم تسليمها أو لم يُعيَّن لها سائق بعد"
          />
        ) : (
          deliveringOrders.map(o => (
            <DeliveryCard
              key={o.id}
              order={o}
              onView={() => setSelected(o)}
              onDeliver={() => markDelivered(o.id)}
            />
          ))
        )}
      </section>

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
