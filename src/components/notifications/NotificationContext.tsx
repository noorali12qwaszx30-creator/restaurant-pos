/**
 * NotificationContext — مركز إدارة إشعارات قطرة الماء
 * الاستخدام:
 *   const { notify } = useNotify();
 *   notify({ type: "success", title: "تم", message: "الطلب #12 جاهز" });
 */
import {
  createContext, useCallback, useContext, useState, type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";
import { WaterDropNotification } from "./WaterDropNotification";

export type NotifyType =
  | "success" | "warning" | "error" | "info"
  | "order" | "kitchen" | "ready" | "delivery";

export interface WaterDropToast {
  id: string;
  type: NotifyType;
  title?: string;
  message?: string;
  duration?: number; // ms — default 4000
}

interface NotifyOptions {
  type?: NotifyType;
  title?: string;
  message?: string;
  duration?: number;
}

interface NotifyContextValue {
  notify: (opts: NotifyOptions) => string;
  dismiss: (id: string) => void;
}

const Ctx = createContext<NotifyContextValue | null>(null);

let _counter = 0;

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<WaterDropToast[]>([]);
  // Keep max 3 visible at once — newest on top
  const MAX = 3;

  const notify = useCallback((opts: NotifyOptions): string => {
    const id = `wdn-${++_counter}`;
    setToasts(prev => {
      const next: WaterDropToast = {
        id,
        type: opts.type ?? "info",
        title: opts.title,
        message: opts.message,
        duration: opts.duration ?? 4000,
      };
      // Prepend — newest first, cap at MAX
      const updated = [next, ...prev].slice(0, MAX);
      return updated;
    });
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ notify, dismiss }}>
      {children}

      {/* ── Notification layer ── */}
      <div className="fixed inset-0 pointer-events-none z-[9998]" aria-live="polite">
        <AnimatePresence mode="sync">
          {toasts.map((t, i) => (
            <WaterDropNotification
              key={t.id}
              toast={t}
              index={i}
              onDone={dismiss}
            />
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useNotify(): NotifyContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotify must be inside <NotifyProvider>");
  return ctx;
}
