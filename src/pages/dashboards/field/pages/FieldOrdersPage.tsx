import { useState, useMemo } from "react";
import { Search, X, AlertTriangle, Package } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { MOCK_DRIVERS } from "@/data/mock-drivers";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { cn } from "@/lib/utils";

function waitedMin(d: Date) { return Math.floor((Date.now() - d.getTime()) / 60000); }
function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/[ىئ]/g, "ي").toLowerCase().trim();
}

type ZoneFilter   = "all" | string;
type DriverFilter = "all" | string;
type StatusFilter = "all" | "ready" | "delivering";

export function FieldOrdersPage() {
  const [query, setQuery]           = useState("");
  const [zoneFilter, setZone]       = useState<ZoneFilter>("all");
  const [driverFilter, setDriver]   = useState<DriverFilter>("all");
  const [statusFilter, setStatus]   = useState<StatusFilter>("all");
  const [selected, setSelected]     = useState<LiveOrder | null>(null);

  const { orders } = useOrders();

  // All active delivery orders (field relevant)
  const fieldOrders = useMemo(
    () => orders.filter(o => o.type === "delivery" && !["cancelled", "delivered"].includes(o.status)),
    [orders]
  );

  // Delayed section — sorted most delayed first
  const delayedOrders = useMemo(
    () => [...fieldOrders].filter(o => waitedMin(o.createdAt) >= 15)
           .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [fieldOrders]
  );

  const zones = useMemo(() => [...new Set(fieldOrders.map(o => o.zone).filter(Boolean))] as string[], [fieldOrders]);
  // Build driver list from active orders (driverId/driverName pairs)
  const drivers = useMemo(() => {
    const seen = new Map<string, string>();
    fieldOrders.forEach(o => { if (o.driverId && o.driverName) seen.set(o.driverId, o.driverName); });
    // Also include mock drivers for dev mode
    MOCK_DRIVERS.filter(d => d.status !== "offline").forEach(d => { if (!seen.has(d.id)) seen.set(d.id, d.name); });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [fieldOrders]);

  const results = useMemo(() => {
    const q = normalizeAr(query);
    return fieldOrders.filter(o => {
      if (zoneFilter !== "all"   && o.zone !== zoneFilter) return false;
      if (driverFilter !== "all" && o.driverId !== driverFilter) return false;
      if (statusFilter === "ready"     && o.status !== "ready")     return false;
      if (statusFilter === "delivering" && o.status !== "delivering") return false;
      if (!q) return true;
      return (
        normalizeAr(o.id).includes(q) ||
        normalizeAr(o.customerName ?? "").includes(q) ||
        (o.customerPhone ?? "").includes(query) ||
        normalizeAr(o.driverName ?? "").includes(q)
      );
    }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [fieldOrders, query, zoneFilter, driverFilter, statusFilter]);

  const hasFilters = query || zoneFilter !== "all" || driverFilter !== "all" || statusFilter !== "all";

  return (
    <div className="flex flex-col gap-0 pb-6">

      {/* ── Delayed orders strip ── */}
      {delayedOrders.length > 0 && !hasFilters && (
        <section className="px-4 pt-3 pb-4 border-b border-border bg-status-warning/5">
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            <h2 className="text-sm font-bold text-text-primary">طلبات متأخرة</h2>
            <span className="text-xs font-bold text-status-warning bg-status-warning/10 rounded-full px-2 py-0.5 border border-status-warning/20">
              {delayedOrders.length}
            </span>
          </div>

          {/* Delay legend */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {[
              { label: "تحذير ≥15د", cls: "text-status-warning bg-status-warning/10 border-status-warning/20" },
              { label: "خطر ≥25د",   cls: "text-status-error  bg-status-error/10  border-status-error/20"  },
              { label: "حرج ≥40د",   cls: "text-status-error  bg-status-error/15  border-status-error/30"  },
            ].map(l => (
              <span key={l.label} className={cn("text-[10px] font-medium border rounded-full px-2 py-0.5", l.cls)}>{l.label}</span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {delayedOrders.map(o => (
              <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Search + filters ── */}
      <div className="px-4 pt-3 pb-3 border-b border-border bg-surface flex flex-col gap-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="رقم الطلب · اسم الزبون · السائق..."
            className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
              <X className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {([
            { id: "all",        label: "الكل" },
            { id: "ready",      label: "جاهز" },
            { id: "delivering", label: "في الطريق" },
          ] as { id: StatusFilter; label: string }[]).map(s => (
            <button key={s.id} onClick={() => setStatus(s.id)}
              className={cn("shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                statusFilter === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
              )}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Zone + Driver filters */}
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

        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setDriver("all")}
            className={cn("shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
              driverFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
            )}>
            كل السائقين
          </button>
          {drivers.map(d => (
            <button key={d.id} onClick={() => setDriver(d.id)}
              className={cn("shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                driverFilter === d.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
              )}>
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="px-4 pt-3 flex flex-col gap-2">
        <p className="text-xs text-text-muted">{results.length} طلب</p>
        {results.length === 0 ? (
          <EmptyState icon={<Package className="w-8 h-8" />} title="لا توجد طلبات" description="جرّب تغيير الفلاتر أو البحث" />
        ) : (
          results.map(o => <OrderCard key={o.id} order={o} onClick={() => setSelected(o)} />)
        )}
      </div>

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
