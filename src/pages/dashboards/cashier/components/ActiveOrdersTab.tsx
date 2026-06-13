import { useState } from "react";
import { List, UtensilsCrossed, ShoppingBag, Bike, CheckCircle2, Pencil, XCircle } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EditOrderDialog, canEdit } from "./EditOrderDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = ["pending", "preparing", "ready", "delivering"] as const;

type TypeFilter = "all" | "pickup" | "takeaway" | "delivery";

const STATUS_PIPELINE = [
  { status: "pending",    label: "انتظار",    color: "text-status-warning",  bg: "bg-status-warning/10"  },
  { status: "preparing",  label: "تحضير",     color: "text-primary",         bg: "bg-primary/10"         },
  { status: "ready",      label: "جاهز",      color: "text-status-success",  bg: "bg-status-success/10"  },
  { status: "delivering", label: "توصيل",     color: "text-[#7C3AED]",       bg: "bg-[#7C3AED]/10"       },
] as const;


export function ActiveOrdersTab() {
  const { orders, cancelOrder } = useOrders();
  const [selected, setSelected] = useState<LiveOrder | null>(null);
  const [editing,  setEditing]  = useState<LiveOrder | null>(null);
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
          { id: "pickup",   label: "استلام", Icon: UtensilsCrossed },
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
                <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />
              ))}
            </div>
          ))}
        </div>
      )}

      <OrderDetailDialog
        order={selected}
        onClose={() => setSelected(null)}
        extraActions={
          selected ? (
            <div className="flex gap-2">
              {canEdit(selected) && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setEditing(selected); setSelected(null); }}
                >
                  <Pencil className="w-4 h-4" /> تعديل
                </Button>
              )}
              {!["delivered", "cancelled"].includes(selected.status) && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    if (confirm("هل تريد إلغاء هذا الطلب نهائياً؟")) {
                      cancelOrder(selected.id, "إلغاء يدوي من الكاشير");
                      setSelected(null);
                    }
                  }}
                >
                  <XCircle className="w-4 h-4" /> إلغاء الطلب
                </Button>
              )}
            </div>
          ) : null
        }
      />

      <EditOrderDialog order={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
