import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Phone, MessageSquare, RefreshCw, Eye, Bike, MapPin } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

type IssueState = "open" | "resolved" | "watching";

function timeLabel(d: Date) {
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}
function waitedLabel(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `${m} د مضت` : `${Math.floor(m / 60)} س مضى`;
}

function IssueCard({
  order,
  state,
  onAction,
  onView,
}: {
  order: LiveOrder;
  state: IssueState;
  onAction: (action: "resolve" | "watch" | "reassign") => void;
  onView: () => void;
}) {
  const isResolved = state === "resolved";

  return (
    <div className={cn(
      "bg-surface border rounded-2xl overflow-hidden shadow-card transition-all",
      isResolved ? "border-border opacity-60"
      : state === "watching" ? "border-status-warning/40"
      : "border-status-error/40"
    )}>
      {/* Severity bar */}
      {!isResolved && (
        <div className={cn("h-1", state === "watching" ? "bg-status-warning" : "bg-status-error")} />
      )}

      <div className="p-3 flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-text-primary">{order.id}</span>
            {isResolved ? (
              <span className="text-[10px] font-medium bg-status-success/10 text-status-success border border-status-success/20 rounded-full px-2 py-0.5 inline-flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> تم الحل</span>
            ) : state === "watching" ? (
              <span className="text-[10px] font-medium bg-status-warning/10 text-status-warning border border-status-warning/20 rounded-full px-2 py-0.5 inline-flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> متابعة</span>
            ) : (
              <span className="text-[10px] font-bold bg-status-error/10 text-status-error border border-status-error/25 rounded-full px-2 py-0.5 inline-flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> مفتوحة</span>
            )}
          </div>
          <button
            onClick={onView}
            className="text-[10px] text-primary underline underline-offset-2 shrink-0"
          >
            تفاصيل الطلب
          </button>
        </div>

        {/* Issue reason */}
        <div className="flex items-start gap-2 bg-status-error/5 border border-status-error/15 rounded-xl px-3 py-2.5">
          <AlertTriangle className="w-4 h-4 text-status-error shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary leading-snug">{order.issueReason}</p>
            {order.updatedAt && (
              <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                أُبلغ {timeLabel(order.updatedAt)} · {waitedLabel(order.updatedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-text-muted">
          {order.customerName && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />{order.customerName} · {order.customerPhone}
            </span>
          )}
          {order.driverName && (
            <span className="flex items-center gap-1">
              <Bike className="w-3 h-3 inline-block mr-0.5" /> {order.driverName}
            </span>
          )}
          {order.zone && (
            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {order.zone}</span>
          )}
        </div>

        {/* Actions */}
        {!isResolved && (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => onAction("resolve")}
              className="h-9 rounded-xl bg-status-success/10 text-status-success border border-status-success/20 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-status-success/15 transition-all active:scale-[0.97]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              تم الحل
            </button>
            <button
              onClick={() => onAction("watch")}
              className={cn(
                "h-9 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]",
                state === "watching"
                  ? "bg-status-warning/10 text-status-warning border-status-warning/20"
                  : "bg-surface-elevated text-text-muted border-border hover:bg-surface"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              {state === "watching" ? "قيد المتابعة" : "متابعة لاحقاً"}
            </button>
            <button
              onClick={() => onAction("reassign")}
              className="h-9 rounded-xl bg-primary/8 text-primary border border-primary/20 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/12 transition-all active:scale-[0.97]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة تعيين سائق
            </button>
            <button
              onClick={() => {
                const phone = order.driverName ? "0500000000" : "";
                if (phone) window.open(`tel:${phone}`);
              }}
              className="h-9 rounded-xl bg-status-info/8 text-status-info border border-status-info/20 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-status-info/12 transition-all active:scale-[0.97]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              التواصل مع السائق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FieldIssuesPage() {
  const { orders } = useOrders();
  const [issueStates, setIssueStates] = useState<Record<string, IssueState>>({});
  const [selected, setSelected] = useState<LiveOrder | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const ordersWithIssues = orders.filter(o => o.hasIssue);

  const openIssues     = ordersWithIssues.filter(o => (issueStates[o.id] ?? "open") !== "resolved");
  const resolvedIssues = ordersWithIssues.filter(o => issueStates[o.id] === "resolved");

  function handleAction(orderId: string, action: "resolve" | "watch" | "reassign") {
    if (action === "resolve") {
      setIssueStates(prev => ({ ...prev, [orderId]: "resolved" }));
    } else if (action === "watch") {
      setIssueStates(prev => ({
        ...prev,
        [orderId]: prev[orderId] === "watching" ? "open" : "watching",
      }));
    } else if (action === "reassign") {
      alert("سيتم توجيهك لإعادة تعيين السائق"); // placeholder
    }
  }

  return (
    <div className="flex flex-col gap-0 pb-6">

      {/* ── Header summary ── */}
      <div className="px-4 pt-3 pb-3 border-b border-border">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-status-error/5 border border-status-error/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-status-error">{openIssues.length}</p>
            <p className="text-xs text-text-muted mt-0.5">مشاكل مفتوحة</p>
          </div>
          <div className="bg-status-success/5 border border-status-success/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-status-success">{resolvedIssues.length}</p>
            <p className="text-xs text-text-muted mt-0.5">تم حلها</p>
          </div>
        </div>
      </div>

      {/* ── Open issues ── */}
      <section className="px-4 pt-4 flex flex-col gap-3">
        {openIssues.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="w-8 h-8" />} title="لا توجد مشاكل مفتوحة" description="جميع المشاكل المبلّغ عنها تم حلها" />
        ) : (
          openIssues.map(o => (
            <IssueCard
              key={o.id}
              order={o}
              state={issueStates[o.id] ?? "open"}
              onAction={(action) => handleAction(o.id, action)}
              onView={() => setSelected(o)}
            />
          ))
        )}
      </section>

      {/* ── Resolved issues (collapsible) ── */}
      {resolvedIssues.length > 0 && (
        <section className="px-4 pt-4 border-t border-border mt-4">
          <button
            onClick={() => setShowResolved(p => !p)}
            className="flex items-center gap-2 mb-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-status-success" />
            محلولة ({resolvedIssues.length})
            <span className="text-xs text-text-muted">{showResolved ? "▲" : "▼"}</span>
          </button>
          {showResolved && (
            <div className="flex flex-col gap-3">
              {resolvedIssues.map(o => (
                <IssueCard
                  key={o.id}
                  order={o}
                  state="resolved"
                  onAction={() => {}}
                  onView={() => setSelected(o)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
