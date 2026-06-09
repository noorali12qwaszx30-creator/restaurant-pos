import { memo, useMemo } from "react";
import type React from "react";
import { Plus, Minus, Leaf, Soup, UtensilsCrossed, Flame, Sandwich, CupSoda, Cake, Search, type LucideIcon } from "lucide-react";
import { useMenuData, type MenuItemData } from "@/hooks/useMenuData";
import type { CartItem } from "../hooks/useCart";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  leaf:      Leaf,
  soup:      Soup,
  utensils:  UtensilsCrossed,
  flame:     Flame,
  sandwich:  Sandwich,
  "cup-soda": CupSoda,
  cake:      Cake,
};

function normalizeAr(s: string) {
  return s
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىئ]/g, "ي")
    .replace(/[ً-ٟ]/g, "")
    .replace(/[گ]/g, "ك")
    .toLowerCase()
    .trim();
}

interface Props {
  search: string;
  activeCategory: string;
  cart: CartItem[];
  onAdd: (item: MenuItemData) => void;
  onDecrement: (id: string) => void;
}

const ProductCard = memo(function ProductCard({
  item,
  categoryIcon,
  qty,
  onAdd,
  onDecrement,
}: {
  item: MenuItemData;
  categoryIcon?: string;
  qty: number;
  onAdd: () => void;
  onDecrement: () => void;
}) {
  const Icon: React.ElementType = (categoryIcon ? CATEGORY_ICONS[categoryIcon] : undefined) ?? UtensilsCrossed;

  return (
    <div
      className={cn(
        "relative bg-surface border rounded-2xl overflow-hidden flex flex-col transition-all",
        item.is_available
          ? "border-border shadow-card hover:shadow-elevated hover:border-primary/20 active:scale-[0.98] cursor-pointer"
          : "border-border opacity-50 cursor-not-allowed"
      )}
      onClick={item.is_available ? onAdd : undefined}
    >
      {/* Image / icon */}
      <div className="aspect-square bg-surface-elevated flex items-center justify-center select-none">
        {item.image_url
          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          : <Icon className="w-8 h-8 text-text-muted/50" />
        }
      </div>

      {/* Unavailable overlay */}
      {!item.is_available && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
          <span className="text-xs font-medium text-text-muted bg-surface border border-border rounded-full px-2 py-1">
            غير متوفر
          </span>
        </div>
      )}

      {/* In-cart badge */}
      {qty > 0 && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-card">
          <span className="text-[11px] font-bold text-primary-foreground">{qty}</span>
        </div>
      )}

      {/* Info */}
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p className="text-xs font-semibold text-text-primary leading-tight line-clamp-2">{item.name}</p>
        <p className="text-sm font-bold text-primary mt-auto">
          {Number(item.price).toLocaleString("ar-IQ")} د.ع
        </p>
      </div>

      {/* Qty controls */}
      {qty > 0 && item.is_available && (
        <div className="flex items-center border-t border-border" onClick={(e) => e.stopPropagation()}>
          <button onClick={onDecrement} className="flex-1 h-9 flex items-center justify-center text-text-muted hover:bg-surface-elevated hover:text-status-error transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-bold text-text-primary w-8 text-center">{qty}</span>
          <button onClick={onAdd} className="flex-1 h-9 flex items-center justify-center text-text-muted hover:bg-surface-elevated hover:text-primary transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {qty === 0 && item.is_available && (
        <div className="border-t border-border">
          <div className="h-9 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
});

export const ProductGrid = memo(function ProductGrid({
  search,
  activeCategory,
  cart,
  onAdd,
  onDecrement,
}: Props) {
  const { items: allItems, categories } = useMenuData();

  const cartMap = useMemo(
    () => Object.fromEntries(cart.map((i) => [i.menuItemId, i.quantity])),
    [cart]
  );

  // Build category icon map
  const catIconMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c.icon ?? ""])),
    [categories]
  );

  const filtered = useMemo(() => {
    let items = allItems;
    if (activeCategory !== "all") {
      items = items.filter((i) => i.category_id === activeCategory);
    }
    if (search.trim()) {
      const q = normalizeAr(search);
      items = allItems.filter((i) =>
        normalizeAr(i.name).includes(q) ||
        i.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return items;
  }, [allItems, search, activeCategory]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center mb-3">
          <Search className="w-7 h-7 text-text-muted" />
        </div>
        <p className="text-text-primary font-medium">لا توجد نتائج</p>
        <p className="text-text-muted text-sm mt-1">جرّب كلمة أخرى أو تصنيفاً مختلفاً</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {filtered.map((item) => (
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
