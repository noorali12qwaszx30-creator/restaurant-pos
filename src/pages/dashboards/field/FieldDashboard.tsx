import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FieldHomePage }        from "./pages/FieldHomePage";
import { FieldOrdersPage }      from "./pages/FieldOrdersPage";
import { FieldDeliveringPage }  from "./pages/FieldDeliveringPage";
import { FieldAccountingPage }  from "./pages/FieldAccountingPage";

export function FieldDashboard() {
  return (
    <DashboardLayout role="field" className="!px-0">
      <Routes>
        <Route index              element={<FieldHomePage />}        />
        <Route path="orders"      element={<FieldOrdersPage />}      />
        <Route path="delivering"  element={<FieldDeliveringPage />}  />
        <Route path="accounting"  element={<FieldAccountingPage />}  />
      </Routes>
    </DashboardLayout>
  );
}
