import { useState, useEffect } from "react";
import {
  Activity, Wifi, WifiOff, Clock, User, Shield,
  Bike, CreditCard, Map, ChefHat, RefreshCw, Eye
} from "lucide-react";
import { useOrders } from "@/contexts/OrderContext";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────── */
type OnlineStatus = "online" | "away" | "offline";

interface PresenceUser {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  status: OnlineStatus;
  lastSeen: Date;
  currentPage: string;
  ordersHandled: number;
  Icon: React.ElementType;
  color: string;
}

/* ─── Simulated presence data ────────────────────────────────── */
const SEED_USERS: Omit<PresenceUser, "status" | "lastSeen" | "ordersHandled" | "currentPage">[] = [
  { id: "u1", name: "أحمد السالم",    role: "admin",    roleLabel: "مدير",           Icon: Shield,     color: "text-purple-500"       },
  { id: "u2", name: "فاطمة العتيبي",  role: "cashier",  roleLabel: "كاشير",          Icon: CreditCard, color: "text-status-info"      },
  { id: "u3", name: "خالد المطيري",   role: "cashier",  roleLabel: "كاشير",          Icon: CreditCard, color: "text-status-info"      },
  { id: "u4", name: "نورة الزهراني",  role: "field",    roleLabel: "ميداني",         Icon: Map,        color: "text-status-warning"   },
  { id: "u5", name: "سعد الشمري",     role: "delivery", roleLabel: "سائق توصيل",     Icon: Bike,       color: "text-status-success"   },
  { id: "u6", name: "ليلى القحطاني",  role: "delivery", roleLabel: "سائق توصيل",     Icon: Bike,       color: "text-status-success"   },
  { id: "u7", name: "يوسف البقمي",    role: "kitchen",  roleLabel: "طاهٍ",           Icon: ChefHat,    color: "text-amber-500"        },
  { id: "u8", name: "هند الدوسري",    role: "kitchen",  roleLabel: "طاهٍ",           Icon: ChefHat,    color: "text-amber-500"        },
];

const PAGES: Record<string, string[]> = {
  admin:    ["لوحة المدير — الرئيسية", "لوحة المدير — الطلبات", "لوحة المدير — الإحصائيات"],
  cashier:  ["نقطة البيع", "تقارير الكاشير", "بحث الطلبات"],
  field:    ["طلبات الميدان", "مشاكل الميدان"],
  delivery: ["طلبات جديدة", "طلباتي النشطة", "إحصائياتي"],
  kitchen:  ["قائمة الطهي", "الأصناف"],
};

function randomStatus(): OnlineStatus {
  const r = Math.random();
  return r < 0.55 ? "online" : r < 0.75 ? "away" : "offline";
}

function generatePresence(): PresenceUser[] {
  return SEED_USERS.map(u => {
    const status = randomStatus();
    const lastSeen = status === "online"
      ? new Date(Date.now() - Math.floor(Math.random() * 120000))
      : status === "away"
      ? new Date(Date.now() - Math.floor(Math.random() * 900000 + 120000))
      : new Date(Date.now() - Math.floor(Math.random() * 86400000 + 900000));
    const pages = PAGES[u.role] ?? ["—"];
    return {
      ...u,
      status,
      lastSeen,
      currentPage: status !== "offline" ? pages[Math.floor(Math.random() * pages.length)] : "غير متصل",
      ordersHandled: Math.floor(Math.random() * 30),
    };
  });
}

/* ─── Components ─────────────────────────────────────────────── */
function lastSeenLabel(d: Date, status: OnlineStatus): string {
  if (status === "online") return "متصل الآن";
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  return h < 24 ? `منذ ${h} س` : `منذ ${Math.floor(h/24)} ي`;
}

function StatusDot({ status }: { status: OnlineStatus }) {
  return (
    <span className={cn("w-2 h-2 rounded-full shrink-0 inline-block", {
      "bg-status-success animate-pulse": status === "online",
      "bg-status-warning":               status === "away",
      "bg-border":                       status === "offline",
    })} />
  );
}

function UserCard({ user }: { user: PresenceUser }) {
  return (
    <div className={cn(
      "bg-surface border rounded-2xl p-3 shadow-card transition-all",
      user.status === "online"  ? "border-status-success/30" :
      user.status === "away"    ? "border-status-warning/25" : "border-border opacity-70"
    )}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center">
            <user.Icon className={cn("w-4.5 h-4.5", user.color)} />
          </div>
          <StatusDot status={user.status} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
            <span className="text-[10px] text-text-muted shrink-0">{lastSeenLabel(user.lastSeen, user.status)}</span>
          </div>
          <p className={cn("text-[10px] font-medium", user.color)}>{user.roleLabel}</p>
          {user.status !== "offline" && (
            <div className="flex items-center gap-1 mt-1">
              <Eye className="w-2.5 h-2.5 text-text-muted shrink-0" />
              <p className="text-[10px] text-text-muted truncate">{user.currentPage}</p>
            </div>
          )}
          <p className="text-[10px] text-text-muted mt-0.5">{user.ordersHandled} طلب اليوم</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export function AdminMonitoringPage() {
  const { orders: allOrders } = useOrders();
  const [users, setUsers]     = useState<PresenceUser[]>(() => generatePresence());
  const [lastRefresh, setLast] = useState(new Date());
  const [filter, setFilter]   = useState<"all" | "online" | "away" | "offline">("all");

  useEffect(() => {
    const id = setInterval(() => {
      setUsers(generatePresence());
      setLast(new Date());
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const online  = users.filter(u => u.status === "online");
  const away    = users.filter(u => u.status === "away");
  const offline = users.filter(u => u.status === "offline");

  const filtered = filter === "all" ? users
    : filter === "online"  ? online
    : filter === "away"    ? away
    : offline;

  // Active orders per role
  const activeOrders = allOrders.filter(o =>
    !["delivered","cancelled"].includes(o.status)
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-text-primary">المراقبة الحية</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3 text-text-muted" />
          <span className="text-[10px] text-text-muted">
            {lastRefresh.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-status-success/5 border border-status-success/20 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Wifi className="w-3 h-3 text-status-success" />
            <span className="text-xs font-bold text-status-success">متصل</span>
          </div>
          <p className="text-xl font-black text-status-success">{online.length}</p>
        </div>
        <div className="bg-status-warning/5 border border-status-warning/20 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock className="w-3 h-3 text-status-warning" />
            <span className="text-xs font-bold text-status-warning">بعيد</span>
          </div>
          <p className="text-xl font-black text-status-warning">{away.length}</p>
        </div>
        <div className="bg-surface-elevated border border-border rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <WifiOff className="w-3 h-3 text-text-muted" />
            <span className="text-xs font-bold text-text-muted">غير متصل</span>
          </div>
          <p className="text-xl font-black text-text-muted">{offline.length}</p>
        </div>
      </div>

      {/* Active orders overview */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-text-primary">الطلبات النشطة الآن</span>
          <span className="ml-auto text-xs font-bold text-primary">{activeOrders.length}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "انتظار",  val: activeOrders.filter(o => o.status === "pending").length,          color: "bg-status-warning/15 text-status-warning"  },
            { label: "تحضير",   val: activeOrders.filter(o => o.status === "preparing").length,        color: "bg-primary/15 text-primary"                 },
            { label: "جاهز",    val: activeOrders.filter(o => o.status === "ready").length,            color: "bg-status-success/15 text-status-success"  },
            { label: "توصيل",   val: activeOrders.filter(o => o.status === "out_for_delivery").length, color: "bg-status-info/15 text-status-info"         },
          ].map(s => (
            <div key={s.label} className={cn("rounded-lg px-2 py-1.5 text-center", s.color)}>
              <p className="text-sm font-bold">{s.val}</p>
              <p className="text-[9px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {([
          { id: "all",     label: "الكل" },
          { id: "online",  label: "متصل" },
          { id: "away",    label: "بعيد"  },
          { id: "offline", label: "غير متصل" },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("flex-1 py-1.5 rounded-xl border text-[11px] font-semibold transition-all",
              filter === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* User cards */}
      <div className="flex flex-col gap-2">
        {filtered.map(u => <UserCard key={u.id} user={u} />)}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <User className="w-8 h-8 text-text-muted" />
            <p className="text-sm text-text-muted">لا يوجد مستخدمون في هذه الحالة</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-text-muted text-center">يتحدث كل 15 ثانية · محاكاة Supabase Presence</p>
    </div>
  );
}
