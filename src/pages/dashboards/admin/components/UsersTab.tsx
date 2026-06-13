import { useState } from "react";
import { Plus, Edit2, ToggleLeft, ToggleRight, ShieldCheck } from "lucide-react";
import { MOCK_STAFF, ROLE_LABELS } from "@/data/mock-users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { SearchBar } from "@/components/dashboard/SearchBar";
import type { UserRole } from "@/types";

const ROLE_BADGE_VARIANTS: Record<UserRole, "default" | "success" | "warning" | "info" | "secondary"> = {
  admin:       "warning",
  cashier:     "default",
  field:       "info",
  delivery:    "secondary",
  takeaway:    "success",
  kitchen:     "secondary",
  super_admin: "warning",
};

export function UsersTab() {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<typeof MOCK_STAFF[0] | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = MOCK_STAFF.filter((u) =>
    u.displayName.includes(search) || u.username.includes(search)
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو المستخدم..." />
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 ms-1" />
          إضافة
        </Button>
      </div>

      {/* Users list */}
      <div className="flex flex-col gap-2">
        {filtered.map((user) => (
          <div key={user.id} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{user.displayName.charAt(0)}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-text-primary">{user.displayName}</p>
                {!user.isActive && <Badge variant="error">غير نشط</Badge>}
              </div>
              <p className="text-xs text-text-muted">@{user.username}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {user.roles.map((r) => (
                  <Badge key={r} variant={ROLE_BADGE_VARIANTS[r as UserRole]} className="text-xs">{ROLE_LABELS[r as UserRole] ?? r}</Badge>
                ))}
              </div>
            </div>

            <button
              onClick={() => setEditUser(user)}
              className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {editUser && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{editUser.displayName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{editUser.displayName}</p>
                    <p className="text-xs text-text-muted">@{editUser.username}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-text-secondary">الأدوار المسندة</p>
                  <div className="flex flex-wrap gap-2">
                    {(["cashier","field","delivery","takeaway","kitchen","admin"] as UserRole[]).map((role) => {
                      const active = editUser.roles.includes(role);
                      return (
                        <button key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${active ? "bg-primary text-white border-primary" : "bg-surface-elevated text-text-muted border-border"}`}>
                          {active && <ShieldCheck className="w-3 h-3" />}
                          {ROLE_LABELS[role]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl">
                  <p className="text-sm text-text-primary">حالة الحساب</p>
                  {editUser.isActive
                    ? <span className="flex items-center gap-1 text-status-success text-xs font-medium"><ToggleRight className="w-4 h-4" />نشط</span>
                    : <span className="flex items-center gap-1 text-text-muted text-xs font-medium"><ToggleLeft className="w-4 h-4" />غير نشط</span>
                  }
                </div>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>إلغاء</Button>
            <Button onClick={() => setEditUser(null)}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add user dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) setAddOpen(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة موظف جديد</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-3">
              {[
                { label: "الاسم الكامل", placeholder: "أدخل الاسم..." },
                { label: "اسم المستخدم", placeholder: "بدون مسافات..." },
                { label: "كلمة المرور", placeholder: "8 أحرف على الأقل..." },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">{f.label}</label>
                  <input
                    type={f.label.includes("كلمة") ? "password" : "text"}
                    placeholder={f.placeholder}
                    className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">الدور</label>
                <div className="flex flex-wrap gap-2">
                  {(["cashier","field","delivery","takeaway","kitchen","admin"] as UserRole[]).map((role) => (
                    <button key={role} className="px-3 py-1.5 rounded-full text-xs border border-border text-text-muted bg-surface-elevated hover:border-primary hover:text-primary transition-all">
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
            <Button onClick={() => setAddOpen(false)}>إنشاء الحساب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
