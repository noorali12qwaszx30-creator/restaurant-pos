/**
 * TakeawayMenuPage — POS مخصص لرفع طلبات السفري
 * لا يحتاج معلومات زبون — النوع ثابت "takeaway"
 */
import { useState, useEffect } from "react";
import {
  Search, X, ShoppingBag, CheckCircle2,
  Trash2, MessageSquare, Plus, Minus, FileText, ChevronDown, Sparkles,
} from "lucide-react";
import { useCart } from "../../cashier/hooks/useCart";
import { CategoryBar } from "../../cashier/components/CategoryBar";
import { ProductGrid } from "../../cashier/components/ProductGrid";
import { useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { CartItem } from "../../cashier/hooks/useCart";

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

/* ── Cart item row ── */
function InlineCartItem({ item, onAdd, onDecrement, onRemove, onUpdateNote }: {
  item: CartItem;
  onAdd: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onUpdateNote: (n: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        {/* Qty stepper */}
        <div className="flex items-center bg-surface-elevated border border-border/70 rounded-2xl overflow-hidden shrink-0">
          <button
            onClick={onDecrement}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/8 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-black text-text-primary w-6 text-center tabular-nums">{item.quantity}</span>
          <button
            onClick={onAdd}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/8 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Name + price */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-tight truncate">{item.name}</p>
          <p className="text-xs text-text-muted tabular-nums mt-0.5">
            {item.unitPrice.toLocaleString("ar-IQ")} × {item.quantity}
          </p>
        </div>

        {/* Total + note + remove */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-black text-text-primary tabular-nums">
            {(item.unitPrice * item.quantity).toLocaleString("ar-IQ")}
          </span>
          <button
            onClick={() => setNoteOpen(o => !o)}
            className={cn(
              "w-8 h-8 rounded-2xl flex items-center justify-center transition-all",
              noteOpen || item.notes
                ? "bg-primary/12 text-primary"
                : "text-text-muted hover:bg-surface-elevated"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-2xl flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/8 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note input */}
      {noteOpen && (
        <textarea
          value={item.notes}
          onChange={e => onUpdateNote(e.target.value)}
          placeholder="مثال: بدون بصل، حار، زيادة جبن..."
          rows={2}
          autoFocus
          className="w-full bg-surface-elevated border border-primary/25 rounded-2xl px-3 py-2.5 text-xs text-text-primary placeholder:text-text-muted resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
        />
      )}
      {!noteOpen && item.notes && (
        <button
          onClick={() => setNoteOpen(true)}
          className="flex items-center gap-1.5 text-xs text-primary bg-primary/6 border border-primary/15 rounded-2xl px-3 py-2 text-start leading-snug"
        >
          <FileText className="w-3 h-3 shrink-0" />
          {item.notes}
        </button>
      )}
    </div>
  );
}

/* ── Main Page ── */
export function TakeawayMenuPage() {
  const cart = useCart();
  const { addOrder } = useOrders();
  const { profile } = useAuth();

  const [searchRaw, setSearchRaw]     = useState("");
  const [activeCategory, setCategory] = useState("all");
  const [cartOpen, setCartOpen]       = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [successNum, setSuccessNum]   = useState<number | null>(null);
  const [orderNote, setOrderNote]     = useState("");
  const [noteOpen, setNoteOpen]       = useState(false);

  const search   = useDebounce(searchRaw, 200);
  const subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  async function doSubmit() {
    if (cart.items.length === 0) return;
    setSubmitting(true);
    try {
      await addOrder({
        type: "takeaway",
        source: "local",
        paymentMethod: "cash",
        subtotal,
        deliveryFee: 0,
        tax: 0,
        total: subtotal,
        cashierId: profile?.uid,
        notes: orderNote || undefined,
        items: cart.items.map(i => ({
          menuItemId: i.menuItemId,
          name:       i.name,
          quantity:   i.quantity,
          unitPrice:  i.unitPrice,
          notes:      i.notes || undefined,
        })),
      });
      const num = cart.itemCount;
      cart.clearCart();
      setOrderNote("");
      setNoteOpen(false);
      setCartOpen(false);
      setCategory("all");
      setSearchRaw("");
      setSuccessNum(num);
      setTimeout(() => setSuccessNum(null), 3500);
    } catch (err) {
      console.error("[Takeaway] createOrder failed:", err);
      alert("فشل إنشاء الطلب. تحقق من الاتصال.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* ── Success toast ── */}
      {successNum !== null && (
        <div className="fixed top-[calc(var(--header-height,56px)+12px)] inset-x-4 z-[200]
          flex items-center gap-3 px-4 py-3.5 rounded-3xl
          bg-gradient-to-l from-emerald-500 to-green-600
          text-white shadow-[0_8px_32px_rgba(16,185,129,0.40)]
          animate-in slide-in-from-top-3 duration-300">
          <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold leading-tight">تم إرسال الطلب!</p>
            <p className="text-xs opacity-80 mt-0.5">{successNum} صنف · سفري</p>
          </div>
          <Sparkles className="w-4 h-4 opacity-60" />
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 py-3">
        <div className="relative flex items-center">
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center pointer-events-none">
            <Search className="w-[17px] h-[17px] text-text-muted/70" />
          </div>
          <input
            value={searchRaw}
            onChange={e => setSearchRaw(e.target.value)}
            placeholder="ابحث في المنيو..."
            className="w-full bg-surface-elevated/80 border border-border/60
              rounded-2xl pr-11 pl-10 py-3
              text-sm text-text-primary placeholder:text-text-muted/60
              outline-none transition-all duration-200
              focus:bg-surface focus:border-primary/40
              focus:ring-4 focus:ring-primary/10
              shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          />
          {searchRaw && (
            <button
              onClick={() => setSearchRaw("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-border/80 flex items-center justify-center transition-all hover:bg-border active:scale-90"
            >
              <X className="w-3 h-3 text-text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category bar ── */}
      <div className="bg-background border-b border-border/30">
        <CategoryBar active={activeCategory} onChange={setCategory} />
      </div>

      {/* ── Product grid ── */}
      <div className="flex-1 px-3 pt-3 pb-6">
        <ProductGrid
          search={search}
          activeCategory={activeCategory}
          cart={cart.items}
          onAdd={item => cart.addItem({ id: item.id, name: item.name, price: Number(item.price) })}
          onDecrement={id => cart.decrementItem(id)}
        />
      </div>

      {/* ── Floating cart button ── */}
      {cart.itemCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-[calc(var(--nav-height)+12px)] inset-x-4 z-40
            flex items-center gap-3 px-4 py-3.5 rounded-3xl
            bg-gradient-to-l from-primary to-primary/90
            text-white
            shadow-[0_8px_32px_rgba(0,0,0,0.22),0_2px_8px_rgba(0,0,0,0.12)]
            active:scale-[0.97] transition-all duration-150"
        >
          <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 relative">
            <ShoppingBag className="w-4 h-4" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-primary text-[10px] font-black flex items-center justify-center leading-none shadow-sm">
              {cart.itemCount}
            </span>
          </div>
          <div className="flex-1 text-start">
            <p className="text-sm font-bold leading-tight">{cart.itemCount} صنف مختار</p>
            <p className="text-xs opacity-75 mt-0.5">اضغط للمراجعة والإرسال</p>
          </div>
          <div className="text-start shrink-0">
            <p className="text-base font-black tabular-nums leading-tight">
              {subtotal.toLocaleString("ar-IQ")}
            </p>
            <p className="text-[10px] opacity-70 mt-0.5">د.ع</p>
          </div>
        </button>
      )}

      {/* ── Cart drawer ── */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ paddingBottom: "var(--nav-height)" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative bg-surface rounded-t-[28px] border-t border-border/60
              shadow-[0_-8px_48px_rgba(0,0,0,0.20)] flex flex-col"
            style={{ maxHeight: "82dvh" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-border/80" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 pb-4 border-b border-border/50 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-text-primary">طلب سفري</p>
                <p className="text-xs text-text-muted">{cart.itemCount} صنف</p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-2xl bg-surface-elevated border border-border/60 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="overflow-y-auto flex-1 px-5">
              {cart.items.map(item => (
                <InlineCartItem
                  key={item.menuItemId}
                  item={item}
                  onAdd={() => cart.addItem({ id: item.menuItemId, name: item.name, price: item.unitPrice })}
                  onDecrement={() => cart.decrementItem(item.menuItemId)}
                  onRemove={() => cart.removeItem(item.menuItemId)}
                  onUpdateNote={n => cart.updateNote(item.menuItemId, n)}
                />
              ))}

              {/* Order note */}
              <div className="py-4">
                {noteOpen ? (
                  <textarea
                    value={orderNote}
                    onChange={e => setOrderNote(e.target.value)}
                    placeholder="ملاحظة عامة على الطلب..."
                    rows={2}
                    autoFocus
                    className="w-full bg-surface-elevated border border-primary/25 rounded-2xl px-3.5 py-3 text-xs text-text-primary placeholder:text-text-muted resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  />
                ) : (
                  <button
                    onClick={() => setNoteOpen(true)}
                    className="flex items-center gap-2.5 text-xs text-text-muted hover:text-primary transition-colors py-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {orderNote || "إضافة ملاحظة على الطلب"}
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pt-3 pb-4 border-t border-border/50 shrink-0 flex flex-col gap-3">
              {/* Total */}
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-text-muted font-medium">الإجمالي</span>
                <div className="text-start">
                  <span className="text-xl font-black text-text-primary tabular-nums">
                    {subtotal.toLocaleString("ar-IQ")}
                  </span>
                  <span className="text-sm font-medium text-text-muted mr-1">د.ع</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => { cart.clearCart(); setCartOpen(false); }}
                  className="w-12 h-12 rounded-2xl border border-border/70 bg-surface-elevated flex items-center justify-center text-text-muted hover:text-status-error hover:border-status-error/30 hover:bg-status-error/6 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={doSubmit}
                  disabled={isSubmitting || cart.items.length === 0}
                  className="flex-1 h-12 rounded-2xl
                    bg-gradient-to-l from-primary to-primary/90
                    text-white text-sm font-bold
                    disabled:opacity-50 active:scale-[0.98]
                    transition-all duration-150
                    shadow-[0_4px_16px_rgba(0,0,0,0.16)]
                    flex items-center justify-center gap-2.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>إرسال الطلب</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
