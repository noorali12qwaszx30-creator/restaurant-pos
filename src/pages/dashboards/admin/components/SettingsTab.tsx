import { useState } from "react";
import { Sun, Moon, Globe, Bell, Printer, Wifi, Shield, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function SettingsRow({ icon: Icon, label, sub, children }: {
  icon: React.ElementType; label: string; sub?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl">
      <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-text-secondary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors ${value ? "bg-primary" : "bg-border"} relative shrink-0`}
    >
      <div className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-0.5" : "-translate-x-4"} absolute top-0.5 ${value ? "right-0.5" : "left-0.5"}`} />
    </button>
  );
}

export function SettingsTab() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      {/* Restaurant info */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-primary">معلومات المطعم</h3>
        {[
          { label: "اسم المطعم", value: "Twitter Restaurant" },
          { label: "رقم التواصل", value: "0501234567" },
          { label: "العنوان", value: "الرياض، حي العليا" },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">{f.label}</label>
            <input
              defaultValue={f.value}
              className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        ))}
        <Button size="sm" variant="outline">حفظ المعلومات</Button>
      </div>

      {/* Tax */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-primary">الضريبة والرسوم</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-text-muted">نسبة ضريبة القيمة المضافة (%)</label>
            <input defaultValue="15" className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-text-muted">رسوم التوصيل (د.ع)</label>
            <input defaultValue="15" className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>
        <Button size="sm" variant="outline">حفظ</Button>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2">
        <SettingsRow icon={darkMode ? Moon : Sun} label="الوضع الداكن" sub="تغيير مظهر التطبيق">
          <Toggle value={darkMode} onChange={setDarkMode} />
        </SettingsRow>
        <SettingsRow icon={Bell} label="الإشعارات" sub="إشعارات الطلبات الجديدة">
          <Toggle value={notifications} onChange={setNotifications} />
        </SettingsRow>
        <SettingsRow icon={Printer} label="الطباعة التلقائية" sub="طباعة الفاتورة عند الدفع">
          <Toggle value={autoPrint} onChange={setAutoPrint} />
        </SettingsRow>
        <SettingsRow icon={Bell} label="التنبيهات الصوتية" sub="صوت عند وصول طلب جديد">
          <Toggle value={soundAlerts} onChange={setSoundAlerts} />
        </SettingsRow>
      </div>

      {/* System */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-text-muted px-1">النظام</h3>
        {[
          { icon: Globe, label: "اللغة", sub: "العربية" },
          { icon: Wifi, label: "حالة الاتصال", sub: "متصل" },
          { icon: Shield, label: "النسخ الاحتياطي", sub: "آخر نسخة: اليوم 10:30" },
        ].map((item) => (
          <button key={item.label} className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl w-full text-start hover:bg-surface-elevated transition-colors">
            <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0">
              <item.icon className="w-4.5 h-4.5 text-text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              <p className="text-xs text-text-muted">{item.sub}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
