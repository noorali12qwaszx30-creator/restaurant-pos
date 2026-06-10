import { useState, useRef, useEffect, useMemo } from "react";
import { Phone, User, MapPin, Check, ChevronDown, UserCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";
import { useOrders } from "@/contexts/OrderContext";
import { cn } from "@/lib/utils";

export interface CustomerData {
  name: string;
  phone: string;
  address: string;
  zoneId?: string;
}

// Customer record derived from real past orders
interface KnownCustomer {
  name: string;
  phone: string;
  address: string;
  zoneId?: string;
  totalOrders: number;
  lastOrderTotal: number;
}

interface Props {
  value: CustomerData;
  showAddress: boolean;          // true = delivery → show zone picker
  onChange: (data: Partial<CustomerData>) => void;
  onZoneFeeChange?: (fee: number) => void;
}

const PHONE_LENGTH = 11;

// Shared field height — all boxes equal
const FIELD = cn(
  "w-full h-12 bg-surface-elevated border border-border rounded-xl px-3 text-sm text-text-primary",
  "placeholder:text-text-muted outline-none transition-all duration-200",
  "focus:ring-2 focus:ring-primary/25 focus:border-primary"
);

// ─────────────────────────────────────────────────────────────
export function CustomerSection({ value, showAddress, onChange, onZoneFeeChange }: Props) {
  const { orders } = useOrders();
  const { zones: DELIVERY_ZONES } = useSettings();
  const [showZoneDrop,  setShowZoneDrop]  = useState(false);
  const [phoneDone,     setPhoneDone]     = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<KnownCustomer | null>(null);
  const [dismissed,     setDismissed]     = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build a lookup map: phone → KnownCustomer from real orders
  const customerMap = useMemo(() => {
    const map = new Map<string, KnownCustomer>();
    for (const o of orders) {
      const phone = o.customerPhone?.replace(/\D/g, "");
      if (!phone || !o.customerName) continue;
      const existing = map.get(phone);
      if (existing) {
        existing.totalOrders += 1;
        // keep latest address/zone
        if (o.deliveryAddress) existing.address = o.deliveryAddress;
      } else {
        // find zone by matching address name
        const matchedZone = DELIVERY_ZONES.find(z => z.name === o.deliveryAddress);
        map.set(phone, {
          name: o.customerName,
          phone,
          address: o.deliveryAddress ?? "",
          zoneId: matchedZone?.id,
          totalOrders: 1,
          lastOrderTotal: o.total,
        });
      }
    }
    return map;
  }, [orders]);

  // close zone dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowZoneDrop(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // phone done animation + live customer lookup on every digit
  useEffect(() => {
    const digits = value.phone.replace(/\D/g, "");
    const len = digits.length;

    if (len === PHONE_LENGTH) {
      setPhoneDone(true);
      const t = setTimeout(() => setPhoneDone(false), 2000);
      return () => clearTimeout(t);
    }
  }, [value.phone]);

  useEffect(() => {
    const digits = value.phone.replace(/\D/g, "");
    if (dismissed) return;
    if (digits.length < 4) { setFoundCustomer(null); return; }

    // Live search: find first customer whose phone starts with typed digits
    let match: KnownCustomer | null = null;
    for (const [phone, c] of customerMap.entries()) {
      if (phone.startsWith(digits)) { match = c; break; }
    }
    setFoundCustomer(match);
  }, [value.phone, customerMap, dismissed]);

  // reset dismiss when phone field is cleared
  useEffect(() => {
    if (value.phone.length === 0) setDismissed(false);
  }, [value.phone]);

  /* ── handlers ── */
  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, PHONE_LENGTH);
    onChange({ phone: digits });
  }

  function applyFoundCustomer() {
    if (!foundCustomer) return;
    onChange({
      name:    foundCustomer.name,
      phone:   foundCustomer.phone,
      address: foundCustomer.address,
      zoneId:  foundCustomer.zoneId,
    });
    if (foundCustomer.zoneId) {
      const zone = DELIVERY_ZONES.find(z => z.id === foundCustomer.zoneId);
      if (zone) onZoneFeeChange?.(zone.fee);
    }
    setFoundCustomer(null);
    setDismissed(true);
  }

  function dismissFound() {
    setFoundCustomer(null);
    setDismissed(true);
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

  return (
    <div ref={containerRef} className="flex flex-col gap-2">

      {/* ── Row 1: Name ── */}
      <div className="relative">
        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10" />
        <input
          value={value.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="اسم الزبون"
          className={cn(FIELD, "pr-9")}
          autoComplete="off"
        />
      </div>

      {/* ── Row 2: Phone with live counter ── */}
      <div className="relative">
        {/* icon: ✓ when complete */}
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
          placeholder="رقم الهاتف (11 رقم)"
          inputMode="tel"
          dir="ltr"
          maxLength={PHONE_LENGTH}
          animate={phoneDone ? { scale: [1, 1.025, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={cn(
            FIELD, "pr-9 text-right tracking-widest",
            phoneCount > 0 && "pl-14",
            phoneValid && "border-status-success/50 focus:ring-status-success/20 focus:border-status-success",
            phonePartial && phoneCount > 3 && "border-status-warning/40"
          )}
          autoComplete="off"
        />

        {/* progress bar */}
        <div className="absolute bottom-0 inset-x-3 h-[2px] rounded-full overflow-hidden bg-border/50">
          <motion.div
            className={cn(
              "h-full rounded-full",
              phoneValid ? "bg-status-success" : phoneCount > 7 ? "bg-status-warning" : "bg-primary/60"
            )}
            animate={{ scaleX: phoneCount / PHONE_LENGTH }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ transformOrigin: "right" }}
          />
        </div>
      </div>

      {/* ── Found customer banner ── */}
      <AnimatePresence>
        {foundCustomer && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/6 px-3 py-3 flex items-center gap-3"
          >
            {/* animated shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-l from-primary/8 via-transparent to-transparent pointer-events-none"
              animate={{ x: ["100%", "-100%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />

            {/* avatar */}
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>

            {/* info */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-primary uppercase tracking-wide mb-0.5">
                زبون معروف · {foundCustomer.totalOrders} طلب سابق
              </p>
              <p className="text-sm font-semibold text-text-primary truncate">{foundCustomer.name}</p>
              {foundCustomer.address && (
                <p className="text-xs text-text-muted truncate">{foundCustomer.address}</p>
              )}
            </div>

            {/* actions */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); applyFoundCustomer(); }}
                className="h-8 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                تعبئة تلقائية
              </button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); dismissFound(); }}
                className="h-8 px-3 rounded-xl bg-border/60 text-text-muted text-xs font-medium hover:bg-border transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" /> تجاهل
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        {phonePartial && phoneCount > 3 && !foundCustomer && (
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
