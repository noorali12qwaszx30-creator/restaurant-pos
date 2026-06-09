import { useState } from "react";
import { Clock, ChevronLeft, Phone, MapPin, List, UtensilsCrossed, ShoppingBag, Bike, CheckCircle2 } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { StatusBadge, OrderTypeBadge } from "@/components/dashboard/StatusBadge";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = ["pending", "preparing", "ready", "delivering"] as const;

type TypeFilter = "all" | "dine_in" | "takeaway" | "delivery";

const STATUS_PIPELINE = [
  { status: "pending",    label: "انتظار",    color: "text-status-warning",  bg: "bg-status-warning/10"  },
  { status: "preparing",  label: "تحضير",     color: "text-primary",         bg: "bg-primary/10"         },
  { status: "ready",      label: "جاهز",      color: "text-status-success",  bg: "bg-status-success/10"  },
  { status: "delivering", label: "توصيل",     color: "text-[#7C3AED]",       bg: "bg-[#7C3AED]/10"       },
] as const;

function timeAgo(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `${m} د` : `${Math.floor(m / 60)} س`;
}


function ActiveOrderCard({ order, onClick }: { order: LiveOrder; onClick: () => void }) {
  const waited = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);
  const isUrgent = waited > 25;

  const statusStep = STATUS_PIPELINE.findIndex((s) => s.status === order.status);
  const currentStep = STATUS_PIPELINE[statusStep];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-start bg-surface border rounded-2xl overflow-hidden transition-all active:scale-[0.99] shadow-card",
        isUrgent ? "border-status-error/40" : "border-border"
      )}
    >
      {/* Status progress bar */}
      <div className="flex h-1">
        {STATUS_PIPELINE.map((s, i) => (
          <div
            key={s.status}
            className={cn(
              "flex-1 transition-all",
              i <= statusStep ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>

      {/* Header */}
      <div className={cn("flex items-center justify-between px-3 py-2.5", currentStep?.bg ?? "bg-surface-elevated")}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary">{order.id}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-xs font-medium flex items-center gap-1", isUrgent ? "text-status-error" : "text-text-muted")}>
            <Clock className="w-3 h-3" />
            {timeAgo(order.createdAt)}
          </span>
          <ChevronLeft className="w-4 h-4 text-text-muted" />
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pb-3 pt-2 flex flex-col gap-1.5">
        {/* Customer + type */}
        <div className="flex items-center gap-2 flex-wrap">
          <OrderTypeBadge type={order.type} />
          {(order as { tableNumber?: string }).tableNumber && (
            <span className="text-xs text-text-muted">طاولة {(order as { tableNumber?: string }).tableNumber}</span>
          )}
          {order.customerName && (
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <Phone className="w-3 h-3" />{order.customerName}
            </span>
          )}
        </div>

        {/* Items */}
        <p className="text-xs text-text-muted line-clamp-1">
          {order.items.map((i) => `${i.name} ×${i.quantity}`).join(" · ")}
        </p>

        {/* Delivery address */}
        {order.deliveryAddress && (
          <p className="text-xs text-text-muted flex items-center gap-1 line-clamp-1">
            <MapPin className="w-3 h-3 shrink-0" />{order.deliveryAddress}
          </p>
        )}

        {/* Total */}
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-text-muted">{order.items.length} أصناف</span>
          <span className="text-sm font-bold text-primary">{order.total.toFixed(1)} د.ع</span>
        </div>
      </div>
    </button>
  );
}

export function ActiveOrdersTab() {
  const { orders } = useOrders();
  const [selected, setSelected] = useState<LiveOrder | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const activeOrders = orders.filter((o) => (ACTIVE_STATUSES as readonly string[]).includes(o.status));

  const filtered = typeFilter === "all"
    ? activeOrders
    : activeOrders.filter((o) => o.type === typeFilter);

  // Group by status following the pipeline order
  const groups = STATUS_PIPELINE.map((s) => ({
    ...s,
    orders: filtered.filter((o) => o.status === s.status),
  })).filter((g) => g.orders.length > 0);

  const countByStatus = Object.fromEntries(
    STATUS_PIPELINE.map((s) => [s.status, activeOrders.filter((o) => o.status === s.status).length])
  );

  return (
    <div className="px-4 flex flex-col gap-4 py-3 pb-6">
      {/* Status pipeline summary */}
      <div className="grid grid-cols-5 gap-1.5">
        {STATUS_PIPELINE.map((s) => (
          <div key={s.status} className={cn("rounded-xl p-2 text-center", s.bg)}>
            <p className={cn("text-lg font-bold leading-none", s.color)}>{countByStatus[s.status] ?? 0}</p>
            <p className="text-[10px] text-text-muted mt-1 leading-none">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {([
          { id: "all",      label: "الكل",   Icon: List           },
          { id: "dine_in",  label: "داخلي",  Icon: UtensilsCrossed },
          { id: "takeaway", label: "سفري",   Icon: ShoppingBag    },
          { id: "delivery", label: "توصيل",  Icon: Bike           },
        ] as { id: TypeFilter; label: string; Icon: React.ElementType }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
              typeFilter === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface border-border text-text-muted hover:bg-surface-elevated"
            )}
          >
            <t.Icon className="w-3 h-3" />
            <span>{t.label}</span>
            {t.id === "all" && <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px]">{activeOrders.length}</span>}
          </button>
        ))}
      </div>

      {/* Orders grouped by status */}
      {filtered.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="w-8 h-8" />} title="لا توجد طلبات نشطة" description="جميع الطلبات مكتملة أو ملغية" />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.status} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-bold", g.color)}>{g.label}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", g.bg, g.color)}>
                  {g.orders.length}
                </span>
              </div>
              {g.orders.map((o) => (
                <ActiveOrderCard key={o.id} order={o} onClick={() => setSelected(o)} />
              ))}
            </div>
          ))}
        </div>
      )}

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
