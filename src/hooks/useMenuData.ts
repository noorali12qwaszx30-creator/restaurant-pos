/**
 * useMenuData — loads menu categories + items.
 * Dev mode:  returns MOCK data instantly.
 * Production: fetches from Supabase.
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

export function useMenuData(): UseMenuData {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      if (IS_DEV_MODE) {
        // Simulate micro-delay to avoid flash
        await new Promise(r => setTimeout(r, 0));
        if (!cancelled) {
          setCategories(
            MOCK_CATS.map(c => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
              sort_order: 0,
            }))
          );
          setItems(MOCK_ITEMS.map(mockItemToMenuItemData));
        }
      } else {
        try {
          const { getMenuCategories, getMenuItems } = await import(
            "@/integrations/supabase/queries"
          );
          const [cats, itmList] = await Promise.all([
            getMenuCategories(),
            getMenuItems(),
          ]);
          if (!cancelled) {
            setCategories(
              cats.map(c => ({
                id: c.id,
                name: c.name,
                icon: c.icon ?? undefined,
                sort_order: c.sort_order,
              }))
            );
            setItems(
              itmList.map(i => ({
                id: i.id,
                category_id: i.category_id,
                name: i.name,
                price: Number(i.price),
                description: i.description ?? undefined,
                is_available: i.is_available,
                preparation_time: i.preparation_time,
                image_url: i.image_url ?? undefined,
              }))
            );
          }
        } catch (err) {
          console.error("[useMenuData] fetch failed:", err);
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [tick]);

  return {
    categories,
    items,
    isLoading,
    refetch: () => setTick(t => t + 1),
  };
}
