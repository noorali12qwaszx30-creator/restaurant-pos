import { ShoppingBag, Bike, Store } from "lucide-react";
import { cn } from "@/lib/utils";

type AnyStatus = string;

const STATUS_MAP: Record<string, {
  label: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
}> = {
  pending:          { label: "انتظار",      dot: "bg-status-warning",  bg: "bg-status-warning/12",  text: "text-status-warning",  border: "border-status-warning/25"  },
  preparing:        { label: "قيد التحضير", dot: "bg-primary",         bg: "bg-primary/10",         text: "text-primary",         border: "border-primary/25"         },
  ready:            { label: "جاهز",        dot: "bg-status-success",  bg: "bg-status-success/12",  text: "text-status-success",  border: "border-status-success/25"  },
  assigned:         { label: "مُسند",       dot: "bg-status-info",     bg: "bg-status-info/12",     text: "text-status-info",     border: "border-status-info/25"     },
  delivering:       { label: "في الطريق",   dot: "bg-status-info",     bg: "bg-status-info/12",     text: "text-status-info",     border: "border-status-info/25"     },
  delivered:        { label: "تم التوصيل",  dot: "bg-status-success",  bg: "bg-status-success/10",  text: "text-status-success",  border: "border-status-success/20"  },
  cancelled:        { label: "ملغي",        dot: "bg-status-error",    bg: "bg-status-error/10",    text: "text-status-error",    border: "border-status-error/20"    },
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  const cfg = STATUS_MAP[status] ?? {
    label: status, dot: "bg-text-muted", bg: "bg-surface-elevated",
    text: "text-text-secondary", border: "border-border",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold",
      cfg.bg, cfg.text, cfg.border
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

const TYPE_MAP: Record<string, { label: string; Icon: React.ElementType; cls: string }> = {
  takeaway: { label: "سفري",   Icon: ShoppingBag,     cls: "text-amber-600 bg-amber-500/8 border-amber-500/20"     },
  delivery: { label: "توصيل",  Icon: Bike,            cls: "text-status-info bg-status-info/8 border-status-info/20" },
  pickup:   { label: "استلام", Icon: Store,           cls: "text-text-secondary bg-surface-elevated border-border"  },
};

export function OrderTypeBadge({ type }: { type: string }) {
  const cfg = TYPE_MAP[type] ?? { label: type, Icon: Store, cls: "text-text-secondary bg-surface-elevated border-border" };
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-medium",
      cfg.cls
    )}>
      <cfg.Icon className="w-3 h-3" />
      <span>{cfg.label}</span>
    </span>
  );
}
