/**
 * TakeawayCompletedPage — الطلبات المكتملة (delivered)
 */
import { useState, useMemo } from "react";
import { CheckCircle2, TrendingUp, ShoppingBag } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";

export function TakeawayCompletedPage() {
  const { orders: all } = useOrders();
  const [selected, setSelected] = useState<LiveOrder | null>(null);

  const orders = useMemo(() =>
    all
      .filter(o => o.type === "takeaway" && o.status === "delivered")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [all]
  );

  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders
      .filter(o => o.createdAt.toDateString() === today)
      .reduce((s, o) => s + o.subtotal, 0);
  }, [orders]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => o.createdAt.toDateString() === today).length;
  }, [orders]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-8">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-3xl py-4 px-3 text-center
          bg-emerald-50/80 dark:bg-emerald-900/20
          border border-emerald-200/60 dark:border-emerald-700/30
          shadow-[0_2px_10px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-center mb-1.5 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-emerald-600 tabular-nums leading-none">{todayCount}</p>
          <p className="text-[11px] text-text-muted mt-1.5 font-medium">مكتملة اليوم</p>
        </div>
        <div className="rounded-3xl py-4 px-3 text-center
          bg-primary/6 border border-primary/15
          shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-center mb-1.5 text-primary">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-primary tabular-nums leading-none">
            {todayRevenue.toLocaleString("en-US")}
          </p>
          <p className="text-[11px] text-text-muted mt-1.5 font-medium">إيرادات اليوم (د.ع)</p>
        </div>
      </div>

      {/* ── Orders ── */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-3xl bg-surface-elevated border border-border/60 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            <ShoppingBag className="w-9 h-9 text-text-muted/50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-text-primary">لا توجد طلبات مكتملة</p>
            <p className="text-xs text-text-muted mt-1.5">ستظهر هنا طلبات السفري بعد تسليمها</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orders.map(o => (
            <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />
          ))}
        </div>
      )}

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
