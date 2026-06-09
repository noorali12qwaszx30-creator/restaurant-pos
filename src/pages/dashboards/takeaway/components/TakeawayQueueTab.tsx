import { useState, useMemo } from "react";
import { Clock, Phone, CheckCircle2, ChefHat, ShoppingBag } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

function timeAgo(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `${m} د` : `${Math.floor(m/60)} س`;
}

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

  const TakeawayCard = ({ order, highlight }: { order: LiveOrder; highlight?: boolean }) => (
    <button
      onClick={() => setSelected(order)}
      className={cn(
        "w-full text-start p-4 rounded-2xl border flex flex-col gap-2 transition-all active:scale-[0.99]",
        highlight
          ? "bg-status-success/5 border-status-success/30 shadow-card"
          : "bg-surface border-border hover:bg-surface-elevated"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-text-primary">{order.id}</span>
        <StatusBadge status={order.status} />
      </div>
      {order.customerName && (
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>{order.customerName}</span>
          {order.customerPhone && (
            <span className="flex items-center gap-1 dir-ltr">
              <Phone className="w-3 h-3" />{order.customerPhone}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {order.items.slice(0, 5).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 py-0.5 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-4 h-4 rounded bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 num">{item.quantity}</span>
              <span className="text-xs text-text-secondary truncate">{item.name}</span>
            </div>
            <span className="text-xs font-semibold text-text-primary num shrink-0">{(item.unitPrice * item.quantity).toFixed(0)} د.ع</span>
          </div>
        ))}
        {order.items.length > 5 && (
          <p className="text-[10px] text-text-muted text-center pt-0.5">+{order.items.length - 5} أصناف أخرى</p>
        )}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-muted flex items-center gap-1">
          <Clock className="w-3 h-3" />{timeAgo(order.createdAt)}
        </span>
        <span className="text-sm font-bold text-primary">{order.total.toFixed(1)} د.ع</span>
      </div>
    </button>
  );

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
          {ready.map((o) => <TakeawayCard key={o.id} order={o} highlight />)}
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
          {preparing.map((o) => <TakeawayCard key={o.id} order={o} />)}
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
          {pending.map((o) => <TakeawayCard key={o.id} order={o} />)}
        </div>
      )}

      {orders.length === 0 && (
        <EmptyState icon={<ShoppingBag className="w-8 h-8" />} title="لا توجد طلبات نشطة" description="ستظهر هنا طلبات التيك أواي الجديدة" />
      )}

      <OrderDetailDialog
        order={selected}
        onClose={() => setSelected(null)}
        extraActions={
          selected?.status === "ready" ? (
            <Button className="w-full"><CheckCircle2 className="w-4 h-4" /> تسليم الطلب للعميل</Button>
          ) : null
        }
      />
    </div>
  );
}
