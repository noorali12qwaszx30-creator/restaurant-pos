import { useState, useMemo } from "react";
import { UtensilsCrossed, Clock, RefreshCw, CheckCircle2, Banknote, ClipboardCheck } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";

export function FieldOrdersView() {
  const { orders: allOrders } = useOrders();
  const [selected, setSelected] = useState<LiveOrder | null>(null);

  const orders = useMemo(() => allOrders.filter(o => o.type === "dine_in"), [allOrders]);

  const pending    = orders.filter((o) => o.status === "pending");
  const inProgress = orders.filter((o) => o.status === "preparing");
  const ready      = orders.filter((o) => o.status === "ready");
  const paid       = orders.filter((o) => o.status === "delivered");

  const Section = ({ title, Icon, items, count }: { title: string; Icon: React.ElementType; items: LiveOrder[]; count: number }) =>
    items.length === 0 ? null : (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <span className="text-xs bg-surface-elevated text-text-muted rounded-full px-2 py-0.5 border border-border">{count}</span>
        </div>
        {items.map((o) => <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />)}
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      {orders.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed className="w-8 h-8" />} title="لا توجد طلبات داخلية" description="لم يتم استلام أي طلبات بعد" />
      ) : (
        <>
          <Section title="انتظار"       Icon={Clock}        items={pending}    count={pending.length}    />
          <Section title="قيد التحضير"  Icon={RefreshCw}    items={inProgress} count={inProgress.length} />
          <Section title="جاهز للتقديم" Icon={CheckCircle2} items={ready}      count={ready.length}      />
          <Section title="تم الدفع"     Icon={Banknote}     items={paid}       count={paid.length}       />
        </>
      )}

      <OrderDetailDialog
        order={selected}
        onClose={() => setSelected(null)}
        extraActions={
          selected?.status === "ready" ? (
            <Button className="w-full"><CheckCircle2 className="w-4 h-4" /> تأكيد تقديم الطلب للطاولة</Button>
          ) : selected?.status === "pending" ? (
            <Button variant="outline" className="w-full"><ClipboardCheck className="w-4 h-4" /> إرسال للمطبخ</Button>
          ) : null
        }
      />
    </div>
  );
}
