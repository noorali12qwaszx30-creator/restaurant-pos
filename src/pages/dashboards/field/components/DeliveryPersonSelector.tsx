import { useState } from "react";
import { X, Check, ChevronDown, CheckCircle2, Clock, Package } from "lucide-react";
import { useDrivers, type Driver } from "@/hooks/useDrivers";
import { cn } from "@/lib/utils";

// Alias for badge type compatibility
type DeliveryDriver = Driver;

interface Props {
  orderId: string;
  currentDriverId?: string;
  currentDriverName?: string;
  onAssign: (driverId: string, driverName: string) => void;
}

function lastActiveLabel(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `آخر نشاط ${m} د` : `آخر نشاط ${Math.floor(m / 60)} س`;
}

function DriverStatusBadge({ status }: { status: DeliveryDriver["status"] }) {
  const cfg = {
    available: { label: "متاح",      cls: "bg-status-success/10 text-status-success border-status-success/20" },
    busy:      { label: "مشغول",     cls: "bg-status-warning/10 text-status-warning border-status-warning/20" },
    offline:   { label: "غير متاح",  cls: "bg-border text-text-muted border-border" },
  }[status];
  return (
    <span className={cn("text-[10px] font-medium border rounded-full px-1.5 py-0.5 leading-none", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

export function DeliveryPersonSelector({ orderId: _orderId, currentDriverId, currentDriverName, onAssign }: Props) {
  const { drivers } = useDrivers();
  const [open, setOpen] = useState(false);
  const [tentative, setTentative] = useState<string | null>(null);

  function handleSelect(driverId: string) {
    setTentative((prev) => (prev === driverId ? null : driverId));
  }

  function handleConfirm() {
    if (!tentative) return;
    const drv = drivers.find((d) => d.id === tentative);
    if (!drv) return;
    onAssign(drv.id, drv.name);
    setOpen(false);
    setTentative(null);
  }

  function handleOpen() {
    setOpen(true);
    setTentative(null);
  }

  // Not open → show trigger button / assigned chip
  if (!open) {
    if (currentDriverId && currentDriverName) {
      return (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">{currentDriverName}</p>
              <p className="text-[10px] text-text-muted">السائق المعيّن</p>
            </div>
          </div>
          <button
            onClick={handleOpen}
            className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1.5 hover:bg-primary/15 transition-all flex items-center gap-1"
          >
            <ChevronDown className="w-3 h-3" />
            إعادة التعيين
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleOpen}
        className="mt-3 w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-[0.98] transition-all shadow-card"
      >
        <Package className="w-4 h-4" />
        تعيين سائق
      </button>
    );
  }

  // Open → show inline driver list
  return (
    <div className="mt-3 border-t border-border pt-3 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-primary">اختر السائق</p>
        <button
          onClick={() => { setOpen(false); setTentative(null); }}
          className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted hover:bg-border transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Driver rows */}
      <div className="flex flex-col gap-1">
        {drivers.map((drv) => {
          const isSelected = tentative === drv.id;
          const isCurrentlyAssigned = drv.id === currentDriverId;
          const isOffline = drv.status === "offline";

          return (
            <div key={drv.id} className="flex flex-col">
              <button
                onClick={() => !isOffline && handleSelect(drv.id)}
                disabled={isOffline}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-start transition-all",
                  isSelected
                    ? "border-primary bg-primary/8 ring-1 ring-primary/20"
                    : isCurrentlyAssigned
                    ? "border-primary/30 bg-primary/5"
                    : isOffline
                    ? "border-border bg-surface-elevated opacity-50 cursor-not-allowed"
                    : "border-border bg-surface hover:bg-surface-elevated hover:border-primary/30"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-surface-elevated text-text-secondary"
                )}>
                  {drv.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-text-primary leading-none">{drv.name}</span>
                    {isCurrentlyAssigned && (
                      <span className="text-[10px] text-primary font-medium">(الحالي)</span>
                    )}
                    <DriverStatusBadge status={drv.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                      <Package className="w-2.5 h-2.5" />
                      {drv.currentOrders} طلب
                    </span>
                    <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {lastActiveLabel(drv.lastActivity)}
                    </span>
                  </div>
                </div>

                {/* Check indicator */}
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>

              {/* Confirm / Cancel inline under selected driver */}
              {isSelected && (
                <div className="flex gap-2 px-1 pt-1.5 pb-1">
                  <button
                    onClick={handleConfirm}
                    className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-[0.97] transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    تأكيد التعيين
                  </button>
                  <button
                    onClick={() => setTentative(null)}
                    className="px-4 h-9 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-elevated transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
