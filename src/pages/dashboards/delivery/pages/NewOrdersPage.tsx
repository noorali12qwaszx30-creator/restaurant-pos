import { useMemo } from "react";
import { MapPin, Clock, FileText, Phone, MessageCircle, Bike, BellRing } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

function waitedLabel(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `${m} د مضت` : `${Math.floor(m / 60)} س ${m % 60} د مضت`;
}

function ContactButtons({ phone }: { phone?: string }) {
  if (!phone) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      <a href={`tel:${phone}`}
        className="h-10 rounded-xl bg-status-info/10 text-status-info border border-status-info/20 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
        <Phone className="w-3.5 h-3.5" /> اتصال
      </a>
      <a href={`https://wa.me/${phone.replace(/^0/, "966")}`} target="_blank" rel="noopener noreferrer"
        className="h-10 rounded-xl bg-status-success/10 text-status-success border border-status-success/20 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
        <MessageCircle className="w-3.5 h-3.5" /> واتساب
      </a>
    </div>
  );
}

function NewOrderCard({ order }: { order: LiveOrder }) {
  return (
    <div className="bg-surface border-2 border-primary/30 rounded-2xl overflow-hidden shadow-elevated">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary animate-pulse" />
      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-text-primary">{order.id}</span>
              <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 animate-pulse flex items-center gap-1">
                <BellRing className="w-2.5 h-2.5" /> مُسند لك
              </span>
            </div>
            <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />{waitedLabel(order.deliveringAt ?? order.createdAt)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{order.total.toFixed(1)} ر.س</p>
            {order.deliveryFee > 0 && (
              <p className="text-xs text-status-success font-medium">+ {order.deliveryFee} ر.س توصيل</p>
            )}
          </div>
        </div>

        {/* Customer */}
        {order.customerName && (
          <div className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {order.customerName[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{order.customerName}</p>
              <p className="text-xs text-text-muted" dir="ltr">{order.customerPhone}</p>
            </div>
          </div>
        )}

        {/* Address */}
        {order.deliveryAddress && (
          <div className={cn("flex items-start gap-2 text-xs text-text-secondary")}>
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              {order.zone && <span className="font-semibold text-primary">{order.zone} · </span>}
              <span>{order.deliveryAddress}</span>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-surface-elevated rounded-xl px-3 py-2 text-xs text-text-muted">
          {order.items.map(i => `${i.name} ×${i.quantity}`).join(" · ")}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="flex items-start gap-1.5 text-xs text-primary bg-primary/5 border border-primary/15 rounded-xl px-3 py-2">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {order.notes}
          </div>
        )}

        {/* Contact */}
        <ContactButtons phone={order.customerPhone} />

        {/* Info note */}
        <p className="text-[11px] text-text-muted text-center mt-1">
          انتقل إلى تبويب "طلباتي" لتأكيد التسليم
        </p>
      </div>
    </div>
  );
}

export function NewOrdersPage() {
  const { orders } = useOrders();
  const { profile } = useAuth();
  const driverId = profile?.uid ?? "mock-delivery-001";

  // Show delivering orders just assigned to me (dispatched within last hour)
  const myNewOrders = useMemo(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return orders.filter(o =>
      (o.driverId === driverId || o.driverId === "mock-delivery-001") &&
      o.status === "delivering" &&
      (o.deliveringAt ?? o.updatedAt).getTime() > oneHourAgo
    ).sort((a, b) =>
      (b.deliveringAt ?? b.updatedAt).getTime() - (a.deliveringAt ?? a.updatedAt).getTime()
    );
  }, [orders, driverId]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      {myNewOrders.length === 0 ? (
        <EmptyState
          icon={<Bike className="w-8 h-8" />}
          title="لا توجد طلبات جديدة"
          description="ستظهر هنا الطلبات المُسندة لك خلال الساعة الأخيرة"
        />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">طلبات مُسندة حديثاً</span>
            <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 border border-primary/20 animate-pulse">
              {myNewOrders.length}
            </span>
          </div>
          {myNewOrders.map(o => (
            <NewOrderCard key={o.id} order={o} />
          ))}
        </>
      )}
    </div>
  );
}
