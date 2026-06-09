import { useState, useEffect } from "react";
import { Clock, MapPin, Phone, ChevronLeft, Store, MessageCircle, Camera, Send, AlertTriangle } from "lucide-react";
import { StatusBadge, OrderTypeBadge } from "./StatusBadge";
import type { LiveOrder } from "@/contexts/OrderContext";
import { cn } from "@/lib/utils";

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  phone:     { label: "هاتف",     icon: <Phone         className="w-2.5 h-2.5" />, cls: "bg-status-success/10 text-status-success border-status-success/25" },
  whatsapp:  { label: "واتساب",   icon: <MessageCircle className="w-2.5 h-2.5" />, cls: "bg-status-success/10 text-status-success border-status-success/25" },
  instagram: { label: "انستقرام", icon: <Camera        className="w-2.5 h-2.5" />, cls: "bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/25" },
  telegram:  { label: "تلغرام",   icon: <Send          className="w-2.5 h-2.5" />, cls: "bg-status-info/10 text-status-info border-status-info/25" },
  local:     { label: "المحل",    icon: <Store         className="w-2.5 h-2.5" />, cls: "bg-primary/10 text-primary border-primary/25" },
  in_store:  { label: "المحل",    icon: <Store         className="w-2.5 h-2.5" />, cls: "bg-primary/10 text-primary border-primary/25" },
};

// ─── Constants ───────────────────────────────────────────────
const SLOTS = 5;
const WARN_MIN  = 20; // yellow zone
const LATE_MIN  = 30; // red zone

// ─── Live timer hook (ticks every second) ─────────────────────
function useElapsed(since: Date) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - since.getTime()) / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - since.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [since]);
  return elapsed; // seconds
}

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Timer badge ──────────────────────────────────────────────
function TimerBadge({ since, done }: { since: Date; done: boolean }) {
  const secs = useElapsed(since);
  const mins = Math.floor(secs / 60);

  if (done) return null;

  const isLate = mins >= LATE_MIN;
  const isWarn = mins >= WARN_MIN && !isLate;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold num tabular-nums transition-colors duration-500",
        isLate
          ? "bg-status-error text-white border-status-error animate-[latePulse_0.8s_ease-in-out_infinite]"
          : isWarn
          ? "bg-status-warning/15 text-status-warning border-status-warning/40"
          : "bg-surface-elevated text-text-muted border-border"
      )}
    >
      <Clock className="w-2.5 h-2.5" />
      {formatTimer(secs)}
      {isLate && <AlertTriangle className="w-2.5 h-2.5" />}
    </span>
  );
}

export { formatTimer };
export function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "الآن";
  if (diff < 60) return `${diff} د`;
  return `${Math.floor(diff / 60)} س`;
}

const STATUS_BORDER: Record<string, string> = {
  pending:          "border-r-status-warning",
  confirmed:        "border-r-status-info",
  preparing:        "border-r-primary",
  ready:            "border-r-status-success",
  delivering:       "border-r-status-info",
  out_for_delivery: "border-r-status-info",
  delivered:        "border-r-status-success/40",
  cancelled:        "border-r-status-error/40",
};

interface OrderCardProps {
  order: LiveOrder;
  onClick?: () => void;
  actions?: React.ReactNode;
}

// ─── Unified Order Card ───────────────────────────────────────
export function OrderCard({ order, onClick, actions }: OrderCardProps) {
  const isDone = ["delivered", "cancelled"].includes(order.status);
  const borderColor = STATUS_BORDER[order.status] ?? "border-r-border";

  return (
    <div
      className={cn(
        "w-full bg-surface border border-border rounded-2xl overflow-hidden shadow-card",
        "border-r-4", borderColor,
        onClick && "cursor-pointer transition-all duration-150 hover:border-primary/30 hover:shadow-elevated active:scale-[0.99]"
      )}
      onClick={onClick}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-bold num shrink-0">
            {order.orderNumber ?? order.id.slice(0, 4)}
          </span>
          <StatusBadge status={order.status} />
          <OrderTypeBadge type={order.type} />
          {order.source && SOURCE_CONFIG[order.source] && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold",
              SOURCE_CONFIG[order.source].cls
            )}>
              {SOURCE_CONFIG[order.source].icon}
              {SOURCE_CONFIG[order.source].label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 -mt-3">
          <TimerBadge since={order.createdAt} done={isDone} />
          {onClick && <ChevronLeft className="w-3 h-3 text-text-muted opacity-50" />}
        </div>
      </div>

      {/* ── Customer / address bar ── */}
      <div className="flex items-center gap-3 px-3 pb-2 h-7">
        {order.customerName ? (
          <span className="text-[11px] text-text-muted flex items-center gap-1 truncate">
            <Phone className="w-2.5 h-2.5 shrink-0" /> {order.customerName}
            {order.customerPhone && <span dir="ltr" className="opacity-70"> · {order.customerPhone}</span>}
          </span>
        ) : order.deliveryAddress ? (
          <span className="text-[11px] text-text-muted flex items-center gap-1 truncate">
            <MapPin className="w-2.5 h-2.5 shrink-0" /> {order.deliveryAddress}
          </span>
        ) : (
          <span className="text-[11px] text-text-muted opacity-40">—</span>
        )}
      </div>

      {/* ── Items: exactly SLOTS rows ── */}
      <div className="mx-3 mb-2 rounded-xl border border-border/60 overflow-hidden">
        {Array.from({ length: SLOTS }).map((_, idx) => {
          const item = order.items[idx];
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between gap-2 px-2.5 h-8",
                idx < SLOTS - 1 && "border-b border-border/40",
                !item && "opacity-0 pointer-events-none"
              )}
            >
              {item ? (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 num">
                      {item.quantity}
                    </span>
                    <span className="text-xs text-text-secondary truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-text-primary num shrink-0">
                    {(item.unitPrice * item.quantity).toFixed(0)} د.ع
                  </span>
                </>
              ) : (
                <span className="w-full h-full" />
              )}
            </div>
          );
        })}
      </div>

      {order.items.length > SLOTS && (
        <p className="text-[10px] text-text-muted text-center pb-1.5">
          +{order.items.length - SLOTS} أصناف أخرى
        </p>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <span className="text-[11px] text-text-muted bg-surface-elevated rounded-lg px-2 py-0.5 border border-border num">
          {order.items.length} صنف
        </span>
        <span className="text-sm font-bold text-primary num">{order.total.toFixed(1)} د.ع</span>
      </div>

      {actions && (
        <div className="px-3 pb-3 pt-0 flex flex-col gap-2 border-t border-border mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
