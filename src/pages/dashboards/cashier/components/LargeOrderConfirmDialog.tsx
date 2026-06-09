import { AlertTriangle, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  total: number;
  itemCount: number;
  onConfirm: () => void;
}

export function LargeOrderConfirmDialog({ open, onOpenChange, total, itemCount, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>تأكيد الطلب الكبير</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-status-warning/15 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-status-warning" />
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">هذا طلب بقيمة عالية</p>
              <p className="text-sm text-text-muted">يرجى التحقق من البيانات قبل الإرسال</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-surface-elevated border border-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-text-primary">{itemCount}</p>
                <p className="text-xs text-text-muted mt-1">عدد الأصناف</p>
              </div>
              <div className="bg-surface-elevated border border-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary">{total.toFixed(1)}</p>
                <p className="text-xs text-text-muted mt-1">د.ع إجمالي</p>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            مراجعة الطلب
          </Button>
          <Button className="flex-1" onClick={() => { onOpenChange(false); onConfirm(); }}>
            <Check className="w-4 h-4" /> تأكيد الإرسال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
