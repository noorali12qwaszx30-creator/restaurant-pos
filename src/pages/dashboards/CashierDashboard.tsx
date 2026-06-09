import { CreditCard } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

export function CashierDashboard() {
  const { profile } = useAuth();

  return (
    <DashboardLayout role="cashier">
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 text-center">
        <CreditCard className="w-12 h-12 text-text-muted" />
        <div>
          <h2 className="text-xl font-bold text-text-primary">لوحة الكاشير</h2>
          <p className="text-sm text-text-muted mt-1">
            مرحباً {profile?.displayName} — المحتوى قيد الإنشاء
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
