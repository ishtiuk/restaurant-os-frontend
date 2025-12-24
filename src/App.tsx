import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { LicenseProvider } from "@/contexts/LicenseContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { TenantProvider } from "./contexts/TenantContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { RequireAuth, RequireRole } from "@/components/auth/RequireAuth";

// Eager load critical pages (login, dashboard) - needed immediately
import Login from "@/pages/Login";

// Lazy load all other pages - only load when user navigates to them
// This significantly reduces initial bundle size and memory usage
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Items = lazy(() => import("@/pages/Items"));
const Sales = lazy(() => import("@/pages/Sales"));
const Purchases = lazy(() => import("@/pages/Purchases"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const Customers = lazy(() => import("@/pages/Customers"));
const Finance = lazy(() => import("@/pages/Finance"));
const FinanceTransactions = lazy(() => import("@/pages/FinanceTransactions"));
const BankAccounts = lazy(() => import("@/pages/BankAccounts"));
const MfsAccounts = lazy(() => import("@/pages/MfsAccounts"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Tables = lazy(() => import("@/pages/Tables"));
const Staff = lazy(() => import("@/pages/Staff"));
const Attendance = lazy(() => import("@/pages/Attendance"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const SalesHistory = lazy(() => import("@/pages/SalesHistory"));
const LicenseActivation = lazy(() => import("@/pages/LicenseActivation"));

// Loading fallback component for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TimezoneProvider>
        <TenantProvider>
          <AppDataProvider>
            <LicenseProvider>
              <PermissionsProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route 
                      path="/license-activation" 
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <LicenseActivation />
                        </Suspense>
                      } 
                    />

                    <Route element={<RequireAuth />}>
                      <Route element={<AppLayout />}>
                        <Route 
                          path="/dashboard" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Dashboard />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/items" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Items />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/sales" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Sales />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/tables" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Tables />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/purchases" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Purchases />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/suppliers" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Suppliers />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/customers" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Customers />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/staff" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Staff />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/attendance" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Attendance />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/finance" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Finance />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/finance/transactions" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <FinanceTransactions />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/finance/banks" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <BankAccounts />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/finance/mfs" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <MfsAccounts />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/expenses" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Expenses />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/reports" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Reports />
                            </Suspense>
                          } 
                        />
                        <Route 
                          path="/sales-history" 
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <SalesHistory />
                            </Suspense>
                          } 
                        />

                        {/* Settings is available to restaurant owner and superadmin */}
                        <Route element={<RequireRole role={["owner", "superadmin"]} />}>
                          <Route 
                            path="/settings" 
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <Settings />
                              </Suspense>
                            } 
                          />
                        </Route>

                        <Route element={<RequireRole role="superadmin" />}>
                          <Route 
                            path="/admin" 
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <Admin />
                              </Suspense>
                            } 
                          />
                        </Route>
                      </Route>
                    </Route>

                    <Route 
                      path="*" 
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <NotFound />
                        </Suspense>
                      } 
                    />
                  </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </PermissionsProvider>
            </LicenseProvider>
          </AppDataProvider>
        </TenantProvider>
      </TimezoneProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
