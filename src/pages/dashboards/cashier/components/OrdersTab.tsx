import { useState, useMemo } from "react";
import { Search, CreditCard, Pencil } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { PaymentDialog } from "./PaymentDialog";
import { EditOrderDialog, canEdit } from "./EditOrderDialog";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

const FILTERS = [
  { value: "all",      label: "الكل" },
  { value: "dine_in",  label: "داخلي" },
  { value: "takeaway", label: "سفري" },
  { value: "delivery", label: "توصيل" },
];

export function OrdersTab() {
  const { orders } = useOrders();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<LiveOrder | null>(null);
  const [paying,   setPaying]   = useState<LiveOrder | null>(null);
  const [editing,  setEditing]  = useState<LiveOrder | null>(null);

  const filtered = useMemo(() => orders.filter((o) => {
    const matchType = typeFilter === "all" || o.type === typeFilter;
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName ?? "").includes(search);
    return matchType && matchSearch;
  }), [orders, search, typeFilter]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="بحث بالرقم أو الاسم..." className="flex-1" />
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-36">
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 flex-wrap">
        {(["pending","preparing","ready","delivering","delivered"] as const).map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <div key={s} className="flex items-center gap-1.5 bg-surface-elevated rounded-full px-3 py-1 border border-border">
              <StatusBadge status={s} />
              <span className="text-xs font-medium text-text-primary">{count}</span>
            </div>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Search className="w-8 h-8" />} title="لا توجد طلبات" description="لا توجد نتائج للبحث الحالي" />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => setSelected(order)} />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <OrderDetailDialog
        order={selected}
        onClose={() => setSelected(null)}
        extraActions={
          selected ? (
            <div className="flex flex-col gap-2">
              {canEdit(selected) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setEditing(selected); setSelected(null); }}
                >
                  <Pencil className="w-4 h-4" /> تعديل الطلب
                </Button>
              )}
              {!["delivered", "cancelled"].includes(selected.status) && (
                <Button
                  className="w-full"
                  onClick={() => { setPaying(selected); setSelected(null); }}
                >
                  <CreditCard className="w-4 h-4" /> تسوية الدفع
                </Button>
              )}
            </div>
          ) : null
        }
      />

      {/* Edit Dialog */}
      <EditOrderDialog order={editing} onClose={() => setEditing(null)} />

      {/* Payment Dialog */}
      <PaymentDialog
        order={paying}
        onClose={() => setPaying(null)}
        onConfirm={() => setPaying(null)}
      />
    </div>
  );
}
