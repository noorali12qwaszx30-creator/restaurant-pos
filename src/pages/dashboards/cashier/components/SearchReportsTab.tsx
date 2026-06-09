import { useState, useMemo } from "react";
import { Search, X, List, UtensilsCrossed, ShoppingBag, Bike } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { StatusBadge, OrderTypeBadge } from "@/components/dashboard/StatusBadge";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | string;
type TypeFilter   = "all" | string;

function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/[ىئ]/g, "ي").toLowerCase().trim();
}

function timeAgo(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `${m} د` : `${Math.floor(m / 60)} س`;
}

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all",        label: "كل الحالات" },
  { id: "pending",    label: "انتظار" },
  { id: "preparing",  label: "تحضير" },
  { id: "ready",      label: "جاهز" },
  { id: "delivering", label: "جاري التوصيل" },
  { id: "delivered",  label: "تم التوصيل" },
  { id: "cancelled",  label: "ملغي" },
];

const TYPE_FILTERS: { id: TypeFilter; label: string; Icon: React.ElementType }[] = [
  { id: "all",      label: "كل الأنواع", Icon: List            },
  { id: "dine_in",  label: "داخلي",      Icon: UtensilsCrossed },
  { id: "takeaway", label: "سفري",        Icon: ShoppingBag    },
  { id: "delivery", label: "توصيل",       Icon: Bike           },
];

export function SearchReportsTab() {
  const { orders } = useOrders();
  const [query, setQuery]         = useState("");
  const [statusFilter, setStatus] = useState<StatusFilter>("all");
  const [typeFilter, setType]     = useState<TypeFilter>("all");
  const [selected, setSelected]   = useState<LiveOrder | null>(null);

  const results = useMemo(() => {
    const q = normalizeAr(query);
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (typeFilter   !== "all" && o.type   !== typeFilter)   return false;
      if (!q) return true;
      return (
        normalizeAr(o.id).includes(q) ||
        String(o.orderNumber ?? "").includes(query) ||
        normalizeAr(o.customerName ?? "").includes(q) ||
        (o.customerPhone ?? "").includes(query) ||
        normalizeAr(o.deliveryAddress ?? "").includes(q)
      );
    });
  }, [orders, query, statusFilter, typeFilter]);

  const hasFilters = statusFilter !== "all" || typeFilter !== "all";

  return (
    <div className="flex flex-col gap-0">

      {/* ── Search bar ── */}
      <div className="px-4 pt-3 pb-3 border-b border-border bg-surface">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="رقم الطلب · اسم الزبون · هاتف · عنوان..."
            autoFocus
            className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center"
            >
              <X className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter: type ── */}
      <div className="border-b border-border bg-surface">
        <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                typeFilter === t.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface-elevated border-border text-text-muted hover:bg-surface"
              )}
            >
              <t.Icon className="w-3 h-3" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter: status ── */}
      <div className="border-b border-border bg-surface">
        <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                statusFilter === s.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface-elevated border-border text-text-muted hover:bg-surface"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="px-4 py-3 flex flex-col gap-2 pb-6">
        {(query || hasFilters) && (
          <p className="text-xs text-text-muted">{results.length} نتيجة</p>
        )}

        {results.length === 0 && (query || hasFilters) ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="لا توجد نتائج" description="جرّب بحثاً مختلفاً أو غيّر التصنيف" />
        ) : results.length === 0 ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="ابحث عن طلب" description="اكتب رقم الطلب أو اسم الزبون أو الهاتف" />
        ) : (
          results.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o)}
              className="w-full text-start bg-surface border border-border rounded-2xl p-3 flex items-center gap-3 hover:bg-surface-elevated transition-all active:scale-[0.99]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-bold num shrink-0">
                    {o.orderNumber ?? o.id.slice(0, 4)}
                  </span>
                  <StatusBadge status={o.status} />
                  <OrderTypeBadge type={o.type} />
                </div>
                {o.customerName && (
                  <p className="text-xs text-text-muted truncate">{o.customerName} · {o.customerPhone}</p>
                )}
                <p className="text-xs text-text-muted line-clamp-1">
                  {o.items.map((i) => i.name).join(" · ")}
                </p>
              </div>
              <div className="shrink-0 text-left flex flex-col items-end gap-0.5">
                <span className="text-sm font-bold text-primary">{o.total.toFixed(1)} د.ع</span>
                <span className="text-xs text-text-muted">{timeAgo(o.createdAt)}</span>
              </div>
            </button>
          ))
        )}
      </div>

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
