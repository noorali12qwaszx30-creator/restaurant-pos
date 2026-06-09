import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NewOrderTab } from "./components/NewOrderTab";
import { ActiveOrdersTab } from "./components/ActiveOrdersTab";
import { SearchReportsTab } from "./components/SearchReportsTab";
import { HistoryTab } from "./components/HistoryTab";

export function CashierDashboard() {
  return (
    <DashboardLayout role="cashier" className="!px-0">
      <Routes>
        {/* الرئيسية — POS لإنشاء الطلبات */}
        <Route index element={<NewOrderTab />} />
        {/* الطلبات — متابعة الطلبات النشطة وحالتها */}
        <Route path="orders" element={<ActiveOrdersTab />} />
        {/* بحث — البحث العميق في الطلبات والتقارير */}
        <Route path="search" element={<SearchReportsTab />} />
        {/* السجل — الطلبات المكتملة والملغية */}
        <Route path="history" element={<HistoryTab />} />
      </Routes>
    </DashboardLayout>
  );
}
