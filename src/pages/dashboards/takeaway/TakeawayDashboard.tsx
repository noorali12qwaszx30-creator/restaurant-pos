import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TakeawayMenuPage }      from "./pages/TakeawayMenuPage";
import { TakeawayOrdersPage }    from "./pages/TakeawayOrdersPage";
import { TakeawayCompletedPage } from "./pages/TakeawayCompletedPage";
import { TakeawayCancelledPage } from "./pages/TakeawayCancelledPage";

export function TakeawayDashboard() {
  return (
    <DashboardLayout role="takeaway" className="!px-0">
      <Routes>
        <Route index                  element={<TakeawayMenuPage />}      />
        <Route path="orders"          element={<TakeawayOrdersPage />}    />
        <Route path="completed"       element={<TakeawayCompletedPage />} />
        <Route path="cancelled"       element={<TakeawayCancelledPage />} />
      </Routes>
    </DashboardLayout>
  );
}
