import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { RequireAuth, RequireRole } from "@/components/auth/RequireAuth";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Items from "@/pages/Items";
import Sales from "@/pages/Sales";
import Purchases from "@/pages/Purchases";
import Suppliers from "@/pages/Suppliers";
import Customers from "@/pages/Customers";
import Finance from "@/pages/Finance";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";
import Tables from "@/pages/Tables";
import Staff from "@/pages/Staff";
import Attendance from "@/pages/Attendance";
import Vat from "@/pages/Vat";
import Expenses from "@/pages/Expenses";
import SalesHistory from "@/pages/SalesHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />

              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/items" element={<Items />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/tables" element={<Tables />} />
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/vat" element={<Vat />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/sales-history" element={<SalesHistory />} />
                  <Route path="/settings" element={<Settings />} />

                  <Route element={<RequireRole role="admin" />}>
                    <Route path="/admin" element={<Admin />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
