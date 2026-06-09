import { useState } from "react";
import { CreditCard, Banknote, SplitSquareHorizontal, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type PaymentMethod = "cash" | "card" | "split";
import type { LiveOrder } from "@/contexts/OrderContext";
import { cn } from "@/lib/utils";

const METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: "cash",  label: "نقدي",     icon: <Banknote className="w-5 h-5" /> },
  { id: "card",  label: "بطاقة",    icon: <CreditCard className="w-5 h-5" /> },
  { id: "split", label: "مقسّم",    icon: <SplitSquareHorizontal className="w-5 h-5" /> },
];

interface PaymentDialogProps {
  order: LiveOrder | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function PaymentDialog({ order, onClose, onConfirm }: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [done, setDone] = useState(false);

  if (!order) return null;

  const change = method === "cash" && cashReceived
    ? parseFloat(cashReceived) - order.total
    : 0;

  const handleConfirm = () => {
    setDone(true);
    setTimeout(() => {
      setDone(false);
      onConfirm();
    }, 1500);
  };

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader onClose={onClose}>
          <DialogTitle>تسوية الدفع — #{order.orderNumber ?? order.id.slice(0,6)}</DialogTitle>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-5">
          {done ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-status-success/15 flex items-center justify-center">
                <Check className="w-8 h-8 text-status-success" />
              </div>
              <p className="text-base font-semibold text-text-primary">تم الدفع بنجاح</p>
            </div>
          ) : (
            <>
              {/* Total */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
                <p className="text-xs text-text-muted mb-1">المبلغ المستحق</p>
                <p className="text-3xl font-bold text-primary">{order.total.toFixed(1)} د.ع</p>
              </div>

              {/* Method */}
              <div className="flex flex-col gap-2">
                <Label>طريقة الدفع</Label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
                        method === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface-elevated text-text-muted hover:border-border/60"
                      )}
                    >
                      {m.icon}
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash received */}
              {method === "cash" && (
                <div className="flex flex-col gap-1.5">
                  <Label>المبلغ المستلم</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    dir="ltr"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                  />
                  {cashReceived && change >= 0 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-text-muted">الباقي للعميل</span>
                      <span className="font-bold text-status-success">{change.toFixed(1)} د.ع</span>
                    </div>
                  )}
                  {cashReceived && change < 0 && (
                    <p className="text-xs text-status-error">المبلغ المستلم أقل من المطلوب</p>
                  )}
                </div>
              )}

              {/* Items summary */}
              <div className="bg-surface-elevated rounded-xl p-3 flex flex-col gap-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-text-secondary">
                    <span>{item.name} ×{item.quantity}</span>
                    <span>{(item.unitPrice * item.quantity).toFixed(1)} د.ع</span>
                  </div>
                ))}
                <div className="border-t border-border mt-1.5 pt-1.5 flex justify-between text-xs font-medium text-text-primary">
                  <span>الضريبة 15%</span><span>{order.tax.toFixed(1)} د.ع</span>
                </div>
              </div>
            </>
          )}
        </DialogBody>

        {!done && (
          <DialogFooter>
            <Button variant="outline" className="flex-1" onClick={onClose}>إلغاء</Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={method === "cash" && (!cashReceived || change < 0)}
            >
              تأكيد الدفع
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
