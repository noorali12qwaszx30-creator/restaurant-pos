import { useState, useEffect } from "react";
import { Search, X, ShoppingCart, CheckCircle2, Trash2, MessageSquare, Plus, Minus, FileText, Check } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { CustomerSection } from "./CustomerSection";
import { OrderTypeSelector, type PosOrderType } from "./OrderTypeSelector";
import { DeliveryZoneCombobox } from "./DeliveryZoneCombobox";
import { OrderSourceSelector, type OrderSource } from "./OrderSourceSelector";
import { CategoryBar } from "./CategoryBar";
import { ProductGrid } from "./ProductGrid";
import { LargeOrderConfirmDialog } from "./LargeOrderConfirmDialog";
import { getZoneById } from "@/data/mock-zones";
import { useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { CartItem } from "../hooks/useCart";

const LARGE_ORDER_TOTAL = 400;
const LARGE_ORDER_ITEMS = 15;
const TAX_RATE = 0.15;

interface CustomerData {
  name: string;
  phone: string;
  address: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Inline cart item row ── */
function InlineCartItem({
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
  onUpdateNote: (n: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        {/* qty */}
        <div className="flex items-center gap-0.5 bg-surface-elevated border border-border rounded-lg shrink-0">
          <button onClick={onDecrement} className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/10 rounded-md transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-bold text-text-primary w-5 text-center">{item.quantity}</span>
          <button onClick={onAdd} className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {/* name + price */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary leading-tight truncate">{item.name}</p>
          <p className="text-xs text-text-muted">{item.unitPrice} × {item.quantity}</p>
        </div>
        {/* total + actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-bold text-text-primary">{(item.unitPrice * item.quantity).toFixed(1)}</span>
          <button
            onClick={() => setNoteOpen((o) => !o)}
            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", noteOpen || item.notes ? "text-primary bg-primary/10" : "text-text-muted hover:bg-surface-elevated")}
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
          onChange={(e) => onUpdateNote(e.target.value)}
          placeholder="مثال: بدون بصل، حار، زيادة جبن..."
          rows={2}
          autoFocus
          className="w-full bg-surface-elevated border border-primary/30 rounded-lg px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      )}
      {!noteOpen && item.notes && (
        <button onClick={() => setNoteOpen(true)} className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5 text-start leading-snug">
          <FileText className="w-3 h-3 shrink-0" /> {item.notes}
        </button>
      )}
    </div>
  );
}

export function NewOrderTab() {
  const cart = useCart();
  const { addOrder } = useOrders();
  const { profile } = useAuth();

  const [customer, setCustomer] = useState<CustomerData>({ name: "", phone: "", address: "" });
  const [orderType, setOrderType] = useState<PosOrderType>("delivery");
  const [orderSource, setOrderSource] = useState<OrderSource>("in_store");
  const [zoneId, setZoneId] = useState("");
  const [searchRaw, setSearchRaw] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [largeOrderOpen, setLargeOrderOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const search = useDebounce(searchRaw, 200);

  const zone = getZoneById(zoneId);
  const deliveryFee = orderType === "delivery" && zone ? zone.fee : 0;
  const subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + deliveryFee;

  function validate(): string | null {
    if (cart.items.length === 0) return "أضف صنفاً واحداً على الأقل";
    if (orderType === "delivery" && !zoneId) return "اختر منطقة التوصيل";
    if (orderType === "delivery" && !customer.address.trim()) return "أدخل عنوان التوصيل";
    return null;
  }

  function handleSubmitClick() {
    const err = validate();
    if (err) { alert(err); return; }
    if (total > LARGE_ORDER_TOTAL || cart.itemCount > LARGE_ORDER_ITEMS) {
      setLargeOrderOpen(true);
    } else {
      doSubmit();
    }
  }

  // Map UI source to DB source
  function mapSource(s: OrderSource): string {
    if (s === "in_store") return "local";
    return s; // phone, whatsapp, instagram, telegram
  }

  async function doSubmit() {
    setIsSubmitting(true);
    try {
      const id = await addOrder({
        type: orderType as "delivery" | "takeaway" | "pickup",
        source: mapSource(orderSource),
        paymentMethod: "cash",
        customerName: customer.name || undefined,
        customerPhone: customer.phone || undefined,
        deliveryAddress: customer.address || undefined,
        notes: undefined,
        subtotal,
        deliveryFee,
        tax,
        total,
        cashierId: profile?.uid,
        driverId: undefined,
        driverName: undefined,
        items: cart.items.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: i.notes || undefined,
        })),
      });
      setSuccessId(id);
      cart.clearCart();
      setCustomer({ name: "", phone: "", address: "" });
      setOrderType("delivery");
      setOrderSource("in_store");
      setZoneId("");
      setSearchRaw("");
      setActiveCategory("all");
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err) {
      console.error("[Cashier] createOrder failed:", err);
      alert("فشل إنشاء الطلب. تحقق من الاتصال.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col">

      {/* ── Success toast ── */}
      {successId && (
        <div className="fixed top-[calc(var(--header-height)+8px)] inset-x-4 z-[200] flex items-center gap-3 bg-status-success text-white rounded-2xl px-4 py-3 shadow-elevated">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">تم إنشاء الطلب بنجاح</p>
            <p className="text-xs opacity-80">{successId}</p>
          </div>
        </div>
      )}

      {/* ══ 1. نوع الطلب ══ */}
      <section className="px-4 pt-4 pb-4 border-b border-border/60 bg-surface">
        <p className="text-[11px] font-bold text-text-muted mb-2.5 uppercase tracking-widest">نوع الطلب</p>
        <OrderTypeSelector value={orderType} onChange={(v) => { setOrderType(v); if (v !== "delivery") setZoneId(""); }} />
        {orderType === "delivery" && (
          <div className="mt-2.5">
            <DeliveryZoneCombobox value={zoneId} onChange={setZoneId} />
          </div>
        )}
      </section>

      {/* ══ 2. معلومات الزبون ══ */}
      <section className="px-4 pt-4 pb-4 border-b border-border/60 bg-surface">
        <p className="text-[11px] font-bold text-text-muted mb-2.5 uppercase tracking-widest">معلومات الزبون</p>
        <CustomerSection
          value={customer}
          showAddress={orderType === "delivery"}
          onChange={(data) => setCustomer((prev) => ({ ...prev, ...data }))}
        />
        <div className="mt-2.5">
          <OrderSourceSelector value={orderSource} onChange={setOrderSource} />
        </div>
      </section>

      {/* ══ 3. السلة ══ */}
      <section className="px-4 pt-4 pb-4 border-b border-border/60 bg-surface">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">السلة</p>
          {cart.items.length > 0 && (
            <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
              {cart.itemCount} صنف
            </span>
          )}
        </div>

        {cart.items.length === 0 ? (
          <div className="flex items-center gap-3 py-3 text-text-muted">
            <ShoppingCart className="w-5 h-5 shrink-0" />
            <p className="text-sm">السلة فارغة · اضغط على أي صنف من المنيو</p>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="rounded-xl border border-border overflow-hidden bg-surface-elevated px-3">
              {cart.items.map((item) => (
                <InlineCartItem
                  key={item.menuItemId}
                  item={item}
                  onAdd={() => cart.addItem({ id: item.menuItemId, name: item.name, price: item.unitPrice } as never)}
                  onDecrement={() => cart.decrementItem(item.menuItemId)}
                  onRemove={() => cart.removeItem(item.menuItemId)}
                  onUpdateNote={(n) => cart.updateNote(item.menuItemId, n)}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="mt-3 bg-surface-elevated rounded-xl border border-border px-3 py-3 flex flex-col gap-1.5">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>المجموع الفرعي</span>
                <span>{subtotal.toFixed(1)} د.ع</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary">
                <span>ضريبة 15%</span>
                <span>{tax.toFixed(1)} د.ع</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm text-status-info">
                  <span>رسوم التوصيل{zone?.name ? ` (${zone.name})` : ""}</span>
                  <span>{deliveryFee} د.ع</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-text-primary border-t border-border pt-2 mt-0.5">
                <span>الإجمالي</span>
                <span className="text-primary">{total.toFixed(1)} د.ع</span>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitClick}
              disabled={isSubmitting}
              className="mt-3 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:bg-primary-hover hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none shadow-card"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <><Check className="w-4 h-4" /> إنشاء الطلب · {total.toFixed(1)} د.ع</>
              )}
            </button>
          </>
        )}
      </section>

      {/* ══ 4. المنيو ══ */}
      <section className="flex flex-col">
        {/* Sticky search + categories */}
        <div
          className="sticky z-20 bg-background border-b border-border"
          style={{ top: "var(--header-height)" }}
        >
          <div className="px-4 pt-2.5 pb-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                value={searchRaw}
                onChange={(e) => { setSearchRaw(e.target.value); setActiveCategory("all"); }}
                placeholder="ابحث في القائمة... برگر، شاورمه..."
                className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {searchRaw && (
                <button onClick={() => setSearchRaw("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
                  <X className="w-3 h-3 text-text-muted" />
                </button>
              )}
            </div>
          </div>
          <CategoryBar active={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Product grid */}
        <div className="px-4 py-3 pb-6">
          <ProductGrid
            search={search}
            activeCategory={activeCategory}
            cart={cart.items}
            onAdd={cart.addItem}
            onDecrement={cart.decrementItem}
          />
        </div>
      </section>

      <LargeOrderConfirmDialog
        open={largeOrderOpen}
        onOpenChange={setLargeOrderOpen}
        total={total}
        itemCount={cart.itemCount}
        onConfirm={doSubmit}
      />
    </div>
  );
}
