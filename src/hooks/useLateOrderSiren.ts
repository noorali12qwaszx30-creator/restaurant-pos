import { useEffect, useRef, useCallback, useState } from "react";

export type AlarmLevel = 0 | 1 | 2 | 3; // 0=none, 1=warn15, 2=warn25, 3=critical40

function ageMin(createdAt: Date) {
  return Math.floor((Date.now() - createdAt.getTime()) / 60000);
}

function getLevel(ageMinutes: number): AlarmLevel {
  if (ageMinutes >= 40) return 3;
  if (ageMinutes >= 25) return 2;
  if (ageMinutes >= 15) return 1;
  return 0;
}

/** Generate a beep tone using Web Audio API */
function playBeep(
  ctx: AudioContext,
  freq: number,
  duration: number,
  gain: number
) {
  const osc  = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.value = freq;
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - 0.01);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** Play an urgent double-beep pattern */
function playSiren(ctx: AudioContext) {
  playBeep(ctx, 880, 0.18, 0.35);
  setTimeout(() => playBeep(ctx, 1100, 0.18, 0.35), 220);
}

interface LateOrderSirenOptions {
  /** Orders currently in kitchen queue */
  orders: { id: string; createdAt: Date }[];
}

export function useLateOrderSiren({ orders }: LateOrderSirenOptions) {
  const [armed, setArmed]       = useState(true);
  const [maxLevel, setMaxLevel] = useState<AlarmLevel>(0);
  const audioCtxRef             = useRef<AudioContext | null>(null);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute max level across all orders
  useEffect(() => {
    const levels = orders.map(o => getLevel(ageMin(o.createdAt)));
    const max = Math.max(0, ...levels) as AlarmLevel;
    setMaxLevel(max);
  }, [orders]);

  // Periodic siren for critical (level 3)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (armed && maxLevel >= 3) {
      // Play immediately then every 30s
      const fire = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          try { audioCtxRef.current = new AudioContext(); } catch { return; }
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume().then(() => playSiren(ctx));
        else playSiren(ctx);
      };
      fire();
      intervalRef.current = setInterval(fire, 30000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [armed, maxLevel]);

  const toggle = useCallback(() => setArmed(p => !p), []);

  /** Get per-order alarm level */
  const getOrderLevel = useCallback(
    (createdAt: Date): AlarmLevel => getLevel(ageMin(createdAt)),
    []
  );

  return { armed, toggle, maxLevel, getOrderLevel };
}
