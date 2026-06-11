import { HashRouter as BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RestaurantProvider, useRestaurant } from "@/contexts/RestaurantContext";
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

// يزامن بين profile في AuthContext و RestaurantContext
function RestaurantSync() {
  const { profile } = useAuth();
  const { loadRestaurant, clearRestaurant } = useRestaurant();
  useEffect(() => {
    if (profile?.restaurantId) {
      loadRestaurant(profile.restaurantId);
    } else {
      clearRestaurant();
    }
  }, [profile?.restaurantId]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RestaurantProvider>
            <RestaurantSync />
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
