import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FieldHomePage }   from "./pages/FieldHomePage";
import { FieldOrdersPage } from "./pages/FieldOrdersPage";
import { FieldIssuesPage } from "./pages/FieldIssuesPage";

export function FieldDashboard() {
  return (
    <DashboardLayout role="field" className="!px-0">
      <Routes>
        <Route index         element={<FieldHomePage />}   />
        <Route path="orders" element={<FieldOrdersPage />} />
        <Route path="issues" element={<FieldIssuesPage />} />
      </Routes>
    </DashboardLayout>
  );
}
