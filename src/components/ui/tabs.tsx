import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (v: string) => void;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);
const useTabsCtx = () => {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs context missing");
  return ctx;
};

interface TabsProps { defaultValue?: string; value?: string; onValueChange?: (v: string) => void; children: React.ReactNode; className?: string; }
function Tabs({ defaultValue = "", value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const active = value ?? internal;
  const set = onValueChange ?? setInternal;
  return (
    <TabsContext.Provider value={{ value: active, onValueChange: set }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex gap-1 bg-surface-elevated p-1 rounded-xl border border-border", className)}>
      {children}
    </div>
  );
}

function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: active, onValueChange } = useTabsCtx();
  const isActive = active === value;
  return (
    <button
      onClick={() => onValueChange(value)}
      className={cn(
        "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-surface text-text-primary shadow-card"
          : "text-text-muted hover:text-text-secondary",
        className
      )}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: active } = useTabsCtx();
  if (active !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
