/**
 * useMenuData — loads menu categories + items.
 * Dev mode:  returns MOCK data instantly.
 * Production: fetches from Supabase once, then serves from module-level cache
 *             so re-mounts (tab navigation) are instant with no loading delay.
 */
import { useState, useEffect } from "react";
import { IS_DEV_MODE } from "@/lib/dev-mock";
import { MENU_CATEGORIES as MOCK_CATS, MENU_ITEMS as MOCK_ITEMS } from "@/data/mock-menu";
import type { MenuItem as MockMenuItem } from "@/data/mock-types";

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  sort_order: number;
}

export interface MenuItemData {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
  preparation_time: number;
  image_url?: string;
}

interface UseMenuData {
  categories: MenuCategory[];
  items: MenuItemData[];
  isLoading: boolean;
  refetch: () => void;
}

// Map mock data shapes → unified shape
function mockItemToMenuItemData(i: MockMenuItem): MenuItemData {
  return {
    id: i.id,
    category_id: i.category,
    name: i.name,
    price: i.price,
    description: i.description,
    is_available: i.available,
    preparation_time: i.preparationTime ?? 10,
    image_url: undefined,
  };
}

// ── Module-level cache — survives re-mounts, cleared only on manual refetch ──
interface MenuCache {
  categories: MenuCategory[];
  items: MenuItemData[];
}
let _cache: MenuCache | null = null;
let _inflight: Promise<MenuCache> | null = null;

async function doFetch(): Promise<MenuCache> {
  if (IS_DEV_MODE) {
    return {
      categories: MOCK_CATS.map(c => ({ id: c.id, name: c.name, icon: c.icon, sort_order: 0 })),
      items: MOCK_ITEMS.map(mockItemToMenuItemData),
    };
  }
  const { getMenuCategories, getMenuItems } = await import("@/integrations/supabase/queries");
  const [cats, itmList] = await Promise.all([getMenuCategories(), getMenuItems()]);
  return {
    categories: cats.map(c => ({
      id: c.id, name: c.name, icon: c.icon ?? undefined, sort_order: c.sort_order,
    })),
    items: itmList.map(i => ({
      id: i.id,
      category_id: i.category_id,
      name: i.name,
      price: Number(i.price),
      description: i.description ?? undefined,
      is_available: i.is_available,
      preparation_time: i.preparation_time,
      image_url: i.image_url ?? undefined,
    })),
  };
}

export function useMenuData(): UseMenuData {
  // Initialize from cache instantly if available — no loading flash on re-mount
  const [categories, setCategories] = useState<MenuCategory[]>(_cache?.categories ?? []);
  const [items, setItems]           = useState<MenuItemData[]>(_cache?.items ?? []);
  const [isLoading, setIsLoading]   = useState<boolean>(!_cache);
  const [tick, setTick]             = useState(0);

  useEffect(() => {
    // Cache hit and not a manual refetch — serve instantly
    if (_cache && tick === 0) {
      setCategories(_cache.categories);
      setItems(_cache.items);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // On manual refetch, clear cache so we get fresh data
    if (tick > 0) {
      _cache = null;
      _inflight = null;
    }

    // Deduplicate concurrent fetches — share one in-flight promise
    if (!_inflight) {
      _inflight = doFetch()
        .then(data => { _cache = data; return data; })
        .finally(() => { _inflight = null; });
    }

    setIsLoading(true);
    _inflight
      .then(data => {
        if (!cancelled) {
          setCategories(data.categories);
          setItems(data.items);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error("[useMenuData] fetch failed:", err);
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return {
    categories,
    items,
    isLoading,
    refetch: () => setTick(t => t + 1),
  };
}
