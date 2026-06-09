/**
 * useDrivers — loads active delivery drivers.
 * Dev mode:  returns MOCK_DRIVERS.
 * Production: fetches from Supabase profiles (role=delivery, is_active=true).
 */
import { useState, useEffect } from "react";
import { IS_DEV_MODE } from "@/lib/dev-mock";
import { MOCK_DRIVERS } from "@/data/mock-drivers";

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  status: "available" | "busy" | "offline";
  currentOrders: number;
  lastActivity: Date;
}

export function useDrivers(): { drivers: Driver[]; isLoading: boolean } {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      if (IS_DEV_MODE) {
        await new Promise(r => setTimeout(r, 0));
        if (!cancelled) {
          setDrivers(
            MOCK_DRIVERS.map(d => ({
              id: d.id,
              name: d.name,
              phone: d.phone,
              status: d.status as Driver["status"],
              currentOrders: d.currentOrders,
              lastActivity: d.lastActivity,
            }))
          );
        }
      } else {
        try {
          const { getDrivers } = await import("@/integrations/supabase/queries");
          const data = await getDrivers();
          if (!cancelled) {
            setDrivers(
              data.map(p => ({
                id: p.id,
                name: p.display_name,
                phone: p.phone ?? undefined,
                // Supabase profiles don't store live status — default to available
                status: "available" as Driver["status"],
                currentOrders: 0,
                lastActivity: new Date(p.updated_at),
              }))
            );
          }
        } catch (err) {
          console.error("[useDrivers] fetch failed:", err);
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { drivers, isLoading };
}
