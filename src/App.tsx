import { HashRouter as BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { NotifyProvider } from "@/components/notifications/NotificationContext";
import { AppRouter } from "@/routes/AppRouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RestaurantProvider>
            <SettingsProvider>
              <OrderProvider>
                <NotifyProvider>
                  <AppRouter />
                </NotifyProvider>
              </OrderProvider>
            </SettingsProvider>
          </RestaurantProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
