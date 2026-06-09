import { Store, Phone, MessageCircle, Camera, Send, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderSource =
  | "instagram"
  | "telegram"
  | "whatsapp"
  | "phone"
  | "in_store";

interface Props {
  value: OrderSource;
  onChange: (v: OrderSource) => void;
}

const SOURCES: { id: OrderSource; label: string; Icon: LucideIcon; color: string }[] = [
  { id: "in_store",  label: "المحل",    Icon: Store,         color: "border-primary/30 bg-primary/5 text-primary" },
  { id: "phone",     label: "هاتف",     Icon: Phone,         color: "border-status-success/30 bg-status-success/5 text-status-success" },
  { id: "whatsapp",  label: "واتساب",   Icon: MessageCircle, color: "border-status-success/30 bg-status-success/5 text-status-success" },
  { id: "instagram", label: "انستقرام", Icon: Camera,        color: "border-[#E1306C]/30 bg-[#E1306C]/5 text-[#E1306C]" },
  { id: "telegram",  label: "تلغرام",   Icon: Send,          color: "border-status-info/30 bg-status-info/5 text-status-info" },
];

export function OrderSourceSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <span className="text-xs text-text-muted self-center shrink-0">المصدر:</span>
      {SOURCES.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all active:scale-95 select-none",
            value === s.id
              ? s.color + " ring-1 ring-current/30"
              : "border-border bg-surface text-text-muted hover:bg-surface-elevated"
          )}
        >
          <s.Icon className="w-3 h-3" />
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
