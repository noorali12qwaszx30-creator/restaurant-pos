import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (zoneId: string) => void;
}

function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
}

export function DeliveryZoneCombobox({ value, onChange }: Props) {
  const { zones } = useSettings();
  const activeZones = zones.filter(z => z.is_active);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = activeZones.find(z => z.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = search
    ? activeZones.filter((z) => normalizeAr(z.name).includes(normalizeAr(search)))
    : activeZones;

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-3 rounded-xl border-2 bg-surface-elevated transition-all text-start",
          open ? "border-primary" : "border-border hover:border-border/60"
        )}
      >
        <MapPin className="w-4 h-4 text-text-muted shrink-0" />
        <span className={cn("flex-1 text-sm", selected ? "text-text-primary font-medium" : "text-text-muted")}>
          {selected ? selected.name : "اختر منطقة التوصيل..."}
        </span>
        {selected && (
          <span className="text-xs font-medium text-status-info bg-status-info/10 rounded-full px-2 py-0.5 shrink-0">
            {selected.fee} د.ع
          </span>
        )}
        <ChevronDown className={cn("w-4 h-4 text-text-muted shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 inset-x-0 z-50 bg-surface border border-border rounded-xl shadow-elevated overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المناطق..."
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filtered.map((z) => (
              <ZoneRow key={z.id} zone={z} selected={value === z.id} onSelect={handleSelect} />
            ))}

            {filtered.length === 0 && (
              <p className="text-center text-sm text-text-muted py-4">لا توجد نتائج</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ZoneRow({
  zone,
  selected,
  onSelect,
}: {
  zone: { id: string; name: string; fee: number; estimatedMinutes?: number };
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSelect(zone.id); }}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-elevated transition-colors text-start",
        selected && "bg-primary/5"
      )}
    >
      <MapPin className={cn("w-3.5 h-3.5 shrink-0", selected ? "text-primary" : "text-text-muted")} />
      <span className={cn("flex-1 text-sm", selected ? "text-primary font-medium" : "text-text-primary")}>
        {zone.name}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-medium text-status-info">{zone.fee} د.ع</span>
      </div>
    </button>
  );
}
