import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminHomePage }       from "./pages/AdminHomePage";
import { AdminOrdersPage }     from "./pages/AdminOrdersPage";
import { AdminStatsPage }      from "./pages/AdminStatsPage";
import { AdminMonitoringPage } from "./pages/AdminMonitoringPage";
import { AdminSettingsPage }   from "./pages/AdminSettingsPage";
import { AdminAssistantPage }  from "./pages/AdminAssistantPage";
import { AdminUsersPage }      from "./pages/AdminUsersPage";

export function AdminDashboard() {
  return (
    <DashboardLayout role="admin" className="!px-0 !pt-0">
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route index             element={<AdminHomePage />}       />
          <Route path="orders"     element={<AdminOrdersPage />}     />
          <Route path="stats"      element={<AdminStatsPage />}      />
          <Route path="monitoring" element={<AdminMonitoringPage />} />
          <Route path="settings"   element={<AdminSettingsPage />}   />
          <Route path="assistant"  element={<AdminAssistantPage />}  />
          <Route path="users"      element={<AdminUsersPage />}      />
        </Routes>
      </div>
    </DashboardLayout>
  );
}
