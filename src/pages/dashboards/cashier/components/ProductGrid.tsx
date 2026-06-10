import { memo, useMemo } from "react";
import type React from "react";
import {
  Plus, Minus,
  Leaf, Soup, UtensilsCrossed, Flame, Sandwich, CupSoda, Cake,
  Search, type LucideIcon,
} from "lucide-react";
import { useMenuData, type MenuItemData } from "@/hooks/useMenuData";
import type { CartItem } from "../hooks/useCart";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  leaf:       Leaf,
  soup:       Soup,
  utensils:   UtensilsCrossed,
  flame:      Flame,
  sandwich:   Sandwich,
  "cup-soda": CupSoda,
  cake:       Cake,
};

// Soft pastel gradient per category for the icon area
const CATEGORY_GRADIENTS: Record<string, string> = {
  leaf:       "from-emerald-50  to-green-100/60  dark:from-emerald-900/30  dark:to-green-800/20",
  soup:       "from-amber-50    to-orange-100/60 dark:from-amber-900/30    dark:to-orange-800/20",
  utensils:   "from-violet-50   to-purple-100/60 dark:from-violet-900/30   dark:to-purple-800/20",
  flame:      "from-red-50      to-rose-100/60   dark:from-red-900/30      dark:to-rose-800/20",
  sandwich:   "from-yellow-50   to-amber-100/60  dark:from-yellow-900/30   dark:to-amber-800/20",
  "cup-soda": "from-sky-50      to-blue-100/60   dark:from-sky-900/30      dark:to-blue-800/20",
  cake:       "from-pink-50     to-rose-100/60   dark:from-pink-900/30     dark:to-rose-800/20",
};
const ICON_COLORS: Record<string, string> = {
  leaf:       "text-emerald-500",
  soup:       "text-amber-500",
  utensils:   "text-violet-500",
  flame:      "text-red-500",
  sandwich:   "text-yellow-600",
  "cup-soda": "text-sky-500",
  cake:       "text-pink-500",
};

function normalizeAr(s: string) {
  return s
    .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه")
    .replace(/[ىئ]/g, "ي").replace(/[ً-ٟ]/g, "")
    .replace(/[گ]/g, "ك").toLowerCase().trim();
}

interface Props {
  search: string;
  activeCategory: string;
  cart: CartItem[];
  onAdd: (item: MenuItemData) => void;
  onDecrement: (id: string) => void;
}

const ProductCard = memo(function ProductCard({
  item, categoryIcon, qty, onAdd, onDecrement,
}: {
  item: MenuItemData;
  categoryIcon?: string;
  qty: number;
  onAdd: () => void;
  onDecrement: () => void;
}) {
  const Icon: React.ElementType =
    (categoryIcon ? CATEGORY_ICONS[categoryIcon] : undefined) ?? UtensilsCrossed;
  const gradient = categoryIcon ? CATEGORY_GRADIENTS[categoryIcon] : "";
  const iconColor = categoryIcon ? ICON_COLORS[categoryIcon] : "text-text-muted";
  const inCart = qty > 0 && item.is_available;

  return (
    <div
      className={cn(
        "group relative bg-surface rounded-3xl overflow-hidden flex flex-col select-none",
        "transition-all duration-200",
        "border",
        item.is_available
          ? cn(
              "cursor-pointer",
              inCart
                ? "border-primary/40 shadow-[0_0_0_1.5px_rgba(var(--color-primary)/0.15),0_8px_24px_rgba(0,0,0,0.10)]"
                : "border-border/70 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)] hover:border-primary/25 hover:-translate-y-0.5"
            )
          : "border-border/40 opacity-50 cursor-not-allowed"
      )}
      onClick={item.is_available ? onAdd : undefined}
    >
      {/* ── Image / Icon area ── */}
      <div className={cn(
        "relative aspect-square flex items-center justify-center overflow-hidden",
        item.image_url ? "bg-surface-elevated" : cn("bg-gradient-to-br", gradient || "from-surface-elevated to-border/30")
      )}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center",
              "bg-white/70 dark:bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
              "transition-transform duration-200 group-hover:scale-110 group-active:scale-100"
            )}>
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
          </div>
        )}

        {/* Unavailable overlay */}
        {!item.is_available && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[11px] font-semibold text-text-secondary bg-surface/90 border border-border rounded-2xl px-3 py-1.5">
              غير متوفر
            </span>
          </div>
        )}

        {/* Cart badge */}
        {inCart && (
          <div className="absolute top-1.5 right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.20)]">
            <span className="text-[11px] font-black text-white leading-none">{qty}</span>
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="px-2.5 pt-2 pb-1 flex flex-col gap-0.5 flex-1">
        <p className="text-[12px] font-semibold text-text-primary leading-snug line-clamp-2 min-h-[2.6em]">
          {item.name}
        </p>
        <p className={cn(
          "text-[13px] font-black mt-auto tabular-nums",
          inCart ? "text-primary" : "text-text-secondary"
        )}>
          {Number(item.price).toLocaleString("ar-IQ")}
          <span className="text-[10px] font-medium opacity-70 mr-0.5">د.ع</span>
        </p>
      </div>

      {/* ── Quantity controls / Add button ── */}
      {item.is_available && (
        <div
          className={cn(
            "border-t transition-colors duration-200",
            inCart ? "border-primary/15" : "border-border/50"
          )}
          onClick={e => e.stopPropagation()}
        >
          {inCart ? (
            <div className="flex items-center">
              <button
                onClick={onDecrement}
                className="flex-1 h-9 flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/8 transition-colors active:bg-status-error/15"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[13px] font-black text-text-primary w-8 text-center tabular-nums">
                {qty}
              </span>
              <button
                onClick={onAdd}
                className="flex-1 h-9 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/8 transition-colors active:bg-primary/15"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              className="h-9 flex items-center justify-center gap-1.5 text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer active:bg-primary/10"
              onClick={onAdd}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">إضافة</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export const ProductGrid = memo(function ProductGrid({
  search, activeCategory, cart, onAdd, onDecrement,
}: Props) {
  const { items: allItems, categories } = useMenuData();

  const cartMap = useMemo(
    () => Object.fromEntries(cart.map(i => [i.menuItemId, i.quantity])),
    [cart]
  );
  const catIconMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c.icon ?? ""])),
    [categories]
  );

  const filtered = useMemo(() => {
    let items = allItems;
    if (activeCategory !== "all") {
      items = items.filter(i => i.category_id === activeCategory);
    }
    if (search.trim()) {
      const q = normalizeAr(search);
      items = allItems.filter(i =>
        normalizeAr(i.name).includes(q) ||
        i.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return items;
  }, [allItems, search, activeCategory]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-surface-elevated border border-border/60 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <Search className="w-7 h-7 text-text-muted/60" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">لا توجد نتائج</p>
          <p className="text-xs text-text-muted mt-1">جرّب كلمة أخرى أو تصنيفاً مختلفاً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {filtered.map(item => (
        <ProductCard
          key={item.id}
          item={item}
          categoryIcon={catIconMap[item.category_id]}
          qty={cartMap[item.id] ?? 0}
          onAdd={() => onAdd(item)}
          onDecrement={() => onDecrement(item.id)}
        />
      ))}
    </div>
  );
});
