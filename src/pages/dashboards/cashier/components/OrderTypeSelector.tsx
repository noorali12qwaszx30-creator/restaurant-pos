import { Truck, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export type PosOrderType = "delivery" | "pickup";

interface Props {
  value: PosOrderType;
  onChange: (v: PosOrderType) => void;
}

const TYPES: { id: PosOrderType; label: string; sub: string; icon: React.ElementType; accent: string }[] = [
  {
    id: "delivery",
    label: "توصيل",
    sub: "يتطلب عنوان",
    icon: Truck,
    accent: "border-status-info/50 bg-status-info/8 text-status-info",
  },
  {
    id: "pickup",
    label: "بيك أب",
    sub: "استلام من الكاونتر",
    icon: Store,
    accent: "border-[#7C3AED]/50 bg-[#7C3AED]/8 text-[#7C3AED]",
  },
];

export function OrderTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {TYPES.map((t) => {
        const Icon = t.icon;
        const selected = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all active:scale-[0.97] select-none",
              selected
                ? t.accent + " ring-2 ring-offset-1 ring-current/20 shadow-card"
                : "border-border bg-surface text-text-muted hover:bg-surface-elevated"
            )}
          >
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", selected ? "bg-current/10" : "bg-surface-elevated")}>
              <Icon className={cn("w-5 h-5", selected ? "" : "text-text-muted")} />
            </div>
            <div className="text-start">
              <p className={cn("text-sm font-bold leading-none", selected ? "" : "text-text-primary")}>{t.label}</p>
              <p className={cn("text-[11px] mt-0.5 leading-tight", selected ? "opacity-70" : "text-text-muted")}>{t.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
