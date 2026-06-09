import { useState } from "react";
import { Plus, Edit2, ToggleLeft, ToggleRight, Leaf, Soup, UtensilsCrossed, Flame, Sandwich, CupSoda, Cake, type LucideIcon } from "lucide-react";
import { useMenuData, type MenuItemData } from "@/hooks/useMenuData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { SearchBar } from "@/components/dashboard/SearchBar";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  leaf:       Leaf,
  soup:       Soup,
  utensils:   UtensilsCrossed,
  flame:      Flame,
  sandwich:   Sandwich,
  "cup-soda": CupSoda,
  cake:       Cake,
  // legacy id-based fallbacks
  appetizers: Leaf,
  soups:      Soup,
  mains:      UtensilsCrossed,
  grills:     Flame,
  sandwiches: Sandwich,
  drinks:     CupSoda,
  desserts:   Cake,
};

export function MenuTab() {
  const { items: menuItems, categories: menuCats } = useMenuData();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [editItem, setEditItem] = useState<MenuItemData | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = menuItems.filter((item) => {
    const matchCat = selectedCat === "all" || item.category_id === selectedCat;
    const matchSearch = item.name.includes(search) || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="بحث في القائمة..." />
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 ms-1" />
          إضافة
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCat("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCat === "all" ? "bg-primary text-white border-primary" : "bg-surface border-border text-text-muted"}`}
        >
          الكل ({menuItems.length})
        </button>
        {menuCats.map((cat) => {
          const count = menuItems.filter((i) => i.category_id === cat.id).length;
          const Icon = (cat.icon && CATEGORY_ICONS[cat.icon]) ?? CATEGORY_ICONS[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCat === cat.id ? "bg-primary text-white border-primary" : "bg-surface border-border text-text-muted"}`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Items list */}
      <div className="flex flex-col gap-2">
        {filtered.map((item) => {
          const cat = menuCats.find(c => c.id === item.category_id);
          const iconKey = cat?.icon ?? item.category_id;
          const Icon = CATEGORY_ICONS[iconKey] ?? UtensilsCrossed;
          return (
            <div key={item.id} className="bg-surface border border-border rounded-2xl p-3 flex items-center gap-3">
              {/* Category icon */}
              <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-text-muted/60" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
                  {!item.is_available && <Badge variant="error" className="text-xs">غير متاح</Badge>}
                </div>
                {item.description && <p className="text-xs text-text-muted truncate">{item.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-primary">{Number(item.price).toLocaleString("ar-IQ")} د.ع</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{item.preparation_time} د</span>
                </div>
              </div>

              <button
                onClick={() => setEditItem(item)}
                className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل الصنف</DialogTitle></DialogHeader>
          <DialogBody>
            {editItem && (
              <div className="flex flex-col gap-3">
                {[
                  { label: "الاسم", value: editItem.name },
                  { label: "السعر (د.ع)", value: String(editItem.price) },
                  { label: "وقت التحضير (دقائق)", value: String(editItem.preparation_time) },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-secondary">{f.label}</label>
                    <input
                      defaultValue={f.value}
                      className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl">
                  <p className="text-sm text-text-primary">متاح للطلب</p>
                  {editItem.is_available
                    ? <span className="flex items-center gap-1 text-status-success text-xs font-medium"><ToggleRight className="w-4 h-4" />نعم</span>
                    : <span className="flex items-center gap-1 text-text-muted text-xs font-medium"><ToggleLeft className="w-4 h-4" />لا</span>
                  }
                </div>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>إلغاء</Button>
            <Button onClick={() => setEditItem(null)}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) setAddOpen(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة صنف جديد</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-3">
              {[
                { label: "الاسم العربي", placeholder: "مثال: برجر لحم..." },
                { label: "السعر (د.ع)", placeholder: "0" },
                { label: "وقت التحضير (دقائق)", placeholder: "10" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">{f.label}</label>
                  <input
                    placeholder={f.placeholder}
                    className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">التصنيف</label>
                <select className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  {menuCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
            <Button onClick={() => setAddOpen(false)}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
