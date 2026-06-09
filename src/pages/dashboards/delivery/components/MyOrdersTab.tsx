import { useState, useMemo } from "react";
import { MapPin, Phone, Clock, CheckCircle2 } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";

export function MyOrdersTab({ driverId }: { driverId: string }) {
  const { orders } = useOrders();
  const [selected, setSelected] = useState<LiveOrder | null>(null);

  const myOrders = useMemo(
    () => orders.filter(o => o.type === "delivery" && (o.driverId === driverId || o.driverId === "mock-delivery-001")),
    [orders, driverId]
  );
  const active    = myOrders.filter((o) => o.status === "delivering");
  const completed = myOrders.filter((o) => o.status === "delivered");

  const DeliveryCard = ({ order }: { order: LiveOrder }) => (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-text-primary">{order.id}</p>
          <p className="text-xs text-text-muted mt-0.5">{order.customerName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.deliveryAddress && (
        <div className="flex items-start gap-2 text-sm text-text-secondary bg-surface-elevated rounded-xl p-2.5">
          <MapPin className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
          <span className="text-xs leading-relaxed">{order.deliveryAddress}</span>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-text-muted">
        {order.customerPhone && (
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            <span dir="ltr">{order.customerPhone}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{order.createdAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
        </span>
        <span className="font-bold text-primary ms-auto">{order.total.toFixed(1)} د.ع</span>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelected(order)}>
          تفاصيل الطلب
        </Button>
        {order.status === "delivering" && (
          <Button size="sm" className="flex-1 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            تم التوصيل
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Active */}
      {active.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">جاري التوصيل</h3>
            <Badge variant="info">{active.length}</Badge>
          </div>
          {active.map((o) => <DeliveryCard key={o.id} order={o} />)}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">مكتملة اليوم</h3>
            <Badge variant="success">{completed.length}</Badge>
          </div>
          {completed.map((o) => <DeliveryCard key={o.id} order={o} />)}
        </div>
      )}

      {myOrders.length === 0 && (
        <EmptyState icon="🛵" title="لا توجد طلبات مسندة إليك" description="ستظهر هنا طلبات التوصيل المخصصة لك" />
      )}

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
