/**
 * useMenuData — loads menu categories + items.
 * Dev mode:  returns MOCK data instantly.
 * Production: fetches from Supabase once per restaurant, then serves from
 *             module-level cache keyed by restaurantId so re-mounts are instant.
 */
import { useState, useEffect } from "react";
import { IS_DEV_MODE } from "@/lib/dev-mock";
import { MENU_CATEGORIES as MOCK_CATS, MENU_ITEMS as MOCK_ITEMS } from "@/data/mock-menu";
import type { MenuItem as MockMenuItem } from "@/data/mock-types";
import { useAuth } from "@/contexts/AuthContext";

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

// ── Module-level cache keyed by restaurantId (null = super_admin / dev) ──
interface MenuCache {
  categories: MenuCategory[];
  items: MenuItemData[];
}
const _cacheMap = new Map<string, MenuCache>();
const _inflightMap = new Map<string, Promise<MenuCache>>();

function getCacheKey(restaurantId: string | null): string {
  return restaurantId ?? "__dev__";
}

async function doFetch(restaurantId: string | null): Promise<MenuCache> {
  if (IS_DEV_MODE) {
    return {
      categories: MOCK_CATS.map(c => ({ id: c.id, name: c.name, icon: c.icon, sort_order: 0 })),
      items: MOCK_ITEMS.map(mockItemToMenuItemData),
    };
  }
  const { getMenuCategories, getMenuItems } = await import("@/integrations/supabase/queries");
  const [cats, itmList] = await Promise.all([
    getMenuCategories(restaurantId),
    getMenuItems(restaurantId),
  ]);
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
  const { profile } = useAuth();
  const restaurantId = profile?.restaurantId ?? null;
  const cacheKey = getCacheKey(restaurantId);

  const cached = _cacheMap.get(cacheKey);

  const [categories, setCategories] = useState<MenuCategory[]>(cached?.categories ?? []);
  const [items, setItems]           = useState<MenuItemData[]>(cached?.items ?? []);
  const [isLoading, setIsLoading]   = useState<boolean>(!cached);
  const [tick, setTick]             = useState(0);

  useEffect(() => {
    const key = cacheKey;
    const existing = _cacheMap.get(key);

    // Cache hit and not a manual refetch
    if (existing && tick === 0) {
      setCategories(existing.categories);
      setItems(existing.items);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    if (tick > 0) {
      _cacheMap.delete(key);
      _inflightMap.delete(key);
    }

    if (!_inflightMap.has(key)) {
      const promise = doFetch(restaurantId)
        .then(data => { _cacheMap.set(key, data); return data; })
        .finally(() => { _inflightMap.delete(key); });
      _inflightMap.set(key, promise);
    }

    setIsLoading(true);
    _inflightMap.get(key)!
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, cacheKey]);

  return {
    categories,
    items,
    isLoading,
    refetch: () => setTick(t => t + 1),
  };
}
