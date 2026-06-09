import { MapPin, Phone, Clock, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { StatusBadge, OrderTypeBadge } from "./StatusBadge";
import { Separator } from "@/components/ui/separator";
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

        <DialogBody className="flex flex-col gap-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {order.tableNumber && (
              <div className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2.5 border border-border">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-sm text-text-secondary">طاولة {order.tableNumber}</span>
              </div>
            )}
            {order.customerName && (
              <div className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2.5 border border-border">
                <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-sm text-text-secondary truncate">{order.customerName}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2.5 border border-border">
                <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-sm text-text-secondary" dir="ltr">{order.customerPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2.5 border border-border">
              <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="text-sm text-text-secondary">
                {order.createdAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="bg-surface-elevated rounded-xl p-3.5 border border-border">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">عنوان التوصيل</p>
              <p className="text-sm text-text-secondary leading-relaxed">{order.deliveryAddress}</p>
            </div>
          )}

          {order.notes && (
            <div className="bg-status-warning/8 border border-status-warning/25 rounded-xl p-3.5">
              <p className="text-[10px] font-semibold text-status-warning uppercase tracking-wide mb-1.5">ملاحظات</p>
              <p className="text-sm text-text-secondary leading-relaxed">{order.notes}</p>
            </div>
          )}

          <Separator />

          {/* Items */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">الأصناف</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 num">
                    {item.quantity}
                  </span>
                  <span className="text-text-secondary">{item.name}</span>
                </div>
                <span className="text-text-primary font-semibold num">
                  {(item.unitPrice * item.quantity).toFixed(1)} د.ع
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>المجموع الفرعي</span>
              <span className="num">{order.subtotal.toFixed(1)} د.ع</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>ضريبة القيمة المضافة (15%)</span>
              <span className="num">{order.tax.toFixed(1)} د.ع</span>
            </div>
            <div className="flex justify-between text-base font-bold text-text-primary mt-1 pt-2 border-t border-border">
              <span>الإجمالي</span>
              <span className="text-primary num">{order.total.toFixed(1)} د.ع</span>
            </div>
          </div>

          {extraActions && (
            <div className="flex flex-col gap-2.5 mt-1">{extraActions}</div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
