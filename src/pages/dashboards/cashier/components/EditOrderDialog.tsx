/**
 * EditOrderDialog — تعديل طلب قائم (معلومات الزبون + الأصناف)
 * متاح فقط للكاشير ما لم يصل الطلب لمرحلة "قيد التوصيل"
 */
import { useState, useEffect, useRef } from "react";
import { Minus, Plus, Trash2, MessageSquare, FileText, Check, Loader2, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { CustomerSection, type CustomerData } from "./CustomerSection";
import { CategoryBar } from "./CategoryBar";
import { ProductGrid } from "./ProductGrid";
import { getZoneById } from "@/data/mock-zones";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { cn } from "@/lib/utils";
import { useNotify } from "@/components/notifications/NotificationContext";
import type { CartItem } from "../hooks/useCart";


// ─── editable statuses ────────────────────────────────────────
const EDITABLE_STATUSES: LiveOrder["status"][] = [
  "pending", "preparing", "ready",
];

export function canEdit(order: LiveOrder) {
  return EDITABLE_STATUSES.includes(order.status);
}

// ─── inline cart item (same style as NewOrderTab) ─────────────
function InlineCartItem({
  item, onAdd, onDecrement, onRemove, onUpdateNote,
}: {
  item: CartItem;
  onAdd: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onUpdateNote: (n: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-surface-elevated border border-border rounded-lg shrink-0">
          <button onClick={onDecrement} className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/10 rounded-md transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-bold text-text-primary w-5 text-center">{item.quantity}</span>
          <button onClick={onAdd} className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary leading-tight truncate">{item.name}</p>
          <p className="text-xs text-text-muted">{item.unitPrice} × {item.quantity}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-bold text-text-primary">{(item.unitPrice * item.quantity).toFixed(1)}</span>
          <button
            onClick={() => setNoteOpen(o => !o)}
            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
              noteOpen || item.notes ? "text-primary bg-primary/10" : "text-text-muted hover:bg-surface-elevated")}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRemove} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {noteOpen && (
        <textarea
          value={item.notes}
          onChange={e => onUpdateNote(e.target.value)}
          placeholder="ملاحظة الصنف..."
          rows={2}
          autoFocus
          className="w-full bg-surface-elevated border border-primary/30 rounded-lg px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      )}
      {!noteOpen && item.notes && (
        <button onClick={() => setNoteOpen(true)} className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5 text-start leading-snug flex items-center gap-1.5">
          <FileText className="w-3 h-3 shrink-0" /> {item.notes}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
interface Props {
  order: LiveOrder | null;
  onClose: () => void;
}

export function EditOrderDialog({ order, onClose }: Props) {
  const { editOrder } = useOrders();
  const { notify } = useNotify();

  // ── local state ──────────────────────────────────
  const [customer, setCustomer] = useState<CustomerData>({ name: "", phone: "", address: "" });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // seed state only when dialog first opens (order.id changes), not on every re-render
  const lastOrderId = useRef<string | null>(null);
  useEffect(() => {
    if (!order) { lastOrderId.current = null; return; }
    if (order.id === lastOrderId.current) return; // already seeded for this order
    lastOrderId.current = order.id;
    setCustomer({
      name:    order.customerName  ?? "",
      phone:   order.customerPhone ?? "",
      address: order.deliveryAddress ?? "",
      zoneId:  order.zone ? undefined : undefined, // zone resolved below
    });
    setCartItems(order.items.map(i => ({
      menuItemId: i.menuItemId,
      name:       i.name,
      unitPrice:  i.unitPrice,
      quantity:   i.quantity,
      notes:      i.notes ?? "",
    })));
    setSaved(false);
  }, [order]);

  if (!order) return null;

  // ── cart helpers ─────────────────────────────────
  function addItem(item: { id: string; name: string; price: number }) {
    setCartItems(prev => {
      const ex = prev.find(i => i.menuItemId === item.id);
      if (ex) return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuItemId: item.id, name: item.name, unitPrice: item.price, quantity: 1, notes: "" }];
    });
  }
  function decrement(menuItemId: string) {
    setCartItems(prev => {
      const ex = prev.find(i => i.menuItemId === menuItemId);
      if (!ex) return prev;
      if (ex.quantity <= 1) return prev.filter(i => i.menuItemId !== menuItemId);
      return prev.map(i => i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  }
  function removeItem(menuItemId: string) {
    setCartItems(prev => prev.filter(i => i.menuItemId !== menuItemId));
  }
  function updateNote(menuItemId: string, notes: string) {
    setCartItems(prev => prev.map(i => i.menuItemId === menuItemId ? { ...i, notes } : i));
  }

  // ── totals ───────────────────────────────────────
  const zone        = getZoneById(customer.zoneId ?? "");
  const deliveryFee = order.type === "delivery" && zone ? zone.fee : order.deliveryFee;
  const subtotal    = cartItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total       = subtotal + deliveryFee;

  // ── save ─────────────────────────────────────────
  async function handleSave() {
    if (cartItems.length === 0) { notify({ type: "warning", title: "السلة فارغة", message: "أضف صنفاً واحداً على الأقل" }); return; }
    setIsSaving(true);
    try {
      await editOrder(order!.id, {
        customerName:    customer.name    || undefined,
        customerPhone:   customer.phone   || undefined,
        deliveryAddress: customer.address || undefined,
        subtotal, deliveryFee, tax: 0, total,
        items: cartItems.map(i => ({
          menuItemId: i.menuItemId,
          name:       i.name,
          quantity:   i.quantity,
          unitPrice:  i.unitPrice,
          notes:      i.notes || undefined,
        })),
      });
      setSaved(true);
      setTimeout(onClose, 900);
    } catch {
      notify({ type: "error", title: "فشل الحفظ", message: "تحقق من الاتصال وحاول مجدداً" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] flex flex-col p-0 gap-0">
        <DialogHeader onClose={onClose}>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-bold">
              {order.orderNumber ?? order.id.slice(0, 4)}
            </span>
            <DialogTitle>تعديل الطلب</DialogTitle>
          </div>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto flex flex-col gap-0 p-0">

          {/* ── Customer info ── */}
          <section className="px-4 pt-4 pb-4 border-b border-border/60">
            <p className="text-[11px] font-bold text-text-muted mb-2.5 uppercase tracking-widest">معلومات الزبون</p>
            <CustomerSection
              value={customer}
              showAddress={order.type === "delivery"}
              onChange={data => setCustomer(prev => ({ ...prev, ...data }))}
              onZoneFeeChange={() => {}}
            />
          </section>

          {/* ── Cart ── */}
          <section className="px-4 pt-4 pb-4 border-b border-border/60">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">الأصناف</p>
              <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} صنف
              </span>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-sm text-text-muted py-2">السلة فارغة — أضف أصنافاً من المنيو أدناه</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden bg-surface-elevated px-3 mb-3">
                {cartItems.map(item => (
                  <InlineCartItem
                    key={item.menuItemId}
                    item={item}
                    onAdd={() => addItem({ id: item.menuItemId, name: item.name, price: item.unitPrice })}
                    onDecrement={() => decrement(item.menuItemId)}
                    onRemove={() => removeItem(item.menuItemId)}
                    onUpdateNote={n => updateNote(item.menuItemId, n)}
                  />
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="bg-surface-elevated rounded-xl border border-border px-3 py-3 flex flex-col gap-1.5">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>المجموع الفرعي</span>
                <span>{subtotal.toFixed(1)} د.ع</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm text-status-info">
                  <span>رسوم التوصيل</span>
                  <span>{deliveryFee} د.ع</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-text-primary border-t border-border pt-2 mt-0.5">
                <span>الإجمالي</span>
                <span className="text-primary">{total.toFixed(1)} د.ع</span>
              </div>
            </div>
          </section>

          {/* ── Menu picker ── */}
          <section className="flex flex-col">
            <div className="sticky z-10 bg-background border-b border-border" style={{ top: 0 }}>
              <CategoryBar active={activeCategory} onChange={setActiveCategory} />
            </div>
            <div className="px-4 py-3 pb-6">
              <ProductGrid
                search=""
                activeCategory={activeCategory}
                cart={cartItems}
                onAdd={addItem}
                onDecrement={decrement}
              />
            </div>
          </section>
        </DialogBody>

        {/* ── Save bar ── */}
        <div className="shrink-0 px-4 py-3 border-t border-border bg-surface flex gap-2">
          <button
            onClick={onClose}
            className="h-12 px-4 rounded-2xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-elevated transition-all flex items-center gap-2"
          >
            <X className="w-4 h-4" /> إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || saved}
            className={cn(
              "flex-1 h-12 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all",
              saved
                ? "bg-status-success text-white"
                : "bg-primary text-white hover:bg-primary/90 hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0",
              (isSaving || saved) && "pointer-events-none opacity-80"
            )}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> تم الحفظ
                </motion.span>
              ) : isSaving ? (
                <motion.span key="spin" className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...
                </motion.span>
              ) : (
                <motion.span key="save" className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> حفظ التعديلات
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
