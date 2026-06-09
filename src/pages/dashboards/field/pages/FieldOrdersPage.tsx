import { useState, useMemo } from "react";
import { Search, X, CheckCircle2, Package } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/[ىئ]/g, "ي").toLowerCase().trim();
}

export function FieldOrdersPage() {
  const [query, setQuery]       = useState("");
  const [zoneFilter, setZone]   = useState("all");
  const [selected, setSelected] = useState<LiveOrder | null>(null);

  const { orders } = useOrders();

  // Only ready delivery orders
  const readyOrders = useMemo(
    () => orders.filter(o => o.type === "delivery" && o.status === "ready"),
    [orders]
  );

  const zones = useMemo(
    () => [...new Set(readyOrders.map(o => o.zone).filter(Boolean))] as string[],
    [readyOrders]
  );

  const results = useMemo(() => {
    const q = normalizeAr(query);
    return readyOrders.filter(o => {
      if (zoneFilter !== "all" && o.zone !== zoneFilter) return false;
      if (!q) return true;
      return (
        String(o.orderNumber ?? "").includes(query) ||
        normalizeAr(o.customerName ?? "").includes(q) ||
        (o.customerPhone ?? "").includes(query) ||
        normalizeAr(o.deliveryAddress ?? "").includes(q)
      );
    }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [readyOrders, query, zoneFilter]);

  return (
    <div className="flex flex-col gap-0 pb-6">

      {/* ── Header bar ── */}
      <div className="px-4 pt-3 pb-3 border-b border-border bg-surface flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-success" />
          <span className="text-sm font-bold text-text-primary">جاهزة للتوصيل</span>
          <span className="text-xs font-bold text-status-success bg-status-success/10 rounded-full px-2 py-0.5 border border-status-success/20">
            {readyOrders.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="رقم الطلب · اسم الزبون · هاتف..."
            className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
              <X className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>

        {/* Zone filter */}
        {zones.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setZone("all")}
              className={cn("shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                zoneFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
              )}>
              كل المناطق
            </button>
            {zones.map(z => (
              <button key={z} onClick={() => setZone(z)}
                className={cn("shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                  zoneFilter === z ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
                )}>
                {z}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div className="px-4 pt-3 flex flex-col gap-2">
        {results.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="لا توجد طلبات جاهزة"
            description="ستظهر هنا الطلبات الجاهزة للتوصيل"
          />
        ) : (
          results.map(o => <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />)
        )}
      </div>

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
