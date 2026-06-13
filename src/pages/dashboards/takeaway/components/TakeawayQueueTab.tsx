import { useState, useMemo } from "react";
import { Clock, CheckCircle2, ChefHat, ShoppingBag } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function TakeawayQueueTab() {
  const { orders: allOrders } = useOrders();
  const [selected, setSelected] = useState<LiveOrder | null>(null);

  const orders = useMemo(
    () => allOrders.filter(o =>
      (o.type === "takeaway" || o.type === "pickup") &&
      !["delivered", "cancelled"].includes(o.status)
    ),
    [allOrders]
  );

  const preparing = orders.filter((o) => o.status === "preparing");
  const ready     = orders.filter((o) => o.status === "ready");
  const pending   = orders.filter((o) => o.status === "pending");

  return (
    <div className="flex flex-col gap-5">
      {/* Ready — priority */}
      {ready.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success" />
            <h3 className="text-sm font-semibold text-text-primary">جاهز للاستلام</h3>
            <Badge variant="success">{ready.length}</Badge>
          </div>
          {ready.map((o) => <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />)}
        </div>
      )}

      {/* Preparing */}
      {preparing.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">قيد التحضير</h3>
            <Badge>{preparing.length}</Badge>
          </div>
          {preparing.map((o) => <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />)}
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-status-warning" />
            <h3 className="text-sm font-semibold text-text-primary">انتظار التأكيد</h3>
            <Badge variant="warning">{pending.length}</Badge>
          </div>
          {pending.map((o) => <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />)}
        </div>
      )}

      {orders.length === 0 && (
        <EmptyState icon={<ShoppingBag className="w-8 h-8" />} title="لا توجد طلبات نشطة" description="ستظهر هنا طلبات التيك أواي الجديدة" />
      )}

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
