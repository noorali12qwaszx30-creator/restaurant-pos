import { useState, useRef, useEffect } from "react";
import { Phone, User, MapPin } from "lucide-react";
import { MOCK_CUSTOMERS } from "@/data/mock-customers";
import type { PreviousCustomer } from "@/data/mock-customers";
import { cn } from "@/lib/utils";

interface CustomerData {
  name: string;
  phone: string;
  address: string;
}

interface Props {
  value: CustomerData;
  showAddress: boolean;
  onChange: (data: Partial<CustomerData>) => void;
}

function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").toLowerCase().trim();
}

export function CustomerSection({ value, showAddress, onChange }: Props) {
  const [nameSuggestions, setNameSuggestions] = useState<PreviousCustomer[]>([]);
  const [phoneSuggestions, setPhoneSuggestions] = useState<PreviousCustomer[]>([]);
  const [showNameDrop, setShowNameDrop] = useState(false);
  const [showPhoneDrop, setShowPhoneDrop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowNameDrop(false);
        setShowPhoneDrop(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleNameChange(v: string) {
    onChange({ name: v });
    if (v.length >= 1) {
      const q = normalizeAr(v);
      const matches = MOCK_CUSTOMERS.filter((c) => normalizeAr(c.name).includes(q));
      setNameSuggestions(matches.slice(0, 5));
      setShowNameDrop(matches.length > 0);
    } else {
      setShowNameDrop(false);
    }
  }

  function handlePhoneChange(v: string) {
    onChange({ phone: v });
    if (v.length >= 4) {
      const matches = MOCK_CUSTOMERS.filter((c) => c.phone.includes(v));
      setPhoneSuggestions(matches.slice(0, 5));
      setShowPhoneDrop(matches.length > 0);
    } else {
      setShowPhoneDrop(false);
    }
  }

  function selectCustomer(c: PreviousCustomer) {
    onChange({ name: c.name, phone: c.phone, address: c.address ?? "" });
    setShowNameDrop(false);
    setShowPhoneDrop(false);
  }

  const SuggestionDrop = ({ items, onSelect }: { items: PreviousCustomer[]; onSelect: (c: PreviousCustomer) => void }) => (
    <div className="absolute top-full mt-1 inset-x-0 z-50 bg-surface border border-border rounded-xl shadow-elevated overflow-hidden">
      {items.map((c) => (
        <button
          key={c.id}
          onMouseDown={(e) => { e.preventDefault(); onSelect(c); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-elevated text-start transition-colors border-b border-border last:border-0"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{c.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
            <p className="text-xs text-text-muted" dir="ltr">{c.phone}</p>
          </div>
          <span className="text-xs text-text-muted shrink-0">{c.totalOrders} طلب</span>
        </button>
      ))}
    </div>
  );

  const fieldBase =
    "w-full bg-surface-elevated border border-border rounded-xl px-3 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {/* Name */}
      <div className="relative col-span-2 sm:col-span-1">
        <div className="relative">
          <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={value.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => value.name.length >= 1 && setShowNameDrop(nameSuggestions.length > 0)}
            placeholder="اسم الزبون"
            className={cn(fieldBase, "pr-9")}
            autoComplete="off"
          />
        </div>
        {showNameDrop && <SuggestionDrop items={nameSuggestions} onSelect={selectCustomer} />}
      </div>

      {/* Phone */}
      <div className="relative">
        <div className="relative">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={value.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onFocus={() => value.phone.length >= 4 && setShowPhoneDrop(phoneSuggestions.length > 0)}
            placeholder="رقم الهاتف"
            inputMode="tel"
            dir="ltr"
            className={cn(fieldBase, "pr-9 text-right")}
            autoComplete="off"
          />
        </div>
        {showPhoneDrop && <SuggestionDrop items={phoneSuggestions} onSelect={selectCustomer} />}
      </div>

      {/* Address - only when needed */}
      {showAddress && (
        <div className="col-span-2 sm:col-span-1 relative">
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="عنوان التوصيل"
            className={cn(fieldBase, "pr-9")}
          />
        </div>
      )}
    </div>
  );
}
