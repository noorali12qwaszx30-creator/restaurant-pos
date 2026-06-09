import { UtensilsCrossed, ShoppingBag, Bike, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AnyStatus = string;

const STATUS_MAP: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "secondary" }> = {
  pending:          { label: "انتظار",      variant: "warning"   },
  confirmed:        { label: "مؤكد",        variant: "info"      },
  preparing:        { label: "قيد التحضير", variant: "default"   },
  ready:            { label: "جاهز",        variant: "success"   },
  out_for_delivery: { label: "في الطريق",   variant: "info"      },
  delivering:       { label: "في الطريق",   variant: "info"      },
  delivered:        { label: "تم التوصيل",  variant: "success"   },
  paid:             { label: "مدفوع",       variant: "secondary" },
  cancelled:        { label: "ملغي",        variant: "error"     },
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  const cfg = STATUS_MAP[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

const TYPE_MAP: Record<string, { label: string; Icon: React.ElementType }> = {
  dine_in:  { label: "داخلي",  Icon: UtensilsCrossed },
  takeaway: { label: "سفري",   Icon: ShoppingBag     },
  delivery: { label: "توصيل",  Icon: Bike            },
  pickup:   { label: "استلام", Icon: Store           },
};

export function OrderTypeBadge({ type }: { type: string }) {
  const cfg = TYPE_MAP[type] ?? { label: type, Icon: Store };
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
      <cfg.Icon className="w-3 h-3" />
      <span>{cfg.label}</span>
    </span>
  );
}
