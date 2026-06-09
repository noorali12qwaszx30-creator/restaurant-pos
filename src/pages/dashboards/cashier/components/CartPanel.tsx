import { useState } from "react";
import { Trash2, MessageSquare, Plus, Minus, ShoppingCart, FileText, Check } from "lucide-react";
import type { CartItem } from "../hooks/useCart";
import type { PosOrderType } from "./OrderTypeSelector";
import { getZoneById } from "@/data/mock-zones";
import { cn } from "@/lib/utils";


interface Props {
  items: CartItem[];
  orderType: PosOrderType | string;
  zoneId: string;
  onAdd: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateNote: (id: string, notes: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

function CartItemRow({
  item,
  onAdd,
  onDecrement,
  onRemove,
  onUpdateNote,
}: {
  item: CartItem;
  onAdd: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onUpdateNote: (notes: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 py-2.5 border-b border-border last:border-0">
      {/* Top row */}
      <div className="flex items-start gap-2">
        {/* Qty controls */}
        <div className="flex items-center gap-1 bg-surface-elevated border border-border rounded-lg shrink-0">
          <button
            onClick={onDecrement}
            className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/10 rounded-md transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-bold text-text-primary w-5 text-center">{item.quantity}</span>
          <button
            onClick={onAdd}
            className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Name + subtotal */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary leading-tight">{item.name}</p>
          <p className="text-xs text-text-muted mt-0.5">{item.unitPrice} × {item.quantity}</p>
        </div>

        {/* Subtotal + actions */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-sm font-bold text-text-primary">
            {(item.unitPrice * item.quantity).toFixed(1)}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setNoteOpen((o) => !o)}
              className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                noteOpen || item.notes
                  ? "text-primary bg-primary/10"
                  : "text-text-muted hover:bg-surface-elevated"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRemove}
              className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Note input */}
      {noteOpen && (
        <textarea
          value={item.notes}
          onChange={(e) => onUpdateNote(e.target.value)}
          placeholder="مثال: بدون بصل، حار، زيادة جبن..."
          rows={2}
          className="w-full bg-surface-elevated border border-primary/30 rounded-lg px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          autoFocus
        />
      )}

      {/* Note preview when note set but editor closed */}
      {!noteOpen && item.notes && (
        <button
          onClick={() => setNoteOpen(true)}
          className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5 text-start leading-snug"
        >
          <FileText className="w-3 h-3 shrink-0" /> {item.notes}
        </button>
      )}
    </div>
  );
}

export function CartPanel({
  items,
  orderType,
  zoneId,
  onAdd,
  onDecrement,
  onRemove,
  onUpdateNote,
  isSubmitting,
  onSubmit,
}: Props) {
  const zone = orderType === "delivery" ? getZoneById(zoneId) : undefined;
  const deliveryFee = zone?.fee ?? 0;
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = subtotal + deliveryFee;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center">
          <ShoppingCart className="w-8 h-8 text-text-muted" />
        </div>
        <p className="text-text-secondary font-medium">السلة فارغة</p>
        <p className="text-sm text-text-muted">اضغط على أي صنف لإضافته</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text-primary">السلة</span>
        </div>
        <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
          {itemCount} صنف
        </span>
      </div>

      {/* Items — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        {items.map((item) => (
          <CartItemRow
            key={item.menuItemId}
            item={item}
            onAdd={() => onAdd(item.menuItemId)}
            onDecrement={() => onDecrement(item.menuItemId)}
            onRemove={() => onRemove(item.menuItemId)}
            onUpdateNote={(notes) => onUpdateNote(item.menuItemId, notes)}
          />
        ))}
      </div>

      {/* Summary — fixed at bottom */}
      <div className="shrink-0 border-t border-border bg-surface">
        <div className="px-4 py-3 flex flex-col gap-1.5">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>المجموع الفرعي</span>
            <span>{subtotal.toFixed(1)} د.ع</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-status-info">
              <span>رسوم التوصيل {zone?.name && `(${zone.name})`}</span>
              <span>{deliveryFee} د.ع</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-text-primary border-t border-border pt-2 mt-1">
            <span>الإجمالي</span>
            <span className="text-primary">{total.toFixed(1)} د.ع</span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none shadow-card"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                إنشاء الطلب · {total.toFixed(1)} د.ع
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
