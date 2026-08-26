import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppShell } from "@/components/layout/AppShell";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { SearchPage } from "@/pages/search/SearchPage";
import { SearchResultsPage } from "@/pages/search/SearchResultsPage";
import { LeadsPage } from "@/pages/leads/LeadsPage";
import { CompanyDetailPage } from "@/pages/companies/CompanyDetailPage";
import { TagsPage } from "@/pages/tags/TagsPage";
import { ListsPage } from "@/pages/lists/ListsPage";
import { ExportsPage } from "@/pages/exports/ExportsPage";
import { EnrichmentPage } from "@/pages/EnrichmentPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { CreditsPage } from "@/pages/CreditsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { AdminOverviewPage } from "@/pages/admin/AdminOverviewPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminWorkspacesPage } from "@/pages/admin/AdminWorkspacesPage";
import { AdminProvidersPage } from "@/pages/admin/AdminProvidersPage";
import { AdminPlansPage } from "@/pages/admin/AdminPlansPage";
import { AdminPlanDetailPage } from "@/pages/admin/AdminPlanDetailPage";
import { AdminCreditsPage } from "@/pages/admin/AdminCreditsPage";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage";
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate as RouterNavigate } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <RouterNavigate to="/dashboard" replace />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppShell><DashboardPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <AppShell><SearchPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search/:id"
                element={
                  <ProtectedRoute>
                    <AppShell><SearchResultsPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leads"
                element={
                  <ProtectedRoute>
                    <AppShell><LeadsPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies/:id"
                element={
                  <ProtectedRoute>
                    <AppShell><CompanyDetailPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tags"
                element={
                  <ProtectedRoute>
                    <AppShell><TagsPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lists"
                element={
                  <ProtectedRoute>
                    <AppShell><ListsPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exports"
                element={
                  <ProtectedRoute>
                    <AppShell><ExportsPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/enrichment"
                element={
                  <ProtectedRoute>
                    <AppShell><EnrichmentPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/integrations"
                element={
                  <ProtectedRoute>
                    <AppShell><IntegrationsPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/credits"
                element={
                  <ProtectedRoute>
                    <AppShell><CreditsPage /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppShell><SettingsPage /></AppShell>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes with dedicated layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<AdminOverviewPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/workspaces" element={<AdminWorkspacesPage />} />
                <Route path="/admin/providers" element={<AdminProvidersPage />} />
                <Route path="/admin/plans" element={<AdminPlansPage />} />
                <Route path="/admin/plans/:id" element={<AdminPlanDetailPage />} />
                <Route path="/admin/credits" element={<AdminCreditsPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}