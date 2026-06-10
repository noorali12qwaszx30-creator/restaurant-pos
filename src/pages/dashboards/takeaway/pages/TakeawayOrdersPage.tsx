/**
 * TakeawayOrdersPage — الطلبات النشطة مع أزرار التحكم
 */
import { useState, useMemo } from "react";
import {
  Clock, ChefHat, CheckCircle2, ShoppingBag,
  PackageCheck, PackageOpen, Loader2,
} from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { cn } from "@/lib/utils";

/* ── Action buttons ── */
function OrderActions({ order }: { order: LiveOrder }) {
  const { markReady, markDelivered } = useOrders();
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(action: "ready" | "delivered") {
    setLoading(action);
    try {
      if (action === "ready")     await markReady(order.id);
      if (action === "delivered") await markDelivered(order.id);
    } finally {
      setLoading(null);
    }
  }

  if (order.status === "ready") {
    return (
      <button
        onClick={e => { e.stopPropagation(); handle("delivered"); }}
        disabled={!!loading}
        className="w-full mt-3 h-11 rounded-2xl
          bg-gradient-to-l from-emerald-500 to-green-600
          text-white text-sm font-bold
          flex items-center justify-center gap-2
          shadow-[0_4px_14px_rgba(16,185,129,0.30)]
          active:scale-[0.97] transition-all disabled:opacity-50"
      >
        {loading === "delivered"
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <PackageOpen className="w-4 h-4" />}
        تم الاستلام
      </button>
    );
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); handle("ready"); }}
      disabled={!!loading}
      className="w-full mt-3 h-11 rounded-2xl
        bg-gradient-to-l from-primary to-primary/90
        text-white text-sm font-bold
        flex items-center justify-center gap-2
        shadow-[0_4px_14px_rgba(0,0,0,0.14)]
        active:scale-[0.97] transition-all disabled:opacity-50"
    >
      {loading === "ready"
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <PackageCheck className="w-4 h-4" />}
      تم التجهيز
    </button>
  );
}

/* ── Section header ── */
function SectionHeader({ icon: Icon, label, count, color, bg }: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={cn("w-8 h-8 rounded-2xl flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <span className="text-sm font-bold text-text-primary flex-1">{label}</span>
      <span className={cn("text-xs font-black tabular-nums px-2.5 py-1 rounded-2xl", bg, color)}>
        {count}
      </span>
    </div>
  );
}

/* ── Main ── */
export function TakeawayOrdersPage() {
  const { orders: all } = useOrders();
  const [selected, setSelected] = useState<LiveOrder | null>(null);

  const orders = useMemo(() =>
    all.filter(o => o.type === "takeaway" && !["delivered","cancelled"].includes(o.status)),
    [all]
  );

  const ready     = orders.filter(o => o.status === "ready");
  const preparing = orders.filter(o => o.status === "preparing");
  const pending   = orders.filter(o => o.status === "pending");

  return (
    <div className="flex flex-col gap-5 px-4 py-4 pb-8">

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            label: "انتظار", value: pending.length,
            color: "text-amber-600", bg: "bg-amber-50/80 dark:bg-amber-900/20",
            border: "border-amber-200/60 dark:border-amber-700/30",
            icon: Clock,
          },
          {
            label: "تحضير", value: preparing.length,
            color: "text-primary", bg: "bg-primary/6",
            border: "border-primary/15",
            icon: ChefHat,
          },
          {
            label: "جاهز", value: ready.length,
            color: "text-emerald-600", bg: "bg-emerald-50/80 dark:bg-emerald-900/20",
            border: "border-emerald-200/60 dark:border-emerald-700/30",
            icon: CheckCircle2,
          },
        ].map(s => (
          <div
            key={s.label}
            className={cn(
              "rounded-3xl py-3.5 px-3 text-center border",
              s.bg, s.border,
              "shadow-[0_1px_6px_rgba(0,0,0,0.04)]"
            )}
          >
            <div className={cn("flex items-center justify-center mb-1", s.color)}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className={cn("text-2xl font-black tabular-nums leading-none", s.color)}>{s.value}</p>
            <p className="text-[11px] text-text-muted mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Ready ── */}
      {ready.length > 0 && (
        <div>
          <SectionHeader
            icon={CheckCircle2} label="جاهز للاستلام" count={ready.length}
            color="text-emerald-600" bg="bg-emerald-50/80 dark:bg-emerald-900/20"
          />
          <div className="flex flex-col gap-2.5">
            {ready.map(o => (
              <div key={o.id} className="rounded-3xl overflow-hidden border border-emerald-200/50 dark:border-emerald-700/30 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                <OrderCard order={o} onClick={() => setSelected(o)} />
                <div className="px-3 pb-3">
                  <OrderActions order={o} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Preparing ── */}
      {preparing.length > 0 && (
        <div>
          <SectionHeader
            icon={ChefHat} label="قيد التحضير" count={preparing.length}
            color="text-primary" bg="bg-primary/6"
          />
          <div className="flex flex-col gap-2.5">
            {preparing.map(o => (
              <div key={o.id} className="rounded-3xl overflow-hidden border border-primary/15 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                <OrderCard order={o} onClick={() => setSelected(o)} />
                <div className="px-3 pb-3">
                  <OrderActions order={o} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pending ── */}
      {pending.length > 0 && (
        <div>
          <SectionHeader
            icon={Clock} label="انتظار التأكيد" count={pending.length}
            color="text-amber-600" bg="bg-amber-50/80 dark:bg-amber-900/20"
          />
          <div className="flex flex-col gap-2.5">
            {pending.map(o => (
              <div key={o.id} className="rounded-3xl overflow-hidden border border-amber-200/50 dark:border-amber-700/30 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                <OrderCard order={o} onClick={() => setSelected(o)} />
                <div className="px-3 pb-3">
                  <OrderActions order={o} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-3xl bg-surface-elevated border border-border/60 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            <ShoppingBag className="w-9 h-9 text-text-muted/50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-text-primary">لا توجد طلبات نشطة</p>
            <p className="text-xs text-text-muted mt-1.5">ستظهر هنا طلبات السفري الجديدة فور إنشائها</p>
          </div>
        </div>
      )}

      <OrderDetailDialog
        order={selected}
        onClose={() => setSelected(null)}
        extraActions={
          selected && !["delivered","cancelled"].includes(selected.status)
            ? <OrderActions order={selected} />
            : undefined
        }
      />
    </div>
  );
}
