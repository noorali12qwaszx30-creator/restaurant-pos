import { Bike } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

export function DeliveryDashboard() {
  const { profile } = useAuth();

  return (
    <DashboardLayout role="delivery">
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 text-center">
        <Bike className="w-12 h-12 text-text-muted" />
        <div>
          <h2 className="text-xl font-bold text-text-primary">لوحة التوصيل</h2>
          <p className="text-sm text-text-muted mt-1">
            مرحباً {profile?.displayName} — المحتوى قيد الإنشاء
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
