/**
 * AdminSettingsPage — 2-column card grid, each card expands inline below the row.
 * All tools write to SettingsContext → Supabase → propagate to cashier & field.
 */
import { useState, useRef } from "react";
import {
  UtensilsCrossed, Users, MapPin, XCircle, AlertTriangle,
  Bell, ShieldAlert, ToggleLeft, ToggleRight,
  Plus, Edit2, Check, X, Trash2,
  Leaf, Soup, Flame, Sandwich, CupSoda, Cake,
  CheckCircle2, AlertCircle, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";
import { useMenuData } from "@/hooks/useMenuData";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════
   Reusable EditableReasonList
══════════════════════════════════════════════════════════════ */
function EditableReasonList({
  items, onAdd, onUpdate, onRemove, addLabel,
}: {
  items: { id: string; text: string }[];
  onAdd: (text: string) => Promise<void>;
  onUpdate: (id: string, text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  addLabel: string;
}) {
  const [editId,  setEditId]  = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [adding,  setAdding]  = useState(false);
  const [newVal,  setNewVal]  = useState("");

  async function saveEdit() {
    if (!editId || !editVal.trim()) { setEditId(null); return; }
    await onUpdate(editId, editVal.trim());
    setEditId(null);
  }
  async function saveNew() {
    if (!newVal.trim()) return;
    await onAdd(newVal.trim());
    setNewVal(""); setAdding(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {items.map(r => (
        <div key={r.id}
          className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl px-3 py-2.5 group">
          {editId === r.id ? (
            <>
              <input value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditId(null); }}
                className="flex-1 text-xs bg-transparent outline-none text-text-primary" />
              <button onClick={saveEdit} className="text-status-success shrink-0"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditId(null)} className="text-text-muted shrink-0"><X className="w-3.5 h-3.5" /></button>
            </>
          ) : (
            <>
              <span className="flex-1 text-xs text-text-primary leading-relaxed">{r.text}</span>
              <button onClick={() => { setEditId(r.id); setEditVal(r.text); }}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary transition-all shrink-0">
                <Edit2 className="w-3 h-3" />
              </button>
              <button onClick={() => onRemove(r.id)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-status-error transition-all shrink-0">
                <X className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/30 rounded-xl px-3 py-2.5">
          <input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder={addLabel} autoFocus
            onKeyDown={e => { if (e.key === "Enter") saveNew(); if (e.key === "Escape") { setAdding(false); setNewVal(""); } }}
            className="flex-1 text-xs bg-transparent outline-none text-text-primary placeholder:text-text-muted" />
          <button onClick={saveNew} className="text-status-success"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setAdding(false); setNewVal(""); }} className="text-text-muted"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium py-1 hover:opacity-80 transition-opacity">
          <Plus className="w-3.5 h-3.5" />إضافة {addLabel}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   1. MENU PANEL
══════════════════════════════════════════════════════════════ */
const CAT_ICONS: Record<string, React.ElementType> = {
  appetizers: Leaf, soups: Soup, mains: UtensilsCrossed,
  grills: Flame, sandwiches: Sandwich, drinks: CupSoda, desserts: Cake,
};

function MenuPanel() {
  const { items: dbItems, categories } = useMenuData();
  const { menuItems: ctxItems, toggleMenuItem } = useSettings();
  const [catFilter, setCatFilter] = useState("all");

  const items = dbItems.map(i => {
    const ctx = ctxItems.find(c => c.id === i.id);
    return ctx ? { ...i, is_available: ctx.is_available } : i;
  });

  const cats = [{ id:"all", name:"الكل", icon:undefined }, ...categories];
  const shown = items.filter(i => catFilter === "all" || i.category_id === catFilter);
  const available = shown.filter(i => i.is_available).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-status-success/8 border border-status-success/20 rounded-xl px-3 py-2 text-center">
          <p className="text-base font-black text-status-success num">{available}</p>
          <p className="text-[10px] text-text-muted">متاح</p>
        </div>
        <div className="flex-1 bg-status-error/8 border border-status-error/20 rounded-xl px-3 py-2 text-center">
          <p className="text-base font-black text-status-error num">{shown.length - available}</p>
          <p className="text-[10px] text-text-muted">نفد</p>
        </div>
        <div className="flex-1 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2 text-center">
          <p className="text-base font-black text-primary num">{shown.length}</p>
          <p className="text-[10px] text-text-muted">إجمالي</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth:"none" }}>
        {cats.map(c => {
          const Icon = c.icon ? CAT_ICONS[c.icon] : undefined;
          return (
            <button key={c.id} onClick={() => setCatFilter(c.id)}
              className={cn("shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-medium transition-all",
                catFilter === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted")}>
              {Icon && <Icon className="w-3 h-3" />}{c.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
        {shown.map(item => {
          const cat = categories.find(c => c.id === item.category_id);
          const Icon = CAT_ICONS[cat?.icon ?? ""] ?? UtensilsCrossed;
          return (
            <div key={item.id}
              className={cn("flex items-center gap-3 border rounded-xl px-3 py-2.5 transition-all",
                item.is_available ? "bg-surface-elevated border-border" : "bg-surface border-dashed border-border opacity-55")}>
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-text-muted/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{item.name}</p>
                <p className="text-[10px] text-text-muted">{cat?.name} · {Number(item.price).toLocaleString("ar-IQ")} د.ع</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  item.is_available ? "bg-status-success/10 text-status-success" : "bg-status-error/10 text-status-error")}>
                  {item.is_available ? "متاح" : "نفد"}
                </span>
                <button onClick={() => toggleMenuItem(item.id, !item.is_available)}>
                  {item.is_available
                    ? <ToggleRight className="w-6 h-6 text-status-success" />
                    : <ToggleLeft  className="w-6 h-6 text-text-muted" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   2. USERS PANEL
══════════════════════════════════════════════════════════════ */
const ROLE_MAP: Record<string, { label: string; color: string }> = {
  admin:    { label:"مدير",   color:"bg-status-warning/10 text-status-warning" },
  cashier:  { label:"كاشير",  color:"bg-primary/10 text-primary"               },
  field:    { label:"ميداني", color:"bg-status-info/10 text-status-info"       },
  delivery: { label:"سائق",   color:"bg-status-success/10 text-status-success" },
  kitchen:  { label:"طاهٍ",   color:"bg-orange-500/10 text-orange-500"         },
};

function UsersPanel() {
  const { profiles, toggleProfile } = useSettings();
  const roleKeys = ["all","admin","cashier","field","delivery","kitchen"];
  const [roleFilter, setRoleFilter] = useState("all");
  const shown = profiles.filter(u => roleFilter === "all" || u.role === roleFilter);
  const active = shown.filter(u => u.is_active).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1 bg-status-success/8 border border-status-success/20 rounded-xl px-3 py-2 text-center">
          <p className="text-base font-black text-status-success num">{active}</p>
          <p className="text-[10px] text-text-muted">نشط</p>
        </div>
        <div className="flex-1 bg-status-error/8 border border-status-error/20 rounded-xl px-3 py-2 text-center">
          <p className="text-base font-black text-status-error num">{shown.length - active}</p>
          <p className="text-[10px] text-text-muted">معطّل</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth:"none" }}>
        {roleKeys.map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={cn("shrink-0 px-2.5 py-1.5 rounded-full border text-[11px] font-medium transition-all",
              roleFilter === r ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted")}>
            {r === "all" ? "الكل" : ROLE_MAP[r]?.label ?? r}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
        {shown.map(u => (
          <div key={u.id}
            className={cn("flex items-center gap-3 border rounded-xl px-3 py-2.5 transition-all",
              u.is_active ? "bg-surface-elevated border-border" : "bg-surface border-dashed border-border opacity-55")}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {u.display_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{u.display_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", ROLE_MAP[u.role]?.color ?? "bg-surface text-text-muted")}>
                  {ROLE_MAP[u.role]?.label ?? u.role}
                </span>
                {u.phone && <span className="text-[10px] text-text-muted num">{u.phone}</span>}
              </div>
            </div>
            <button onClick={() => toggleProfile(u.id, !u.is_active)}>
              {u.is_active
                ? <ToggleRight className="w-6 h-6 text-status-success" />
                : <ToggleLeft  className="w-6 h-6 text-text-muted" />}
            </button>
          </div>
        ))}
        {shown.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">لا يوجد موظفون في هذه الفئة</p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   3. ZONES PANEL — live, writes to Supabase
══════════════════════════════════════════════════════════════ */
function ZonesPanel() {
  const { zones, addZone, updateZone, removeZone } = useSettings();
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFee,  setEditFee]  = useState("");
  const [adding,   setAdding]   = useState(false);
  const [newName,  setNewName]  = useState("");
  const [newFee,   setNewFee]   = useState("");
  const [saving,   setSaving]   = useState(false);

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    await updateZone(editId, { name: editName.trim(), fee: Number(editFee) || 0 });
    setSaving(false); setEditId(null);
  }
  async function saveNew() {
    if (!newName.trim()) return;
    setSaving(true);
    await addZone(newName.trim(), Number(newFee) || 0);
    setSaving(false); setNewName(""); setNewFee(""); setAdding(false);
  }

  const activeCount = zones.filter(z => z.is_active).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 text-center">
        <div className="flex-1 bg-status-success/8 border border-status-success/20 rounded-xl py-2">
          <p className="text-base font-black text-status-success num">{activeCount}</p>
          <p className="text-[10px] text-text-muted">نشطة</p>
        </div>
        <div className="flex-1 bg-surface-elevated border border-border rounded-xl py-2">
          <p className="text-base font-black text-text-secondary num">{zones.length - activeCount}</p>
          <p className="text-[10px] text-text-muted">معطّلة</p>
        </div>
        <div className="flex-1 bg-primary/8 border border-primary/20 rounded-xl py-2">
          <p className="text-base font-black text-primary num">{zones.length}</p>
          <p className="text-[10px] text-text-muted">إجمالي</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
        {zones.map(z => (
          <div key={z.id}
            className={cn("border rounded-xl px-3 py-2.5 transition-all",
              z.is_active ? "bg-surface-elevated border-border" : "bg-surface border-dashed border-border opacity-55")}>
            {editId === z.id ? (
              <div className="flex items-center gap-2">
                <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                  placeholder="اسم المنطقة"
                  onKeyDown={e => e.key === "Enter" && saveEdit()}
                  className="flex-1 text-xs bg-surface border border-border rounded-lg px-2 py-1.5 outline-none text-text-primary focus:ring-2 focus:ring-primary/30" />
                <input value={editFee} onChange={e => setEditFee(e.target.value)} type="number"
                  placeholder="رسوم"
                  className="w-16 text-xs bg-surface border border-border rounded-lg px-2 py-1.5 outline-none text-text-primary focus:ring-2 focus:ring-primary/30" />
                <button onClick={saveEdit} disabled={saving} className="text-status-success"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditId(null)} className="text-text-muted"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <MapPin className="w-3.5 h-3.5 text-status-info shrink-0" />
                <span className="flex-1 text-xs font-semibold text-text-primary">{z.name}</span>
                <span className="text-xs font-bold text-status-info num">{z.fee} د.ع</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditId(z.id); setEditName(z.name); setEditFee(String(z.fee)); }}
                    className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeZone(z.id)}
                    className="w-6 h-6 rounded-lg bg-status-error/10 flex items-center justify-center text-status-error">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => updateZone(z.id, { is_active: !z.is_active })}>
                  {z.is_active
                    ? <ToggleRight className="w-5 h-5 text-status-success" />
                    : <ToggleLeft  className="w-5 h-5 text-text-muted" />}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/30 rounded-xl px-3 py-2.5">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم المنطقة" autoFocus
            onKeyDown={e => e.key === "Enter" && saveNew()}
            className="flex-1 text-xs bg-transparent outline-none text-text-primary placeholder:text-text-muted" />
          <input value={newFee} onChange={e => setNewFee(e.target.value)} placeholder="رسوم" type="number"
            className="w-14 text-xs bg-transparent outline-none text-text-primary placeholder:text-text-muted" />
          <button onClick={saveNew} disabled={saving} className="text-status-success"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setAdding(false); setNewName(""); setNewFee(""); }} className="text-text-muted"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium py-1 hover:opacity-80 transition-opacity">
          <Plus className="w-3.5 h-3.5" />إضافة منطقة توصيل
        </button>
      )}

      <div className="flex items-start gap-2 bg-status-info/5 border border-status-info/15 rounded-xl px-3 py-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-status-info shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          التغييرات تنعكس فوراً على محدد المنطقة في شاشة الكاشير
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. NOTIFICATIONS PANEL
══════════════════════════════════════════════════════════════ */
function NotificationsPanel() {
  const { notifications, toggleNotif } = useSettings();
  const items: { key: keyof typeof notifications; label: string; desc: string }[] = [
    { key:"newOrder",   label:"طلب جديد",       desc:"إشعار عند استلام طلب جديد"     },
    { key:"orderReady", label:"طلب جاهز",       desc:"عند اكتمال تحضير الطلب"        },
    { key:"newIssue",   label:"مشكلة جديدة",    desc:"عند الإبلاغ عن مشكلة"         },
    { key:"cancelled",  label:"إلغاء طلب",      desc:"عند إلغاء أي طلب"             },
    { key:"delayed",    label:"طلب متأخر",      desc:"تأخر أكثر من 30 دقيقة"        },
    { key:"sound",      label:"الصوت",           desc:"صوت مع كل إشعار"             },
  ];
  const enabled = items.filter(i => notifications[i.key]).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted">{enabled} من {items.length} مفعّلة</span>
        <div className="h-1.5 w-24 bg-surface-elevated rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width:`${(enabled/items.length)*100}%` }} />
        </div>
      </div>
      {items.map(item => (
        <div key={item.key} className="flex items-center gap-3 bg-surface-elevated border border-border rounded-xl px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary">{item.label}</p>
            <p className="text-[10px] text-text-muted">{item.desc}</p>
          </div>
          <button onClick={() => toggleNotif(item.key)}>
            {notifications[item.key]
              ? <ToggleRight className="w-6 h-6 text-status-success" />
              : <ToggleLeft  className="w-6 h-6 text-text-muted" />}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   5. DANGER PANEL
══════════════════════════════════════════════════════════════ */
function DangerPanel() {
  const [phase, setPhase] = useState<"idle"|"confirm"|"done">("idle");
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const MAGIC = "احذف كل الطلبات";

  return phase === "done" ? (
    <div className="flex items-center gap-2 text-status-success text-xs py-3 font-medium">
      <CheckCircle2 className="w-4 h-4" />تم حذف جميع الطلبات بنجاح
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <div className="bg-status-error/5 border border-status-error/20 rounded-xl px-3 py-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-status-error shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-status-error">منطقة خطرة</p>
            <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
              الإجراءات أدناه لا يمكن التراجع عنها.
            </p>
          </div>
        </div>
      </div>

      {phase === "idle" ? (
        <button
          onClick={() => { setPhase("confirm"); setTimeout(() => inputRef.current?.focus(), 80); }}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-status-error/8 hover:bg-status-error/14 text-status-error border border-status-error/25 rounded-xl text-xs font-bold transition-all active:scale-[0.97]">
          <Trash2 className="w-4 h-4" />حذف جميع الطلبات
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-text-secondary">
            اكتب <strong className="text-status-error font-bold">{MAGIC}</strong> للتأكيد
          </p>
          <input
            ref={inputRef}
            value={input} onChange={e => setInput(e.target.value)} placeholder={MAGIC}
            className="w-full bg-surface-elevated border-2 border-status-error/30 focus:border-status-error rounded-xl px-3 py-2 text-xs text-text-primary outline-none transition-all" />
          <div className="flex gap-2">
            <button onClick={() => { setPhase("idle"); setInput(""); }}
              className="flex-1 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-muted font-medium">
              إلغاء
            </button>
            <button onClick={() => { if (input.trim() === MAGIC) setPhase("done"); }}
              disabled={input.trim() !== MAGIC}
              className="flex-1 py-2 bg-status-error text-white rounded-xl text-xs font-bold disabled:opacity-35 active:scale-[0.97] transition-all">
              تأكيد الحذف
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Card config
══════════════════════════════════════════════════════════════ */
type CardKey = "menu"|"users"|"zones"|"notifs"|"cancel"|"issues"|"danger";

interface CardDef {
  key:       CardKey;
  title:     string;
  desc:      string;
  icon:      React.ElementType;
  iconBg:    string;
  iconColor: string;
  danger?:   boolean;
}

const CARDS: CardDef[] = [
  { key:"menu",   title:"القائمة",         desc:"تفعيل وتعطيل الأصناف",        icon:UtensilsCrossed, iconBg:"bg-primary/10",           iconColor:"text-primary"        },
  { key:"users",  title:"الموظفون",        desc:"إدارة حسابات الفريق",         icon:Users,           iconBg:"bg-status-info/10",       iconColor:"text-status-info"    },
  { key:"zones",  title:"مناطق التوصيل",  desc:"إضافة وتعديل المناطق والرسوم",icon:MapPin,          iconBg:"bg-status-success/10",    iconColor:"text-status-success" },
  { key:"notifs", title:"الإشعارات",       desc:"تخصيص تنبيهات النظام",        icon:Bell,            iconBg:"bg-status-warning/10",    iconColor:"text-status-warning" },
  { key:"cancel", title:"أسباب الإلغاء",  desc:"إدارة قائمة أسباب الإلغاء",  icon:XCircle,         iconBg:"bg-status-error/8",       iconColor:"text-status-error"   },
  { key:"issues", title:"أسباب المشاكل",  desc:"تصنيف مشاكل الطلبات",        icon:AlertTriangle,   iconBg:"bg-status-warning/8",     iconColor:"text-status-warning" },
  { key:"danger", title:"منطقة الخطر",    desc:"إجراءات متقدمة وحساسة",      icon:ShieldAlert,     iconBg:"bg-status-error/10",      iconColor:"text-status-error",  danger:true },
];

/* ══════════════════════════════════════════════════════════════
   Panel renderer
══════════════════════════════════════════════════════════════ */
function PanelContent({ cardKey, cancelReasons, issueReasons,
  addCancelReason, updateCancelReason, removeCancelReason,
  addIssueReason, updateIssueReason, removeIssueReason,
}: {
  cardKey: CardKey;
  cancelReasons: { id: string; text: string }[];
  issueReasons:  { id: string; text: string }[];
  addCancelReason: (t: string) => Promise<void>;
  updateCancelReason: (id: string, t: string) => Promise<void>;
  removeCancelReason: (id: string) => Promise<void>;
  addIssueReason:  (t: string) => Promise<void>;
  updateIssueReason:  (id: string, t: string) => Promise<void>;
  removeIssueReason:  (id: string) => Promise<void>;
}) {
  switch (cardKey) {
    case "menu":   return <MenuPanel />;
    case "users":  return <UsersPanel />;
    case "zones":  return <ZonesPanel />;
    case "notifs": return <NotificationsPanel />;
    case "cancel": return (
      <EditableReasonList items={cancelReasons}
        onAdd={addCancelReason} onUpdate={updateCancelReason} onRemove={removeCancelReason}
        addLabel="سبب إلغاء" />
    );
    case "issues": return (
      <EditableReasonList items={issueReasons}
        onAdd={addIssueReason} onUpdate={updateIssueReason} onRemove={removeIssueReason}
        addLabel="سبب مشكلة" />
    );
    case "danger": return <DangerPanel />;
  }
}

/* ══════════════════════════════════════════════════════════════
   Inline PanelWrapper
══════════════════════════════════════════════════════════════ */
function PanelWrapper({ card, children, onClose }: {
  card: CardDef; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div className={cn("rounded-2xl border-2 overflow-hidden",
      card.danger ? "border-status-error/30" : "border-primary/20")}>
      {/* panel header */}
      <div className={cn("flex items-center gap-2.5 px-4 py-3 border-b",
        card.danger ? "border-status-error/15 bg-status-error/4" : "border-border bg-surface")}>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", card.iconBg)}>
          <card.icon className={cn("w-3.5 h-3.5", card.iconColor)} />
        </div>
        <span className={cn("text-sm font-bold flex-1", card.danger ? "text-status-error" : "text-text-primary")}>
          {card.title}
        </span>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:bg-border transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-4 py-3.5 bg-surface-elevated">
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CardButton
══════════════════════════════════════════════════════════════ */
function CardButton({ card, isActive, onClick }: {
  card: CardDef; isActive: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2.5 p-3.5 rounded-2xl border-2 transition-all active:scale-[0.96] text-start w-full",
        isActive
          ? card.danger
            ? "bg-status-error/8 border-status-error/40 shadow-sm"
            : "bg-primary/5 border-primary/35 shadow-sm"
          : card.danger
            ? "bg-status-error/4 border-status-error/15 hover:border-status-error/30"
            : "bg-surface border-border hover:border-primary/25 hover:bg-surface-elevated"
      )}>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform", card.iconBg, isActive && "scale-110")}>
        <card.icon className={cn("w-5 h-5", card.iconColor)} />
      </div>
      <div className="w-full">
        <p className={cn("text-sm font-bold leading-tight", card.danger ? "text-status-error" : "text-text-primary")}>
          {card.title}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5 leading-snug">{card.desc}</p>
      </div>
      <ChevronDown className={cn("w-3.5 h-3.5 self-end transition-transform duration-200",
        card.danger ? "text-status-error/40" : "text-text-muted/40",
        isActive && "rotate-180")} />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export function AdminSettingsPage() {
  const { cancelReasons, issueReasons,
    addCancelReason, updateCancelReason, removeCancelReason,
    addIssueReason,  updateIssueReason,  removeIssueReason,
  } = useSettings();

  const [active, setActive] = useState<CardKey | null>(null);

  const toggle = (key: CardKey) => setActive(p => p === key ? null : key);

  // 3 rows of 2 cards + full-width danger
  const rows: CardDef[][] = [
    [CARDS[0], CARDS[1]],
    [CARDS[2], CARDS[3]],
    [CARDS[4], CARDS[5]],
  ];

  const panelProps = {
    cancelReasons, issueReasons,
    addCancelReason, updateCancelReason, removeCancelReason,
    addIssueReason, updateIssueReason, removeIssueReason,
  };

  return (
    <div className="px-3 py-4 pb-10 flex flex-col gap-2.5">

      <div className="px-1 mb-1">
        <h2 className="text-lg font-black text-text-primary">الإعدادات</h2>
        <p className="text-xs text-text-muted mt-0.5">اضغط على أي قسم لفتحه وتعديله مباشرة</p>
      </div>

      {/* Rows 1–3 */}
      {rows.map((row, ri) => {
        const rowActive = row.find(c => c.key === active);
        return (
          <div key={ri} className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              {row.map(card => (
                <CardButton key={card.key} card={card}
                  isActive={active === card.key}
                  onClick={() => toggle(card.key)} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {rowActive && (
                <motion.div key={rowActive.key}
                  initial={{ opacity:0, height:0, marginTop:0 }}
                  animate={{ opacity:1, height:"auto", marginTop:0 }}
                  exit={{ opacity:0, height:0, marginTop:0 }}
                  transition={{ duration:0.22, ease:[0.25,0.46,0.45,0.94] }}
                  style={{ overflow:"hidden" }}>
                  <PanelWrapper card={rowActive} onClose={() => setActive(null)}>
                    <PanelContent cardKey={rowActive.key} {...panelProps} />
                  </PanelWrapper>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Danger — full width */}
      <div className="flex flex-col gap-2.5">
        <button onClick={() => toggle("danger")}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.98]",
            active === "danger"
              ? "bg-status-error/8 border-status-error/40 shadow-sm"
              : "bg-status-error/4 border-status-error/15 hover:border-status-error/30"
          )}>
          <div className="w-10 h-10 rounded-xl bg-status-error/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-status-error" />
          </div>
          <div className="flex-1 text-start">
            <p className="text-sm font-bold text-status-error">منطقة الخطر</p>
            <p className="text-[10px] text-text-muted mt-0.5">إجراءات متقدمة وحساسة</p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-status-error/50 transition-transform duration-200", active === "danger" && "rotate-180")} />
        </button>

        <AnimatePresence mode="wait">
          {active === "danger" && (
            <motion.div key="danger"
              initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
              exit={{ opacity:0, height:0 }} transition={{ duration:0.22 }}
              style={{ overflow:"hidden" }}>
              <PanelWrapper card={CARDS[6]} onClose={() => setActive(null)}>
                <DangerPanel />
              </PanelWrapper>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
