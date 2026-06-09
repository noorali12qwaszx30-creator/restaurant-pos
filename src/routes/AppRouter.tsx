import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RoleSelectorPage } from "@/pages/role-selector/RoleSelectorPage";
import { CashierDashboard } from "@/pages/dashboards/cashier/CashierDashboard";
import { FieldDashboard } from "@/pages/dashboards/field/FieldDashboard";
import { DeliveryDashboard } from "@/pages/dashboards/delivery/DeliveryDashboard";
import { TakeawayDashboard } from "@/pages/dashboards/takeaway/TakeawayDashboard";
import { KitchenDashboard } from "@/pages/dashboards/kitchen/KitchenDashboard";
import { AdminDashboard } from "@/pages/dashboards/admin/AdminDashboard";

export function AppRouter() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public-only routes (redirect if authenticated) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Role selector — authenticated but no role chosen */}
      <Route element={<ProtectedRoute />}>
        <Route path="/select-role" element={<RoleSelectorPage />} />
      </Route>

      {/* Dashboards — authenticated + role-protected */}
      <Route element={<ProtectedRoute requiredRole="cashier" />}>
        <Route path="/dashboard/cashier/*" element={<CashierDashboard />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="field" />}>
        <Route path="/dashboard/field/*" element={<FieldDashboard />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="delivery" />}>
        <Route path="/dashboard/delivery/*" element={<DeliveryDashboard />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="takeaway" />}>
        <Route path="/dashboard/takeaway/*" element={<TakeawayDashboard />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="kitchen" />}>
        <Route path="/dashboard/kitchen/*" element={<KitchenDashboard />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="/dashboard/admin/*" element={<AdminDashboard />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
