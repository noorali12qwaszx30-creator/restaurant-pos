import { useRef, useMemo } from "react";
import type React from "react";
import {
  Leaf, Soup, UtensilsCrossed, Flame, Sandwich, CupSoda, Cake,
  LayoutGrid, type LucideIcon,
} from "lucide-react";
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
    () => Object.fromEntries(
      categories.map(c => [c.id, items.filter(i => i.category_id === c.id).length])
    ),
    [categories, items]
  );

  function handleClick(id: string) {
    onChange(id);
    const el = scrollRef.current?.querySelector(`[data-cat="${id}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  const allCats = [
    { id: "all", name: "الكل", icon: null, count: items.length },
    ...categories.map(c => ({ id: c.id, name: c.name, icon: c.icon ?? null, count: counts[c.id] ?? 0 })),
  ];

  return (
    <div className="relative">
      {/* fade edges */}
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {allCats.map(cat => {
          const isActive = active === cat.id;
          const Icon: React.ElementType =
            cat.id === "all"
              ? LayoutGrid
              : (cat.icon ? ICON_MAP[cat.icon] : undefined) ?? ICON_MAP[cat.id] ?? UtensilsCrossed;

          return (
            <button
              key={cat.id}
              data-cat={cat.id}
              onClick={() => handleClick(cat.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-semibold transition-all duration-200 whitespace-nowrap select-none",
                "active:scale-[0.94]",
                isActive
                  ? "bg-primary text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] scale-[1.02]"
                  : "bg-surface-elevated/80 text-text-secondary border border-border/60 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center transition-colors",
                isActive ? "text-white/90" : "text-text-muted"
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span>{cat.name}</span>
              <span className={cn(
                "rounded-xl px-1.5 py-0.5 text-[11px] font-bold tabular-nums leading-none transition-colors",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-border/60 text-text-muted"
              )}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
