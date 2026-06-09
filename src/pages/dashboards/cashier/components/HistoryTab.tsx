import { useState } from "react";
import { CheckCircle2, XCircle, Search, X } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderTypeBadge } from "@/components/dashboard/StatusBadge";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

type Tab = "completed" | "cancelled";

function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/[ىئ]/g, "ي").toLowerCase().trim();
}

function timeAgo(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `${m} د` : `${Math.floor(m / 60)} س`;
}

function HistoryCard({ order, onClick, completed }: { order: LiveOrder; onClick: () => void; completed: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-start bg-surface border border-border rounded-2xl p-3 flex items-center gap-3 hover:bg-surface-elevated transition-all active:scale-[0.99]"
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", completed ? "bg-status-success/10" : "bg-status-error/10")}>
        {completed
          ? <CheckCircle2 className="w-4.5 h-4.5 text-status-success" />
          : <XCircle     className="w-4.5 h-4.5 text-status-error" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-text-primary">#{order.orderNumber ?? order.id.slice(0,6)}</span>
          <OrderTypeBadge type={order.type} />
        </div>
        {order.customerName && (
          <p className="text-xs text-text-muted truncate">{order.customerName}</p>
        )}
        <p className="text-xs text-text-muted line-clamp-1">
          {order.items.map((i) => i.name).join(" · ")}
        </p>
      </div>

      <div className="shrink-0 text-left flex flex-col items-end gap-0.5">
        <span className={cn("text-sm font-bold", completed ? "text-primary" : "text-text-muted line-through")}>
          {order.total.toFixed(1)} د.ع
        </span>
        <span className="text-xs text-text-muted">{timeAgo(order.createdAt)}</span>
        {order.paymentMethod && (
          <span className="text-[10px] text-text-muted">
            {order.paymentMethod === "cash" ? "نقدي" : order.paymentMethod === "card" ? "بطاقة" : "مقسّم"}
          </span>
        )}
      </div>
    </button>
  );
}

export function HistoryTab() {
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState<Tab>("completed");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LiveOrder | null>(null);

  const completedOrders = orders.filter((o) => o.status === "delivered");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const tabOrders = activeTab === "completed" ? completedOrders : cancelledOrders;

  const filtered = query.trim()
    ? tabOrders.filter((o) => {
        const q = normalizeAr(query);
        return (
          normalizeAr(o.id).includes(q) ||
          normalizeAr(o.customerName ?? "").includes(q) ||
          (o.customerPhone ?? "").includes(query)
        );
      })
    : tabOrders;

  const completedTotal = completedOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="px-4 flex flex-col gap-4 py-3 pb-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-status-success/5 border border-status-success/20 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-status-success">{completedOrders.length}</p>
          <p className="text-xs text-text-muted mt-0.5">مكتمل</p>
          <p className="text-xs font-medium text-status-success mt-1">{completedTotal.toFixed(0)} د.ع</p>
        </div>
        <div className="bg-status-error/5 border border-status-error/20 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-status-error">{cancelledOrders.length}</p>
          <p className="text-xs text-text-muted mt-0.5">ملغي</p>
          <p className="text-xs font-medium text-status-error mt-1">
            {cancelledOrders.reduce((s, o) => s + o.total, 0).toFixed(0)} د.ع مفقودة
          </p>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 bg-surface-elevated rounded-xl p-1">
        {([
          { id: "completed", label: "المكتملة", icon: CheckCircle2, count: completedOrders.length },
          { id: "cancelled", label: "الملغية",  icon: XCircle,      count: cancelledOrders.length },
        ] as { id: Tab; label: string; icon: React.ElementType; count: number }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === t.id
                ? "bg-surface text-text-primary shadow-card"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={cn(
              "text-[11px] rounded-full px-1.5 py-0.5 font-bold",
              activeTab === t.id
                ? t.id === "completed" ? "bg-status-success/10 text-status-success" : "bg-status-error/10 text-status-error"
                : "bg-surface text-text-muted"
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالرقم أو الاسم أو الهاتف..."
          className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
            <X className="w-3 h-3 text-text-muted" />
          </button>
        )}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={activeTab === "completed" ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          title={activeTab === "completed" ? "لا توجد طلبات مكتملة" : "لا توجد طلبات ملغية"}
          description={query ? "لا توجد نتائج للبحث" : "ستظهر هنا عند اكتمال الطلبات"}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {query && <p className="text-xs text-text-muted">{filtered.length} نتيجة</p>}
          {filtered.map((o) => (
            <HistoryCard
              key={o.id}
              order={o}
              completed={activeTab === "completed"}
              onClick={() => setSelected(o)}
            />
          ))}
        </div>
      )}

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
