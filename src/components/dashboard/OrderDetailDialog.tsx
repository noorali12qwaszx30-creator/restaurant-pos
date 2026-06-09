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
    tax: number;
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-bold num">
              {order.orderNumber ?? order.id.slice(0, 4)}
            </span>
            <DialogTitle>طلب #{order.orderNumber ?? order.id.slice(0, 6)}</DialogTitle>
            <StatusBadge status={order.status} />
            <OrderTypeBadge type={order.type} />
          </div>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-3 p-4">
          {/* Info row */}
          <div className="flex flex-wrap gap-2">
            {order.tableNumber && (
              <div className="flex items-center gap-1.5 bg-surface-elevated rounded-lg px-2.5 py-1.5 border border-border">
                <MapPin className="w-3 h-3 text-primary shrink-0" />
                <span className="text-xs text-text-secondary">طاولة {order.tableNumber}</span>
              </div>
            )}
            {order.customerName && (
              <div className="flex items-center gap-1.5 bg-surface-elevated rounded-lg px-2.5 py-1.5 border border-border">
                <User className="w-3 h-3 text-text-muted shrink-0" />
                <span className="text-xs text-text-secondary">{order.customerName}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center gap-1.5 bg-surface-elevated rounded-lg px-2.5 py-1.5 border border-border">
                <Phone className="w-3 h-3 text-text-muted shrink-0" />
                <span className="text-xs text-text-secondary" dir="ltr">{order.customerPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-surface-elevated rounded-lg px-2.5 py-1.5 border border-border">
              <Clock className="w-3 h-3 text-text-muted shrink-0" />
              <span className="text-xs text-text-secondary">
                {order.createdAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="flex items-start gap-2 bg-surface-elevated rounded-xl px-3 py-2 border border-border">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-text-secondary leading-relaxed">{order.deliveryAddress}</span>
            </div>
          )}

          {order.notes && (
            <div className="flex items-start gap-2 bg-status-warning/8 border border-status-warning/25 rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold text-status-warning shrink-0 mt-0.5">ملاحظة:</span>
              <span className="text-xs text-text-secondary leading-relaxed">{order.notes}</span>
            </div>
          )}

          {/* Items */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-3 py-1.5 bg-surface-elevated border-b border-border">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">الأصناف</span>
            </div>
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-border/50 last:border-0">
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
          <div className="bg-surface-elevated rounded-xl border border-border px-3 py-2 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>المجموع الفرعي</span>
              <span className="num">{order.subtotal.toFixed(1)} د.ع</span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>ضريبة (15%)</span>
              <span className="num">{order.tax.toFixed(1)} د.ع</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-text-primary pt-1.5 border-t border-border">
              <span>الإجمالي</span>
              <span className="text-primary num">{order.total.toFixed(1)} د.ع</span>
            </div>
          </div>

          {extraActions && (
            <div className="flex flex-col gap-2">{extraActions}</div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
