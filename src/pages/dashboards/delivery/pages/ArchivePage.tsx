import { useState, useMemo } from "react";
import { Search, X, CheckCircle2, Wallet, Clock, ChevronDown, ChevronUp, Package, Info } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

type Tab = "orders" | "accounting";

function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/[ىئ]/g, "ي").toLowerCase().trim();
}

function timeLabel(d: Date) {
  return d.toLocaleDateString("ar-SA", { day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

// Simulated settlement history
const SETTLEMENTS = [
  { id: "SET-001", date: new Date(Date.now() - 7 * 86400000), amount: 182, orders: 13, method: "تحويل بنكي" },
  { id: "SET-002", date: new Date(Date.now() - 14 * 86400000), amount: 154, orders: 11, method: "نقدي" },
  { id: "SET-003", date: new Date(Date.now() - 21 * 86400000), amount: 210, orders: 15, method: "تحويل بنكي" },
];

function OrderArchiveCard({ order }: { order: LiveOrder }) {
  const isDelivered = order.status === "delivered";
  return (
    <div className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
        isDelivered ? "bg-status-success/10" : "bg-status-error/10"
      )}>
        {isDelivered
          ? <CheckCircle2 className="w-4 h-4 text-status-success" />
          : <X className="w-4 h-4 text-status-error" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-text-primary">{order.id}</span>
          {order.zone && <span className="text-[10px] text-status-info">· {order.zone}</span>}
        </div>
        <p className="text-xs text-text-muted truncate">{order.customerName}</p>
        <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
          <Clock className="w-2.5 h-2.5" />{timeLabel(order.deliveredAt ?? order.updatedAt)}
        </p>

      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-bold", isDelivered ? "text-primary" : "text-text-muted line-through")}>
          {order.total.toFixed(1)} د.ع
        </p>
        {order.deliveryFee > 0 && isDelivered && (
          <p className="text-xs text-status-success font-medium">+{order.deliveryFee} د.ع</p>
        )}
      </div>
    </div>
  );
}

function OrdersTab({ myOrders }: { myOrders: LiveOrder[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "delivered" | "cancelled">("all");

  const allMyOrders = myOrders
    .filter(o => o.status === "delivered" || o.status === "cancelled")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const results = useMemo(() => {
    const q = normalizeAr(query);
    return allMyOrders.filter(o => {
      if (filter === "delivered" && o.status !== "delivered") return false;
      if (filter === "cancelled" && o.status !== "cancelled") return false;
      if (!q) return true;
      return (
        normalizeAr(o.id).includes(q) ||
        normalizeAr(o.customerName ?? "").includes(q) ||
        normalizeAr(o.zone ?? "").includes(q)
      );
    });
  }, [allMyOrders, query, filter]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="رقم الطلب · اسم الزبون · المنطقة..."
          className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
            <X className="w-3 h-3 text-text-muted" />
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5">
        {([
          { id: "all",       label: "الكل" },
          { id: "delivered", label: "مكتمل" },
          { id: "cancelled", label: "ملغي" },
        ] as { id: typeof filter; label: string }[]).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("flex-1 py-1.5 rounded-xl border text-xs font-medium transition-all",
              filter === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState icon={<Package className="w-8 h-8" />} title="لا توجد طلبات" description="لا توجد طلبات في هذه الفترة" />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-text-muted">{results.length} طلب</p>
          {results.map(o => <OrderArchiveCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}

function AccountingTab({ myOrders }: { myOrders: LiveOrder[] }) {
  const [settlementsOpen, setSettlementsOpen] = useState(false);

  const deliveredOrders = myOrders.filter(o => o.status === "delivered");
  const totalFees     = deliveredOrders.reduce((s, o) => s + o.deliveryFee, 0);
  const paidFees      = SETTLEMENTS.reduce((s, s2) => s + s2.amount, 0);
  const pendingFees   = Math.max(totalFees - paidFees + 56, 0); // simulated pending
  const unsettled     = deliveredOrders.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-status-success/5 border border-status-success/20 rounded-2xl p-3.5 col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-status-success" />
            <p className="text-xs text-text-muted">إجمالي رسوم التوصيل المستحقة</p>
          </div>
          <p className="text-3xl font-bold text-status-success">{pendingFees.toFixed(0)} د.ع</p>
          <p className="text-xs text-text-muted mt-1">{unsettled} طلب غير مُسوى</p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-primary">{totalFees.toFixed(0)}</p>
          <p className="text-xs text-text-muted mt-0.5">إجمالي مستحق د.ع</p>
        </div>
        <div className="bg-surface-elevated border border-border rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-text-primary">{paidFees}</p>
          <p className="text-xs text-text-muted mt-0.5">مسدّد د.ع</p>
        </div>
      </div>

      {/* Note */}
      <div className="bg-status-info/5 border border-status-info/20 rounded-xl px-3 py-2.5 text-xs text-status-info flex items-start gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        رسوم التوصيل تعود إليك بالكامل ولا تدخل في إيرادات المطعم
      </div>

      {/* Settlement history */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setSettlementsOpen(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-elevated transition-colors"
        >
          <span className="text-sm font-semibold text-text-primary">سجل التسويات ({SETTLEMENTS.length})</span>
          {settlementsOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </button>

        {settlementsOpen && (
          <div className="border-t border-border divide-y divide-border">
            {SETTLEMENTS.map(s => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{s.id}</p>
                  <p className="text-xs text-text-muted">{timeLabel(s.date)} · {s.orders} طلب · {s.method}</p>
                </div>
                <span className="text-sm font-bold text-status-success">{s.amount} د.ع</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ArchivePage() {
  const { orders } = useOrders();
  const { profile } = useAuth();
  const driverId = profile?.uid ?? "mock-delivery-001";
  const [tab, setTab] = useState<Tab>("orders");

  const myOrders = useMemo(
    () => orders.filter(o => o.driverId === driverId || o.driverId === "mock-delivery-001"),
    [orders, driverId]
  );

  return (
    <div className="flex flex-col gap-0">
      {/* Tabs */}
      <div className="flex gap-2 bg-surface-elevated rounded-xl mx-4 mt-4 p-1">
        {([
          { id: "orders",     label: "السجل" },
          { id: "accounting", label: "المحاسبة" },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === t.id ? "bg-surface text-text-primary shadow-card" : "text-text-muted"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-6">
        {tab === "orders" ? <OrdersTab myOrders={myOrders} /> : <AccountingTab myOrders={myOrders} />}
      </div>
    </div>
  );
}
