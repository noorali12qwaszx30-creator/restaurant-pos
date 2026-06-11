/**
 * SettingsContext — single source of truth for:
 *  • delivery zones  (Supabase delivery_areas table)
 *  • cancellation reasons (Supabase cancellation_reasons)
 *  • issue reasons        (Supabase issue_reasons)
 *  • notification prefs   (localStorage)
 *
 * Multi-tenant: all queries filtered by restaurantId from AuthContext.
 */
import {
  createContext, useContext, useEffect, useState,
  useCallback, type ReactNode,
} from "react";
import { IS_DEV_MODE } from "@/lib/dev-mock";
import {
  getDeliveryAreas, upsertDeliveryArea, deleteDeliveryArea,
  getCancellationReasons, upsertCancellationReason, deleteCancellationReason,
  getIssueReasons, upsertIssueReason, deleteIssueReason,
  getAllProfiles, toggleProfileActive,
  getMenuItems, toggleMenuItemAvailability,
} from "@/integrations/supabase/queries";
import type {
  DeliveryArea, CancellationReason, IssueReason, Profile, MenuItem,
} from "@/integrations/supabase/types";
import { useAuth } from "./AuthContext";

/* ── Notification defaults ─────────────────────────────────── */
const NOTIF_KEY = "rms:notifications";
const NOTIF_DEFAULTS = {
  newOrder: true, orderReady: true, newIssue: true,
  cancelled: true, delayed: false, sound: true,
};
type NotifSettings = typeof NOTIF_DEFAULTS;

/* ── Dev-mode fallback data ────────────────────────────────── */
const DEV_ZONES: DeliveryArea[] = [
  { id:"z1", name:"العليا",       fee:10, is_active:true, sort_order:1,  restaurant_id:null, created_at:"" },
  { id:"z2", name:"الملقا",       fee:12, is_active:true, sort_order:2,  restaurant_id:null, created_at:"" },
  { id:"z3", name:"النزهة",       fee:15, is_active:true, sort_order:3,  restaurant_id:null, created_at:"" },
  { id:"z4", name:"الروضة",       fee:18, is_active:true, sort_order:4,  restaurant_id:null, created_at:"" },
  { id:"z5", name:"الصفا",        fee:20, is_active:true, sort_order:5,  restaurant_id:null, created_at:"" },
  { id:"z6", name:"حي الربيع",   fee:12, is_active:true, sort_order:6,  restaurant_id:null, created_at:"" },
  { id:"z7", name:"حي الورود",   fee:14, is_active:true, sort_order:7,  restaurant_id:null, created_at:"" },
  { id:"z8", name:"حي الصحافة",  fee:16, is_active:true, sort_order:8,  restaurant_id:null, created_at:"" },
  { id:"z9", name:"حي الغدير",   fee:18, is_active:true, sort_order:9,  restaurant_id:null, created_at:"" },
  { id:"z10",name:"حي اليرموك",  fee:22, is_active:true, sort_order:10, restaurant_id:null, created_at:"" },
];
const DEV_CANCEL: CancellationReason[] = [
  { id:"c1",text:"الزبون غير موجود",      is_active:true, restaurant_id:null, created_at:"" },
  { id:"c2",text:"خطأ في الطلب",          is_active:true, restaurant_id:null, created_at:"" },
  { id:"c3",text:"لا يوجد سائق",          is_active:true, restaurant_id:null, created_at:"" },
  { id:"c4",text:"إغلاق المطعم مبكراً",  is_active:true, restaurant_id:null, created_at:"" },
  { id:"c5",text:"طلب مكرر",              is_active:true, restaurant_id:null, created_at:"" },
];
const DEV_ISSUES: IssueReason[] = [
  { id:"i1",text:"طلب ناقص",           is_active:true, restaurant_id:null, created_at:"" },
  { id:"i2",text:"طلب خاطئ",           is_active:true, restaurant_id:null, created_at:"" },
  { id:"i3",text:"تأخر التوصيل",       is_active:true, restaurant_id:null, created_at:"" },
  { id:"i4",text:"مشكلة في الجودة",    is_active:true, restaurant_id:null, created_at:"" },
  { id:"i5",text:"سائق غير متجاوب",   is_active:true, restaurant_id:null, created_at:"" },
];
const DEV_PROFILES: Profile[] = [
  { id:"p1", username:"admin",    display_name:"مدير النظام",   role:"admin",    roles:["admin"],    is_active:true, phone:null, avatar_url:null, restaurant_id:null, created_at:"", updated_at:"" },
  { id:"p2", username:"cashier1", display_name:"كاشير 1",       role:"cashier",  roles:["cashier"],  is_active:true, phone:null, avatar_url:null, restaurant_id:null, created_at:"", updated_at:"" },
  { id:"p3", username:"cashier2", display_name:"كاشير 2",       role:"cashier",  roles:["cashier"],  is_active:true, phone:null, avatar_url:null, restaurant_id:null, created_at:"", updated_at:"" },
  { id:"p4", username:"field1",   display_name:"موظف الميدان",  role:"field",    roles:["field"],    is_active:true, phone:null, avatar_url:null, restaurant_id:null, created_at:"", updated_at:"" },
  { id:"p5", username:"driver1",  display_name:"سائق 1",        role:"delivery", roles:["delivery"], is_active:true, phone:"0501111111", avatar_url:null, restaurant_id:null, created_at:"", updated_at:"" },
  { id:"p6", username:"driver2",  display_name:"سائق 2",        role:"delivery", roles:["delivery"], is_active:false, phone:"0502222222", avatar_url:null, restaurant_id:null, created_at:"", updated_at:"" },
  { id:"p7", username:"kitchen1", display_name:"طاهٍ 1",        role:"kitchen",  roles:["kitchen"],  is_active:true, phone:null, avatar_url:null, restaurant_id:null, created_at:"", updated_at:"" },
];

/* ── Context type ──────────────────────────────────────────── */
interface SettingsContextValue {
  zones:               DeliveryArea[];
  cancelReasons:       CancellationReason[];
  issueReasons:        IssueReason[];
  profiles:            Profile[];
  menuItems:           MenuItem[];
  notifications:       NotifSettings;
  isLoading:           boolean;

  addZone(name: string, fee: number): Promise<void>;
  updateZone(id: string, patch: Partial<Pick<DeliveryArea,"name"|"fee"|"is_active">>): Promise<void>;
  removeZone(id: string): Promise<void>;

  addCancelReason(text: string): Promise<void>;
  updateCancelReason(id: string, text: string): Promise<void>;
  removeCancelReason(id: string): Promise<void>;

  addIssueReason(text: string): Promise<void>;
  updateIssueReason(id: string, text: string): Promise<void>;
  removeIssueReason(id: string): Promise<void>;

  toggleProfile(id: string, is_active: boolean): Promise<void>;
  toggleMenuItem(id: string, is_available: boolean): Promise<void>;
  toggleNotif(key: keyof NotifSettings): void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurantId ?? null;

  const [zones,         setZones]         = useState<DeliveryArea[]>([]);
  const [cancelReasons, setCancelReasons] = useState<CancellationReason[]>([]);
  const [issueReasons,  setIssueReasons]  = useState<IssueReason[]>([]);
  const [profiles,      setProfiles]      = useState<Profile[]>([]);
  const [menuItems,     setMenuItems]     = useState<MenuItem[]>([]);
  const [notifications, setNotifications] = useState<NotifSettings>(() => {
    try { return { ...NOTIF_DEFAULTS, ...JSON.parse(localStorage.getItem(NOTIF_KEY) ?? "{}") }; }
    catch { return NOTIF_DEFAULTS; }
  });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (IS_DEV_MODE) {
      setZones(DEV_ZONES);
      setCancelReasons(DEV_CANCEL);
      setIssueReasons(DEV_ISSUES);
      setProfiles(DEV_PROFILES);
      setMenuItems([]);
      setIsLoading(false);
      return;
    }
    try {
      const [z, c, i, p, m] = await Promise.all([
        getDeliveryAreas(restaurantId),
        getCancellationReasons(restaurantId),
        getIssueReasons(restaurantId),
        getAllProfiles(restaurantId),
        getMenuItems(restaurantId),
      ]);
      setZones(z);
      setCancelReasons(c);
      setIssueReasons(i);
      setProfiles(p);
      setMenuItems(m);
    } catch (e) {
      console.error("[SettingsContext] load error", e);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  /* ── zone ops ─────────────────────────────────────────── */
  const addZone = async (name: string, fee: number) => {
    if (IS_DEV_MODE) {
      const next: DeliveryArea = { id:`z${Date.now()}`, name, fee, is_active:true, sort_order:zones.length+1, restaurant_id:null, created_at:"" };
      setZones(p => [...p, next]); return;
    }
    const z = await upsertDeliveryArea({ name, fee, sort_order: zones.length + 1 }, restaurantId);
    setZones(p => [...p, z]);
  };

  const updateZone = async (id: string, patch: Partial<Pick<DeliveryArea,"name"|"fee"|"is_active">>) => {
    setZones(p => p.map(z => z.id === id ? { ...z, ...patch } : z));
    if (!IS_DEV_MODE) {
      const existing = zones.find(z => z.id === id);
      if (existing) await upsertDeliveryArea({ id, name: existing.name, fee: existing.fee, ...patch }, restaurantId);
    }
  };

  const removeZone = async (id: string) => {
    setZones(p => p.filter(z => z.id !== id));
    if (!IS_DEV_MODE) await deleteDeliveryArea(id);
  };

  /* ── cancel reason ops ───────────────────────────────── */
  const addCancelReason = async (text: string) => {
    if (IS_DEV_MODE) { setCancelReasons(p => [...p, { id:`c${Date.now()}`, text, is_active:true, restaurant_id:null, created_at:"" }]); return; }
    const r = await upsertCancellationReason({ text }, restaurantId);
    setCancelReasons(p => [...p, r]);
  };
  const updateCancelReason = async (id: string, text: string) => {
    setCancelReasons(p => p.map(r => r.id === id ? { ...r, text } : r));
    if (!IS_DEV_MODE) await upsertCancellationReason({ id, text }, restaurantId);
  };
  const removeCancelReason = async (id: string) => {
    setCancelReasons(p => p.filter(r => r.id !== id));
    if (!IS_DEV_MODE) await deleteCancellationReason(id);
  };

  /* ── issue reason ops ────────────────────────────────── */
  const addIssueReason = async (text: string) => {
    if (IS_DEV_MODE) { setIssueReasons(p => [...p, { id:`i${Date.now()}`, text, is_active:true, restaurant_id:null, created_at:"" }]); return; }
    const r = await upsertIssueReason({ text }, restaurantId);
    setIssueReasons(p => [...p, r]);
  };
  const updateIssueReason = async (id: string, text: string) => {
    setIssueReasons(p => p.map(r => r.id === id ? { ...r, text } : r));
    if (!IS_DEV_MODE) await upsertIssueReason({ id, text }, restaurantId);
  };
  const removeIssueReason = async (id: string) => {
    setIssueReasons(p => p.filter(r => r.id !== id));
    if (!IS_DEV_MODE) await deleteIssueReason(id);
  };

  /* ── profile ops ─────────────────────────────────────── */
  const toggleProfile = async (id: string, is_active: boolean) => {
    setProfiles(p => p.map(u => u.id === id ? { ...u, is_active } : u));
    if (!IS_DEV_MODE) await toggleProfileActive(id, is_active);
  };

  /* ── menu ops ────────────────────────────────────────── */
  const toggleMenuItem = async (id: string, is_available: boolean) => {
    setMenuItems(p => p.map(m => m.id === id ? { ...m, is_available } : m));
    if (!IS_DEV_MODE) await toggleMenuItemAvailability(id, is_available);
  };

  /* ── notification ops ────────────────────────────────── */
  const toggleNotif = (key: keyof NotifSettings) => {
    setNotifications(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value: SettingsContextValue = {
    zones, cancelReasons, issueReasons, profiles, menuItems, notifications, isLoading,
    addZone, updateZone, removeZone,
    addCancelReason, updateCancelReason, removeCancelReason,
    addIssueReason, updateIssueReason, removeIssueReason,
    toggleProfile, toggleMenuItem, toggleNotif,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
