import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "بحث...", className }: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute inset-y-0 end-3 my-auto w-4 h-4 text-text-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-10 rounded-xl border border-border bg-surface-elevated pe-9 ps-4 text-sm text-text-primary",
          "placeholder:text-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          "transition-colors"
        )}
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute inset-y-0 start-3 my-auto text-text-muted hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
