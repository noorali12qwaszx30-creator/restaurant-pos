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
            <DialogTitle>{order.id}</DialogTitle>
            <StatusBadge status={order.status} />
            <OrderTypeBadge type={order.type} />
          </div>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            {order.tableNumber && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <MapPin className="w-4 h-4 text-text-muted" />
                <span>طاولة {order.tableNumber}</span>
              </div>
            )}
            {order.customerName && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <User className="w-4 h-4 text-text-muted" />
                <span>{order.customerName}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Phone className="w-4 h-4 text-text-muted" />
                <span dir="ltr">{order.customerPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock className="w-4 h-4 text-text-muted" />
              <span>{order.createdAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="bg-surface-elevated rounded-xl p-3 text-sm text-text-secondary">
              <p className="text-xs text-text-muted mb-1">عنوان التوصيل</p>
              {order.deliveryAddress}
            </div>
          )}

          {order.notes && (
            <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-3 text-sm text-text-secondary">
              <p className="text-xs text-status-warning mb-1">ملاحظات</p>
              {order.notes}
            </div>
          )}

          <Separator />

          {/* Items */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text-primary">الأصناف</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  {item.name}
                  <span className="text-text-muted ms-1">×{item.quantity}</span>
                </span>
                <span className="text-text-primary font-medium">{(item.unitPrice * item.quantity).toFixed(1)} د.ع</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>المجموع الفرعي</span>
              <span>{order.subtotal.toFixed(1)} د.ع</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>ضريبة القيمة المضافة (15%)</span>
              <span>{order.tax.toFixed(1)} د.ع</span>
            </div>
            <div className="flex justify-between text-base font-bold text-text-primary mt-1 pt-1 border-t border-border">
              <span>الإجمالي</span>
              <span className="text-primary">{order.total.toFixed(1)} د.ع</span>
            </div>
          </div>

          {extraActions && <div className="flex flex-col gap-2 mt-2">{extraActions}</div>}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
