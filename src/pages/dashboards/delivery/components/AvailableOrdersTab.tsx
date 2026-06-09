import { useState, useMemo } from "react";
import { MapPin, Phone, Package } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function AvailableOrdersTab() {
  const { orders } = useOrders();
  const [selected, setSelected] = useState<LiveOrder | null>(null);

  const available = useMemo(
    () => orders.filter(o => o.type === "delivery" && ["ready", "pending"].includes(o.status) && !o.driverId),
    [orders]
  );

  return (
    <div className="flex flex-col gap-3">
      {available.length === 0 ? (
        <EmptyState icon="✅" title="لا توجد طلبات متاحة" description="جميع طلبات التوصيل مسندة حالياً" />
      ) : (
        available.map((order: LiveOrder) => (
          <div key={order.id} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-text-primary">#{order.orderNumber ?? order.id.slice(0,6)}</p>
                <p className="text-xs text-text-muted">{order.customerName}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={order.status} />
                <span className="text-sm font-bold text-primary">{order.total.toFixed(1)} د.ع</span>
              </div>
            </div>

            {order.deliveryAddress && (
              <div className="flex items-start gap-2 text-xs text-text-secondary bg-surface-elevated rounded-xl p-2.5">
                <MapPin className="w-3.5 h-3.5 text-text-muted mt-0.5 shrink-0" />
                <span className="leading-relaxed">{order.deliveryAddress}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-text-muted">
              {order.customerPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span dir="ltr">{order.customerPhone}</span>
                </span>
              )}
              <span className="flex items-center gap-1 ms-auto">
                <Package className="w-3.5 h-3.5" />
                {order.items.length} أصناف
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelected(order)}>
                التفاصيل
              </Button>
              <Button size="sm" className="flex-1">
                🛵 استلام الطلب
              </Button>
            </div>
          </div>
        ))
      )}

      <OrderDetailDialog
        order={selected}
        onClose={() => setSelected(null)}
        extraActions={
          selected ? <Button className="w-full">🛵 استلام الطلب</Button> : null
        }
      />
    </div>
  );
}
