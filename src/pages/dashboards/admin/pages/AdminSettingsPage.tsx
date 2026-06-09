import { useState } from "react";
import {
  Settings, UtensilsCrossed, Users, MapPin, XCircle, AlertTriangle,
  Bell, Trash2, Plus, Edit2, Check, X, ChevronDown, ChevronUp,
  Leaf, Soup, Flame, Sandwich, CupSoda, Cake, ToggleLeft, ToggleRight,
  ShieldAlert
} from "lucide-react";
import { useMenuData } from "@/hooks/useMenuData";
import { cn } from "@/lib/utils";

/* ─── Shared helpers ─────────────────────────────────────────── */
function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-elevated">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-text-primary">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function EditableList({ items, onChange, label }: {
  items: string[];
  onChange: (next: string[]) => void;
  label: string;
}) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const [adding, setAdding]   = useState(false);
  const [newVal, setNewVal]   = useState("");

  function startEdit(i: number) { setEditIdx(i); setEditVal(items[i]); }
  function saveEdit() {
    if (editIdx === null) return;
    const next = [...items]; next[editIdx] = editVal.trim() || items[editIdx];
    onChange(next); setEditIdx(null);
  }
  function removeItem(i: number) { onChange(items.filter((_, idx) => idx !== i)); }
  function addItem() {
    if (newVal.trim()) { onChange([...items, newVal.trim()]); setNewVal(""); setAdding(false); }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl px-3 py-2">
          {editIdx === i ? (
            <>
              <input value={editVal} onChange={e => setEditVal(e.target.value)}
                className="flex-1 text-xs bg-transparent outline-none text-text-primary" />
              <button onClick={saveEdit} className="text-status-success"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditIdx(null)} className="text-text-muted"><X className="w-3.5 h-3.5" /></button>
            </>
          ) : (
            <>
              <span className="flex-1 text-xs text-text-primary">{item}</span>
              <button onClick={() => startEdit(i)} className="text-text-muted hover:text-primary"><Edit2 className="w-3 h-3" /></button>
              <button onClick={() => removeItem(i)} className="text-text-muted hover:text-status-error"><X className="w-3 h-3" /></button>
            </>
          )}
        </div>
      ))}
      {adding ? (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/25 rounded-xl px-3 py-2">
          <input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder={`أدخل ${label}...`}
            onKeyDown={e => e.key === "Enter" && addItem()}
            className="flex-1 text-xs bg-transparent outline-none text-text-primary placeholder:text-text-muted" autoFocus />
          <button onClick={addItem} className="text-status-success"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setAdding(false); setNewVal(""); }} className="text-text-muted"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium py-1.5">
          <Plus className="w-3.5 h-3.5" />إضافة {label}
        </button>
      )}
    </div>
  );
}

/* ─── CATEGORY_ICONS (same map as elsewhere) ─────────────────── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  appetizers: Leaf, soups: Soup, mains: UtensilsCrossed,
  grills: Flame, sandwiches: Sandwich, drinks: CupSoda, desserts: Cake,
};

/* ─── Menu Tab ───────────────────────────────────────────────── */
function MenuTab() {
  const { items: menuItems, categories: menuCats } = useMenuData();
  const [availability, setAvail] = useState<Record<string, boolean>>({});
  const [catFilter, setCatFilter] = useState("all");

  // Initialise availability from loaded items (once)
  const availInit = (id: string, defaultVal: boolean) =>
    availability[id] !== undefined ? availability[id] : defaultVal;

  const cats = [{ id: "all", name: "الكل", icon: undefined }, ...menuCats.map(c => ({ id: c.id, name: c.name, icon: c.icon }))];
  const items = menuItems.filter(i => catFilter === "all" || i.category_id === catFilter);

  return (
    <div>
      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto mb-3" style={{ scrollbarWidth: "none" }}>
        {cats.map(c => {
          const Icon = c.icon ? CATEGORY_ICONS[c.icon] ?? CATEGORY_ICONS[c.id] : CATEGORY_ICONS[c.id];
          return (
            <button key={c.id} onClick={() => setCatFilter(c.id)}
              className={cn("shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                catFilter === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
              )}>
              {Icon && <Icon className="w-3 h-3" />}{c.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map(item => {
          const cat = menuCats.find(c => c.id === item.category_id);
          const catIcon = cat?.icon ?? item.category_id;
          const Icon = CATEGORY_ICONS[catIcon] ?? UtensilsCrossed;
          const avail = availInit(item.id, item.is_available);
          return (
            <div key={item.id}
              className={cn("flex items-center gap-3 bg-surface-elevated border rounded-xl px-3 py-2.5 transition-all",
                avail ? "border-border" : "border-status-error/25 opacity-60"
              )}>
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-text-muted/50" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{item.name}</p>
                <p className="text-[10px] text-text-muted">{cat?.name} · {Number(item.price).toLocaleString("ar-IQ")} د.ع</p>
              </div>
              <button onClick={() => setAvail(p => ({ ...p, [item.id]: !avail }))}
                className="shrink-0">
                {avail
                  ? <ToggleRight className="w-6 h-6 text-status-success" />
                  : <ToggleLeft className="w-6 h-6 text-text-muted" />
                }
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Users Tab ──────────────────────────────────────────────── */
const MOCK_USERS = [
  { id: "u1", name: "أحمد السالم",   role: "admin",    roleLabel: "مدير",       active: true  },
  { id: "u2", name: "فاطمة العتيبي", role: "cashier",  roleLabel: "كاشير",      active: true  },
  { id: "u3", name: "خالد المطيري",  role: "cashier",  roleLabel: "كاشير",      active: true  },
  { id: "u4", name: "نورة الزهراني", role: "field",    roleLabel: "ميداني",     active: true  },
  { id: "u5", name: "سعد الشمري",    role: "delivery", roleLabel: "سائق",       active: true  },
  { id: "u6", name: "ليلى القحطاني", role: "delivery", roleLabel: "سائق",       active: false },
  { id: "u7", name: "يوسف البقمي",   role: "kitchen",  roleLabel: "طاهٍ",       active: true  },
];

function UsersTab() {
  const [users, setUsers] = useState(MOCK_USERS);

  function toggleActive(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {users.map(u => (
        <div key={u.id} className={cn(
          "flex items-center gap-3 bg-surface-elevated border rounded-xl px-3 py-2.5 transition-all",
          u.active ? "border-border" : "border-border opacity-60"
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {u.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary">{u.name}</p>
            <p className="text-[10px] text-text-muted">{u.roleLabel}</p>
          </div>
          <button onClick={() => toggleActive(u.id)} className="shrink-0">
            {u.active
              ? <ToggleRight className="w-6 h-6 text-status-success" />
              : <ToggleLeft className="w-6 h-6 text-text-muted" />
            }
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Delivery Zones Tab ─────────────────────────────────────── */
interface Zone { id: string; name: string; fee: number; active: boolean; }

const SEED_ZONES: Zone[] = [
  { id: "z1", name: "حي العليا",    fee: 15, active: true  },
  { id: "z2", name: "حي النزهة",   fee: 10, active: true  },
  { id: "z3", name: "حي الملز",    fee: 12, active: true  },
  { id: "z4", name: "حي السليمانية",fee: 18, active: false },
  { id: "z5", name: "وسط المدينة", fee: 8,  active: true  },
];

function ZonesTab() {
  const [zones, setZones] = useState<Zone[]>(SEED_ZONES);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFee, setEditFee] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFee, setNewFee] = useState("");

  function startEdit(z: Zone) { setEditId(z.id); setEditName(z.name); setEditFee(String(z.fee)); }
  function saveEdit() {
    if (!editId) return;
    setZones(prev => prev.map(z => z.id === editId ? { ...z, name: editName.trim() || z.name, fee: Number(editFee) || z.fee } : z));
    setEditId(null);
  }
  function toggleZone(id: string) { setZones(prev => prev.map(z => z.id === id ? { ...z, active: !z.active } : z)); }
  function removeZone(id: string) { setZones(prev => prev.filter(z => z.id !== id)); }
  function addZone() {
    if (newName.trim()) {
      setZones(prev => [...prev, { id: `z${Date.now()}`, name: newName.trim(), fee: Number(newFee) || 0, active: true }]);
      setNewName(""); setNewFee(""); setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {zones.map(z => (
        <div key={z.id} className={cn(
          "border rounded-xl px-3 py-2.5 transition-all bg-surface-elevated",
          z.active ? "border-border" : "border-border opacity-60"
        )}>
          {editId === z.id ? (
            <div className="flex items-center gap-2">
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="اسم المنطقة"
                className="flex-1 text-xs bg-surface border border-border rounded-lg px-2 py-1 outline-none text-text-primary" />
              <input value={editFee} onChange={e => setEditFee(e.target.value)} placeholder="رسوم" type="number"
                className="w-16 text-xs bg-surface border border-border rounded-lg px-2 py-1 outline-none text-text-primary" />
              <button onClick={saveEdit} className="text-status-success"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditId(null)} className="text-text-muted"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-status-info shrink-0" />
              <span className="flex-1 text-xs font-medium text-text-primary">{z.name}</span>
              <span className="text-[10px] text-text-muted">{z.fee} د.ع</span>
              <button onClick={() => startEdit(z)} className="text-text-muted hover:text-primary"><Edit2 className="w-3 h-3" /></button>
              <button onClick={() => toggleZone(z.id)}>
                {z.active ? <ToggleRight className="w-5 h-5 text-status-success" /> : <ToggleLeft className="w-5 h-5 text-text-muted" />}
              </button>
              <button onClick={() => removeZone(z.id)} className="text-text-muted hover:text-status-error"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      ))}
      {adding ? (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/25 rounded-xl px-3 py-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم المنطقة" autoFocus
            onKeyDown={e => e.key === "Enter" && addZone()}
            className="flex-1 text-xs bg-transparent outline-none text-text-primary placeholder:text-text-muted" />
          <input value={newFee} onChange={e => setNewFee(e.target.value)} placeholder="رسوم" type="number"
            className="w-16 text-xs bg-transparent border-r border-border pl-2 mr-1 outline-none text-text-primary placeholder:text-text-muted" />
          <button onClick={addZone} className="text-status-success"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setAdding(false); setNewName(""); setNewFee(""); }} className="text-text-muted"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-primary font-medium py-1.5">
          <Plus className="w-3.5 h-3.5" />إضافة منطقة
        </button>
      )}
    </div>
  );
}

/* ─── Notifications Tab ──────────────────────────────────────── */
function NotificationsTab() {
  const [settings, setSettings] = useState({
    newOrder:   true,
    orderReady: true,
    newIssue:   true,
    cancelled:  true,
    delayed:    false,
    sound:      true,
  });
  function toggle(k: keyof typeof settings) { setSettings(p => ({ ...p, [k]: !p[k] })); }

  const items: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key: "newOrder",   label: "طلب جديد",             desc: "إشعار عند استلام طلب جديد"       },
    { key: "orderReady", label: "طلب جاهز",             desc: "عند اكتمال تحضير الطلب"          },
    { key: "newIssue",   label: "مشكلة جديدة",          desc: "عند الإبلاغ عن مشكلة في طلب"     },
    { key: "cancelled",  label: "إلغاء طلب",            desc: "عند إلغاء أي طلب"               },
    { key: "delayed",    label: "طلب متأخر",            desc: "إذا تأخر الطلب أكثر من 30 دقيقة" },
    { key: "sound",      label: "صوت الإشعارات",        desc: "تشغيل صوت مع كل إشعار"          },
  ];

  return (
    <div className="flex flex-col gap-2">
      {items.map(item => (
        <div key={item.key} className="flex items-center gap-3 bg-surface-elevated border border-border rounded-xl px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary">{item.label}</p>
            <p className="text-[10px] text-text-muted">{item.desc}</p>
          </div>
          <button onClick={() => toggle(item.key)}>
            {settings[item.key]
              ? <ToggleRight className="w-6 h-6 text-status-success" />
              : <ToggleLeft  className="w-6 h-6 text-text-muted" />
            }
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Danger Zone ────────────────────────────────────────────── */
function DangerZone() {
  const [confirm, setConfirm] = useState(false);
  const [input,   setInput]   = useState("");
  const [done,    setDone]    = useState(false);

  function handleDelete() {
    if (input.trim() === "احذف كل الطلبات") {
      setDone(true); setConfirm(false); setInput("");
    }
  }

  return (
    <div className="border border-status-error/30 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-status-error/5">
        <ShieldAlert className="w-4 h-4 text-status-error" />
        <span className="text-sm font-bold text-status-error">منطقة الخطر</span>
      </div>
      <div className="px-4 py-3">
        {done ? (
          <div className="flex items-center gap-2 text-status-success text-sm">
            <Check className="w-4 h-4" />تم حذف جميع الطلبات (محاكاة)
          </div>
        ) : !confirm ? (
          <div>
            <p className="text-xs text-text-secondary mb-3">حذف جميع الطلبات من النظام. هذا الإجراء لا يمكن التراجع عنه.</p>
            <button onClick={() => setConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-status-error/10 hover:bg-status-error/15 text-status-error border border-status-error/25 rounded-xl text-xs font-semibold transition-all active:scale-[0.97]">
              <Trash2 className="w-3.5 h-3.5" />حذف جميع الطلبات
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="bg-status-error/8 border border-status-error/25 rounded-xl px-3 py-2.5">
              <p className="text-xs font-bold text-status-error mb-1">تأكيد الحذف</p>
              <p className="text-[11px] text-text-secondary">اكتب <strong>احذف كل الطلبات</strong> للتأكيد</p>
            </div>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="احذف كل الطلبات"
              className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:ring-2 focus:ring-status-error/30"
            />
            <div className="flex gap-2">
              <button onClick={() => { setConfirm(false); setInput(""); }}
                className="flex-1 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-muted font-medium">
                إلغاء
              </button>
              <button onClick={handleDelete} disabled={input.trim() !== "احذف كل الطلبات"}
                className="flex-1 py-2 bg-status-error text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-all active:scale-[0.97]">
                تأكيد الحذف
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export function AdminSettingsPage() {
  const [cancelReasons, setCancelReasons] = useState([
    "الزبون غير موجود", "خطأ في الطلب", "لا يوجد سائق", "إغلاق المطعم مبكراً", "طلب مكرر",
  ]);
  const [issueReasons, setIssueReasons] = useState([
    "طلب ناقص", "طلب خاطئ", "تأخر التوصيل", "مشكلة في الجودة", "سائق غير متجاوب",
  ]);

  return (
    <div className="flex flex-col gap-3 px-4 py-4 pb-8">
      <div className="flex items-center gap-2 mb-1">
        <Settings className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-text-primary">الإعدادات</span>
      </div>

      <Section title="إدارة القائمة" icon={UtensilsCrossed} defaultOpen={false}>
        <MenuTab />
      </Section>

      <Section title="إدارة المستخدمين" icon={Users} defaultOpen={false}>
        <UsersTab />
      </Section>

      <Section title="مناطق التوصيل" icon={MapPin} defaultOpen={false}>
        <ZonesTab />
      </Section>

      <Section title="أسباب الإلغاء" icon={XCircle} defaultOpen={false}>
        <EditableList items={cancelReasons} onChange={setCancelReasons} label="سبب إلغاء" />
      </Section>

      <Section title="أسباب المشاكل" icon={AlertTriangle} defaultOpen={false}>
        <EditableList items={issueReasons} onChange={setIssueReasons} label="سبب مشكلة" />
      </Section>

      <Section title="إدارة الإشعارات" icon={Bell} defaultOpen={false}>
        <NotificationsTab />
      </Section>

      <DangerZone />
    </div>
  );
}
