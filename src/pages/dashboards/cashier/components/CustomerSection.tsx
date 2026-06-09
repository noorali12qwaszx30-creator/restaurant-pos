import { useState, useRef, useEffect } from "react";
import { Phone, User, MapPin, Check, ChevronDown, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_CUSTOMERS } from "@/data/mock-customers";
import type { PreviousCustomer } from "@/data/mock-customers";
import { DELIVERY_ZONES } from "@/data/mock-zones";
import { cn } from "@/lib/utils";

export interface CustomerData {
  name: string;
  phone: string;
  address: string;
  zoneId?: string;
}

interface Props {
  value: CustomerData;
  showAddress: boolean;          // true = delivery → show zone picker
  onChange: (data: Partial<CustomerData>) => void;
  onZoneFeeChange?: (fee: number) => void;
}

const PHONE_LENGTH = 11;

function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").toLowerCase().trim();
}

// Shared field height — all boxes equal
const FIELD = cn(
  "w-full h-12 bg-surface-elevated border border-border rounded-xl px-3 text-sm text-text-primary",
  "placeholder:text-text-muted outline-none transition-all duration-200",
  "focus:ring-2 focus:ring-primary/25 focus:border-primary"
);

// ─────────────────────────────────────────────────────────────
export function CustomerSection({ value, showAddress, onChange, onZoneFeeChange }: Props) {
  const [nameSuggestions, setNameSuggestions] = useState<PreviousCustomer[]>([]);
  const [phoneSuggestions, setPhoneSuggestions] = useState<PreviousCustomer[]>([]);
  const [showNameDrop,  setShowNameDrop]  = useState(false);
  const [showPhoneDrop, setShowPhoneDrop] = useState(false);
  const [showZoneDrop,  setShowZoneDrop]  = useState(false);
  const [phoneDone, setPhoneDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowNameDrop(false);
        setShowPhoneDrop(false);
        setShowZoneDrop(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // phone done animation
  useEffect(() => {
    if (value.phone.replace(/\D/g, "").length === PHONE_LENGTH) {
      setPhoneDone(true);
      const t = setTimeout(() => setPhoneDone(false), 2000);
      return () => clearTimeout(t);
    }
  }, [value.phone]);

  /* ── handlers ── */
  function handleNameChange(v: string) {
    onChange({ name: v });
    if (v.length >= 1) {
      const q = normalizeAr(v);
      const m = MOCK_CUSTOMERS.filter(c => normalizeAr(c.name).includes(q)).slice(0, 5);
      setNameSuggestions(m);
      setShowNameDrop(m.length > 0);
    } else {
      setShowNameDrop(false);
    }
  }

  function handlePhoneChange(raw: string) {
    // digits only, max 11
    const digits = raw.replace(/\D/g, "").slice(0, PHONE_LENGTH);
    onChange({ phone: digits });
    if (digits.length >= 4) {
      const m = MOCK_CUSTOMERS.filter(c => c.phone.includes(digits)).slice(0, 5);
      setPhoneSuggestions(m);
      setShowPhoneDrop(m.length > 0);
    } else {
      setShowPhoneDrop(false);
    }
  }

  function selectCustomer(c: PreviousCustomer) {
    onChange({ name: c.name, phone: c.phone, address: c.address ?? "" });
    setShowNameDrop(false);
    setShowPhoneDrop(false);
  }

  function selectZone(zoneId: string) {
    const zone = DELIVERY_ZONES.find(z => z.id === zoneId);
    onChange({ zoneId, address: zone?.name ?? "" });
    onZoneFeeChange?.(zone?.fee ?? 0);
    setShowZoneDrop(false);
  }

  const phoneDigits  = value.phone.replace(/\D/g, "");
  const phoneCount   = phoneDigits.length;
  const phoneValid   = phoneCount === PHONE_LENGTH;
  const phonePartial = phoneCount > 0 && !phoneValid;
  const selectedZone = DELIVERY_ZONES.find(z => z.id === value.zoneId);

  /* ── suggestion dropdown ── */
  function SuggestionDrop({ items, onSelect }: { items: PreviousCustomer[]; onSelect: (c: PreviousCustomer) => void }) {
    return (
      <div className="absolute top-full mt-1 inset-x-0 z-50 bg-surface border border-border rounded-xl shadow-elevated overflow-hidden">
        {items.map(c => (
          <button
            key={c.id}
            onMouseDown={e => { e.preventDefault(); onSelect(c); }}
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
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">

      {/* ── Row 1: Name (full width) ── */}
      <div className="relative">
        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10" />
        <input
          value={value.name}
          onChange={e => handleNameChange(e.target.value)}
          onFocus={() => value.name.length >= 1 && setShowNameDrop(nameSuggestions.length > 0)}
          placeholder="اسم الزبون"
          className={cn(FIELD, "pr-9")}
          autoComplete="off"
        />
        {showNameDrop && <SuggestionDrop items={nameSuggestions} onSelect={selectCustomer} />}
      </div>

      {/* ── Row 2: Phone (full width) with live counter ── */}
      <div className="relative">
        {/* left icon: changes to animated ✓ when done */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <AnimatePresence mode="wait">
            {phoneValid ? (
              <motion.div key="ok"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                <Check className="w-4 h-4 text-status-success" />
              </motion.div>
            ) : (
              <motion.div key="phone" initial={{ scale: 1 }} exit={{ scale: 0 }}>
                <Phone className="w-4 h-4 text-text-muted" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* digit counter badge */}
        <AnimatePresence>
          {phoneCount > 0 && (
            <motion.span
              key="counter"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-10",
                "text-[11px] font-bold tabular-nums leading-none",
                "px-1.5 py-0.5 rounded-md border transition-colors duration-300",
                phoneValid
                  ? "bg-status-success/15 text-status-success border-status-success/30"
                  : "bg-surface-elevated text-text-muted border-border"
              )}
            >
              {phoneCount}/{PHONE_LENGTH}
            </motion.span>
          )}
        </AnimatePresence>

        <motion.input
          value={value.phone}
          onChange={e => handlePhoneChange(e.target.value)}
          onFocus={() => phoneCount >= 4 && setShowPhoneDrop(phoneSuggestions.length > 0)}
          placeholder="رقم الهاتف (11 رقم)"
          inputMode="tel"
          dir="ltr"
          maxLength={PHONE_LENGTH}
          animate={phoneDone ? { scale: [1, 1.025, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={cn(
            FIELD, "pr-9 text-right tracking-widest",
            phoneCount > 0 && "pl-14",          // make room for counter
            phoneValid && "border-status-success/50 focus:ring-status-success/20 focus:border-status-success",
            phonePartial && phoneCount > 3 && "border-status-warning/40"
          )}
          autoComplete="off"
        />

        {/* progress bar under phone field */}
        <div className="absolute bottom-0 inset-x-3 h-[2px] rounded-full overflow-hidden bg-border/50">
          <motion.div
            className={cn(
              "h-full rounded-full origin-left",
              phoneValid ? "bg-status-success" : phoneCount > 7 ? "bg-status-warning" : "bg-primary/60"
            )}
            animate={{ scaleX: phoneCount / PHONE_LENGTH }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ transformOrigin: "right" }}    /* RTL: fill from right */
          />
        </div>

        {showPhoneDrop && <SuggestionDrop items={phoneSuggestions} onSelect={selectCustomer} />}
      </div>

      {/* ── Row 3: Zone selector (delivery only) ── */}
      {showAddress && (
        <div className="relative">
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10" />
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10" />

          <button
            type="button"
            onClick={() => setShowZoneDrop(v => !v)}
            className={cn(
              FIELD,
              "w-full flex items-center pr-9 pl-9 text-start cursor-pointer",
              selectedZone ? "text-text-primary" : "text-text-muted",
              showZoneDrop && "ring-2 ring-primary/25 border-primary"
            )}
          >
            {selectedZone ? (
              <span className="flex items-center justify-between w-full">
                <span className="font-medium">{selectedZone.name}</span>
                <span className="text-xs text-primary font-bold bg-primary/10 rounded-lg px-2 py-0.5 me-1">
                  +{selectedZone.fee.toLocaleString("ar-IQ")} د.ع
                </span>
              </span>
            ) : (
              <span>اختر منطقة التوصيل</span>
            )}
          </button>

          {/* Zone dropdown */}
          <AnimatePresence>
            {showZoneDrop && (
              <motion.div
                initial={{ opacity: 0, y: -6, scaleY: 0.92 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -6, scaleY: 0.92 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                style={{ transformOrigin: "top" }}
                className="absolute top-full mt-1 inset-x-0 z-50 bg-surface border border-border rounded-xl shadow-elevated overflow-hidden max-h-56 overflow-y-auto"
              >
                {DELIVERY_ZONES.map(zone => (
                  <button
                    key={zone.id}
                    onMouseDown={e => { e.preventDefault(); selectZone(zone.id); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 transition-colors border-b border-border last:border-0",
                      "hover:bg-surface-elevated text-start",
                      value.zoneId === zone.id && "bg-primary/8 text-primary"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      <span className="text-sm font-medium">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        {zone.estimatedMinutes} د
                      </span>
                      <span className="text-xs font-bold text-primary bg-primary/10 rounded-lg px-2 py-0.5">
                        {zone.fee.toLocaleString("ar-IQ")} د.ع
                      </span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Phone validation hint */}
      <AnimatePresence>
        {phonePartial && phoneCount > 3 && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-status-warning px-1"
          >
            رقم الهاتف يجب أن يكون 11 رقماً · متبقي {PHONE_LENGTH - phoneCount}
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  );
}
