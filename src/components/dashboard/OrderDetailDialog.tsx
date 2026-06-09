import { MapPin, Phone, Clock, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { StatusBadge, OrderTypeBadge } from "./StatusBadge";
// Accept both legacy mock Order and LiveOrder from OrderContext
interface OrderDetailDialogProps {
  order: {
    id: string;
    type: string;
    status: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    notes?: string;
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
    subtotal: number;
    deliveryFee?: number;
    total: number;
    createdAt: Date;
    tableNumber?: number;
    orderNumber?: number;
  } | null;
  onClose: () => void;
  extraActions?: React.ReactNode;
}

export function OrderDetailDialog({ order, onClose, extraActions }: OrderDetailDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader onClose={onClose}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-bold num">
                {order.orderNumber ?? order.id.slice(0, 4)}
              </span>
              <DialogTitle>طلب #{order.orderNumber ?? order.id.slice(0, 6)}</DialogTitle>
              <StatusBadge status={order.status} />
              <OrderTypeBadge type={order.type} />
            </div>
            {extraActions && (
              <div className="flex flex-col gap-1.5">{extraActions}</div>
            )}
          </div>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-2.5 p-3">
          {/* Info chips */}
          <div className="flex flex-wrap gap-1.5">
            {order.tableNumber && (
              <span className="flex items-center gap-1 bg-surface-elevated rounded-lg px-2 py-1 border border-border text-xs text-text-secondary">
                <MapPin className="w-3 h-3 text-primary" /> طاولة {order.tableNumber}
              </span>
            )}
            {order.customerName && (
              <span className="flex items-center gap-1 bg-surface-elevated rounded-lg px-2 py-1 border border-border text-xs text-text-secondary">
                <User className="w-3 h-3 text-text-muted" /> {order.customerName}
              </span>
            )}
            {order.customerPhone && (
              <span className="flex items-center gap-1 bg-surface-elevated rounded-lg px-2 py-1 border border-border text-xs text-text-secondary" dir="ltr">
                <Phone className="w-3 h-3 text-text-muted" /> {order.customerPhone}
              </span>
            )}
            <span className="flex items-center gap-1 bg-surface-elevated rounded-lg px-2 py-1 border border-border text-xs text-text-secondary">
              <Clock className="w-3 h-3 text-text-muted" />
              {order.createdAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {order.deliveryAddress && (
            <div className="flex items-start gap-1.5 bg-surface-elevated rounded-lg px-2.5 py-1.5 border border-border">
              <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-text-secondary">{order.deliveryAddress}</span>
            </div>
          )}

          {order.notes && (
            <div className="flex items-start gap-1.5 bg-status-warning/8 border border-status-warning/25 rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] font-bold text-status-warning shrink-0">ملاحظة:</span>
              <span className="text-xs text-text-secondary">{order.notes}</span>
            </div>
          )}

          {/* Items */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-3 py-1 bg-surface-elevated border-b border-border">
              <span className="text-[10px] font-bold text-text-muted">الأصناف ({order.items.length})</span>
            </div>
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 h-8 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 num">
                    {item.quantity}
                  </span>
                  <span className="text-xs text-text-secondary">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-text-primary num">
                  {(item.unitPrice * item.quantity).toFixed(1)} د.ع
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-surface-elevated rounded-xl border border-border px-3 py-2 flex flex-col gap-1">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>المجموع الفرعي</span>
              <span className="num">{order.subtotal.toFixed(1)} د.ع</span>
            </div>
            {(order.deliveryFee ?? 0) > 0 && (
              <div className="flex justify-between text-xs text-status-info">
                <span>رسوم التوصيل</span>
                <span className="num">{(order.deliveryFee ?? 0).toFixed(1)} د.ع</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-text-primary pt-1.5 border-t border-border mt-0.5">
              <span>الإجمالي</span>
              <span className="text-primary num">{order.total.toFixed(1)} د.ع</span>
            </div>
          </div>

        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
