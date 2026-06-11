/**
 * RestaurantContext — يحمل بيانات المطعم الحالي
 * يُستخدم من قبل جميع الـ hooks والـ contexts الأخرى
 */
import {
  createContext, useContext, useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Restaurant } from "@/integrations/supabase/types";

interface RestaurantContextValue {
  restaurant: Restaurant | null;
  restaurantId: string | null;
  isLoading: boolean;
  /** يُستدعى بعد تسجيل الدخول لتحميل بيانات المطعم */
  loadRestaurant: (restaurantId: string | null) => Promise<void>;
  /** مسح البيانات عند تسجيل الخروج */
  clearRestaurant: () => void;
}

const Ctx = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadRestaurant = async (id: string | null) => {
    if (!id) {
      setRestaurant(null);
      setRestaurantId(null);
      return;
    }
    setRestaurantId(id);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setRestaurant(data as Restaurant);
    } catch (err) {
      console.error("[RestaurantContext] loadRestaurant error:", err);
      setRestaurant(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearRestaurant = () => {
    setRestaurant(null);
    setRestaurantId(null);
  };

  return (
    <Ctx.Provider value={{ restaurant, restaurantId, isLoading, loadRestaurant, clearRestaurant }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRestaurant(): RestaurantContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRestaurant must be inside <RestaurantProvider>");
  return ctx;
}
