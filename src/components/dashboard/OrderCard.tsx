import { Clock, MapPin, Phone, ChevronLeft } from "lucide-react";
import { StatusBadge, OrderTypeBadge } from "./StatusBadge";
import type { LiveOrder } from "@/contexts/OrderContext";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: LiveOrder;
  onClick?: () => void;
  compact?: boolean;
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "الآن";
  if (diff < 60) return `منذ ${diff} د`;
  return `منذ ${Math.floor(diff / 60)} س`;
}

export function OrderCard({ order, onClick, compact = false }: OrderCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-start bg-surface border border-border rounded-2xl transition-all duration-150",
        "hover:border-primary/30 hover:bg-surface-elevated active:scale-[0.99]",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-text-primary">#{order.orderNumber ?? order.id.slice(0,6)}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <Clock className="w-3 h-3" />
          <span className="text-xs">{timeAgo(order.createdAt)}</span>
          <ChevronLeft className="w-3.5 h-3.5 ms-1" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <OrderTypeBadge type={order.type} />
        {(order as { tableNumber?: string }).tableNumber && (
          <span className="text-xs text-text-muted flex items-center gap-1">
            <MapPin className="w-3 h-3" /> طاولة {(order as { tableNumber?: string }).tableNumber}
          </span>
        )}
        {order.customerName && (
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Phone className="w-3 h-3" /> {order.customerName}
          </span>
        )}
      </div>

      {!compact && (
        <div className="text-xs text-text-muted mb-2">
          {order.items.map((i) => `${i.name} ×${i.quantity}`).join(" · ")}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{order.items.length} صنف</span>
        <span className="text-sm font-bold text-primary">{order.total.toFixed(1)} د.ع</span>
      </div>

    </button>
  );
}
