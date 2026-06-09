import { useRef, useMemo } from "react";
import type React from "react";
import { Leaf, Soup, UtensilsCrossed, Flame, Sandwich, CupSoda, Cake, type LucideIcon } from "lucide-react";
import { useMenuData } from "@/hooks/useMenuData";
import { cn } from "@/lib/utils";

interface Props {
  active: string;
  onChange: (id: string) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  leaf:       Leaf,
  soup:       Soup,
  utensils:   UtensilsCrossed,
  flame:      Flame,
  sandwich:   Sandwich,
  "cup-soda": CupSoda,
  cake:       Cake,
  // legacy id-based fallbacks (dev mock)
  appetizers: Leaf,
  soups:      Soup,
  mains:      UtensilsCrossed,
  grills:     Flame,
  sandwiches: Sandwich,
  drinks:     CupSoda,
  desserts:   Cake,
};

export function CategoryBar({ active, onChange }: Props) {
  const { categories, items } = useMenuData();
  const scrollRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, items.filter((i) => i.category_id === c.id).length])),
    [categories, items]
  );

  function scrollToActive(id: string) {
    const el = scrollRef.current?.querySelector(`[data-cat="${id}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function handleClick(id: string) {
    onChange(id);
    scrollToActive(id);
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto px-4 py-2 scrollbar-hide"
      style={{ scrollbarWidth: "none" }}
    >
      {/* All */}
      <button
        data-cat="all"
        onClick={() => handleClick("all")}
        className={cn(
          "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap",
          active === "all"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-surface border-border text-text-secondary hover:bg-surface-elevated"
        )}
      >
        <UtensilsCrossed className="w-3.5 h-3.5" />
        <span>الكل</span>
        <span className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
          active === "all" ? "bg-white/20" : "bg-surface-elevated text-text-muted"
        )}>
          {items.length}
        </span>
      </button>

      {categories.map((cat) => {
        const Icon: React.ElementType = (cat.icon ? ICON_MAP[cat.icon] : undefined) ?? ICON_MAP[cat.id] ?? UtensilsCrossed;
        return (
          <button
            key={cat.id}
            data-cat={cat.id}
            onClick={() => handleClick(cat.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap",
              active === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface border-border text-text-secondary hover:bg-surface-elevated"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{cat.name}</span>
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              active === cat.id ? "bg-white/20" : "bg-surface-elevated text-text-muted"
            )}>
              {counts[cat.id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
