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
  if (diff < 60) return `${diff} د`;
  return `${Math.floor(diff / 60)} س`;
}

const STATUS_BORDER: Record<string, string> = {
  pending:   "border-r-status-warning",
  confirmed: "border-r-status-info",
  preparing: "border-r-primary",
  ready:     "border-r-status-success",
  delivering:"border-r-status-info",
  delivered: "border-r-status-success/40",
  cancelled: "border-r-status-error/40",
};

export function OrderCard({ order, onClick, compact = false }: OrderCardProps) {
  const borderColor = STATUS_BORDER[order.status] ?? "border-r-border";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-start bg-surface border border-border rounded-2xl overflow-hidden",
        "transition-all duration-200 card-hover shadow-card",
        "hover:border-primary/20",
        "border-r-4", borderColor,
        compact ? "p-3" : "p-4"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-bold num shrink-0">
            {order.orderNumber ?? order.id.slice(0, 4)}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <Clock className="w-3 h-3" />
          <span className="text-[11px] num">{timeAgo(order.createdAt)}</span>
          <ChevronLeft className="w-3 h-3 ms-0.5 opacity-50" />
        </div>
      </div>

      {/* Type + metadata */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <OrderTypeBadge type={order.type} />
        {(order as { tableNumber?: string }).tableNumber && (
          <span className="text-[11px] text-text-muted flex items-center gap-1 bg-surface-elevated rounded-lg px-2 py-0.5 border border-border">
            <MapPin className="w-2.5 h-2.5" /> {(order as { tableNumber?: string }).tableNumber}
          </span>
        )}
        {order.customerName && (
          <span className="text-[11px] text-text-muted flex items-center gap-1">
            <Phone className="w-2.5 h-2.5" /> {order.customerName}
          </span>
        )}
      </div>

      {/* Items list — up to 5 rows */}
      {!compact && order.items.length > 0 && (
        <div className="mb-2.5 flex flex-col gap-1">
          {order.items.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 py-1 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 num">
                  {item.quantity}
                </span>
                <span className="text-xs text-text-secondary truncate">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-text-primary num shrink-0">
                {(item.unitPrice * item.quantity).toFixed(0)} د.ع
              </span>
            </div>
          ))}
          {order.items.length > 5 && (
            <p className="text-[10px] text-text-muted text-center pt-0.5">
              +{order.items.length - 5} أصناف أخرى
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-text-muted bg-surface-elevated rounded-lg px-2 py-0.5 border border-border">
          {order.items.length} صنف
        </span>
        <span className="text-sm font-bold text-primary num">{order.total.toFixed(1)} د.ع</span>
      </div>
    </button>
  );
}
