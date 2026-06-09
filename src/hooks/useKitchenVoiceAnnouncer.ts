import { useEffect, useRef, useCallback, useState } from "react";
import type { OrderType } from "@/integrations/supabase/types";

/** Builds an Arabic announcement string for a new order */
function buildMessage(orderId: string, type: OrderType): string {
  const num = orderId.replace(/^ORD-0*/, ""); // "ORD-007" → "7"
  const typePhrase =
    type === "delivery"  ? "للتوصيل"            :
    type === "takeaway"  ? "للاستلام من المحل"  :
                           "لطاولة داخلية"       ;
  return `وصل طلب جديد ${typePhrase}، رقم ${num}`;
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang  = "ar-SA";
  utt.rate  = 0.95;
  utt.pitch = 1;
  utt.volume = 1;
  // Try to pick an Arabic voice if available
  const voices = window.speechSynthesis.getVoices();
  const arVoice = voices.find(v => v.lang.startsWith("ar"));
  if (arVoice) utt.voice = arVoice;
  window.speechSynthesis.speak(utt);
}

interface VoiceAnnouncerOptions {
  orders: { id: string; type: OrderType; createdAt: Date }[];
  enabled?: boolean;
}

export function useKitchenVoiceAnnouncer({ orders, enabled = true }: VoiceAnnouncerOptions) {
  const seenIds  = useRef<Set<string>>(new Set());
  const isReady  = useRef(false);
  const [supported] = useState(() => "speechSynthesis" in window);

  // On first render, seed seenIds with current orders (don't announce old ones)
  useEffect(() => {
    if (!isReady.current) {
      orders.forEach(o => seenIds.current.add(o.id));
      isReady.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for brand-new orders (not yet seen)
  useEffect(() => {
    if (!enabled || !isReady.current) return;
    orders.forEach(o => {
      if (!seenIds.current.has(o.id)) {
        seenIds.current.add(o.id);
        speak(buildMessage(o.id, o.type));
      }
    });
  }, [orders, enabled]);

  /** Manual announcement (e.g. when order is ready) */
  const announce = useCallback((text: string) => {
    if (enabled) speak(text);
  }, [enabled]);

  return { announce, supported };
}
