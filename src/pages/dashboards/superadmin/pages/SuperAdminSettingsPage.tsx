import { useState } from "react";
import {
  Globe, Bell, Shield, Sliders, ToggleRight,
  ToggleLeft, ChevronLeft, Info, Palette, Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SACard, SASection, SABadge } from "../components/SACard";
import { useNotify } from "@/components/notifications/NotificationContext";

interface FeatureFlag {
  id: string; label: string; description: string;
  enabled: boolean; category: string;
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  { id: "realtime_orders",    label: "الطلبات المباشرة",      description: "تحديثات الطلبات في الوقت الفعلي عبر Realtime",  enabled: true,  category: "النظام" },
  { id: "multi_restaurant",   label: "تعدد المطاعم",          description: "دعم إدارة أكثر من مطعم من حساب واحد",            enabled: true,  category: "النظام" },
  { id: "delivery_tracking",  label: "تتبع التوصيل",          description: "تتبع السائق وحالة التوصيل المباشر",              enabled: true,  category: "الطلبات" },
  { id: "analytics_advanced", label: "التحليلات المتقدمة",    description: "رسوم بيانية مفصلة ومقارنات بين المطاعم",        enabled: true,  category: "التقارير" },
  { id: "auto_assign_driver", label: "تعيين سائق تلقائي",     description: "تعيين أقرب سائق متاح تلقائياً عند الطلب",       enabled: false, category: "الطلبات" },
  { id: "customer_feedback",  label: "تقييمات العملاء",        description: "نظام تقييم ومراجعة للعملاء بعد التوصيل",        enabled: false, category: "العملاء" },
  { id: "inventory_mgmt",     label: "إدارة المخزون",          description: "تتبع المخزون والمواد الخام لكل مطعم",           enabled: false, category: "المطاعم" },
  { id: "pos_integration",    label: "ربط بنظام POS",          description: "ربط مع أجهزة نقاط البيع الخارجية",             enabled: false, category: "النظام" },
  { id: "whatsapp_notify",    label: "إشعارات واتساب",         description: "إرسال إشعارات الطلبات عبر واتساب للعملاء",     enabled: false, category: "الإشعارات" },
  { id: "dark_mode_customer", label: "الوضع الداكن للعميل",   description: "تفعيل الوضع الداكن في واجهة العملاء",           enabled: false, category: "المظهر" },
];

const PLATFORM_INFO = [
  { label: "الإصدار", value: "v1.4.0" },
  { label: "قاعدة البيانات", value: "Supabase PostgreSQL" },
  { label: "المصادقة", value: "Supabase Auth" },
  { label: "التخزين", value: "Supabase Storage" },
  { label: "الإشعارات الفورية", value: "Supabase Realtime" },
  { label: "الاستضافة", value: "GitHub Pages" },
];

export function SuperAdminSettingsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { notify } = useNotify();

  function toggleFlag(id: string) {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    const flag = flags.find(f => f.id === id);
    if (flag) {
      notify({
        type: "success",
        title: `${flag.label} — ${flag.enabled ? "معطّل" : "مفعّل"}`,
        message: flag.description,
      });
    }
  }

  const categories = [...new Set(flags.map(f => f.category))];

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-6">

      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-text-primary">الإعدادات</h1>
        <p className="text-[11px] text-text-muted">إعدادات المنصة والميزات</p>
      </div>

      {/* Quick settings */}
      <SASection title="إعدادات سريعة">
        <div className="flex flex-col gap-2">
          {[
            { icon: Globe,   label: "إعدادات المنصة",    sub: "الاسم، اللغة، المنطقة الزمنية", section: "platform" },
            { icon: Bell,    label: "الإشعارات",         sub: "إشعارات الطلبات والتنبيهات",    section: "notifications" },
            { icon: Shield,  label: "الأمان",            sub: "كلمات المرور وصلاحيات الوصول",  section: "security" },
            { icon: Palette, label: "المظهر",            sub: "الألوان والثيم والشعار",         section: "appearance" },
            { icon: Database,label: "قاعدة البيانات",    sub: "النسخ الاحتياطي والاسترداد",   section: "database" },
          ].map(item => (
            <SACard
              key={item.section}
              onClick={() => setActiveSection(activeSection === item.section ? null : item.section)}
              className={cn(
                "px-4 py-3.5 flex items-center gap-3 cursor-pointer",
                activeSection === item.section && "border-primary/30 bg-primary/5"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                activeSection === item.section ? "bg-primary/15" : "bg-surface-elevated"
              )}>
                <item.icon className={cn("w-4 h-4", activeSection === item.section ? "text-primary" : "text-text-muted")} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                <p className="text-[11px] text-text-muted">{item.sub}</p>
              </div>
              <ChevronLeft className={cn(
                "w-4 h-4 text-text-muted transition-transform",
                activeSection === item.section && "rotate-90"
              )} />
            </SACard>
          ))}
        </div>
      </SASection>

      {/* Feature Flags */}
      <SASection
        title="Feature Flags"
        subtitle="تفعيل أو تعطيل ميزات المنصة"
        action={
          <SABadge color="info">{flags.filter(f => f.enabled).length} مفعّل</SABadge>
        }
      >
        {categories.map(cat => (
          <div key={cat} className="mb-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-3 h-3" />{cat}
            </p>
            <div className="flex flex-col gap-2">
              {flags.filter(f => f.category === cat).map(flag => (
                <SACard key={flag.id} className="px-3.5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary">{flag.label}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{flag.description}</p>
                  </div>
                  <button
                    onClick={() => toggleFlag(flag.id)}
                    className="shrink-0 transition-all active:scale-90"
                    title={flag.enabled ? "تعطيل" : "تفعيل"}
                  >
                    {flag.enabled
                      ? <ToggleRight className="w-7 h-7 text-primary" />
                      : <ToggleLeft  className="w-7 h-7 text-text-muted" />
                    }
                  </button>
                </SACard>
              ))}
            </div>
          </div>
        ))}
      </SASection>

      {/* Platform info */}
      <SASection title="معلومات المنصة">
        <SACard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-bold text-primary">بيانات النظام</p>
          </div>
          <div className="flex flex-col gap-2">
            {PLATFORM_INFO.map(item => (
              <div key={item.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="text-xs font-semibold text-text-primary font-mono">{item.value}</p>
              </div>
            ))}
          </div>
        </SACard>
      </SASection>

      {/* Danger zone */}
      <SACard className="p-4 border-red-500/20 bg-red-500/5">
        <p className="text-xs font-bold text-red-400 mb-3">منطقة الخطر</p>
        <div className="flex flex-col gap-2">
          {[
            "تصدير جميع بيانات المنصة",
            "إعادة تعيين إعدادات النظام",
            "حذف جميع البيانات التجريبية",
          ].map(action => (
            <button
              key={action}
              onClick={() => notify({ type: "error", title: "غير متاح", message: "هذه العملية تتطلب تأكيداً إضافياً" })}
              className="w-full text-right text-xs text-red-400 font-medium py-2 px-3 rounded-xl bg-red-500/5 border border-red-500/15 hover:bg-red-500/10 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </SACard>

    </div>
  );
}
