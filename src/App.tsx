
// src/App.tsx
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth, AuthStatus } from "@/context/AuthContext";
import SteamLoader from "@/components/SteamLoader";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import LibraryPage from "./pages/LibraryPage";
import PickerPage from "./pages/PickerPage";
import AuthDebugPage from "./pages/AuthDebugPage";
import SupportPage from "./pages/SupportPage";
import AdminSupportPage from "./pages/AdminSupportPage";
import AdminSteamDataPage from "./pages/AdminSteamDataPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminAccountDeletionsPage from "./pages/AdminAccountDeletionsPage";
import QueueManagerPage from "./pages/QueueManagerPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import DustPage from "./pages/DustPage";
import SpendPage from "./pages/SpendPage";
import LoginErrorPage from "./pages/LoginErrorPage";
import AuthCallbackHandler from "@/pages/AuthCallbackHandler";
import SteamAuthHandler from "@/pages/SteamAuthHandler";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTransition, Suspense } from "react";
import routes from "./config/routes";

const App = () => {
  const { status } = useAuth();
  const [isPending] = useTransition();
  const location = useLocation();

  // Show central loading UI only during initial app loading
  if (status === AuthStatus.LOADING) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SteamLoader message="Loading application..." size="md" variant="secondary" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <SteamLoader message="Loading content..." size="md" variant="secondary" />
      </div>
    }>
      <Routes>
        {/* Public routes */}
        <Route path={routes.HOME.path} element={<Index />} />
        <Route path={routes.AUTH.path} element={<AuthPage />} />
        <Route path={routes.AUTH_CALLBACK.path} element={<AuthCallbackHandler />} />
        <Route path={routes.STEAM_CALLBACK.path} element={<SteamAuthHandler />} />
        <Route path={routes.LOGIN_ERROR.path} element={<LoginErrorPage />} />
        <Route path={routes.SUPPORT.path} element={<SupportPage />} />
        <Route path={routes.LEADERBOARD.path} element={<LeaderboardPage />} />

        {/* Admin routes with role protection */}
        <Route
          path={routes.AUTH_DEBUG.path}
          element={
            <ProtectedRoute requiredRole={routes.AUTH_DEBUG.requiredRole}>
              <AuthDebugPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.ADMIN_DASHBOARD.path}
          element={
            <ProtectedRoute requiredRole={routes.ADMIN_DASHBOARD.requiredRole}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.ADMIN_SUPPORT.path}
          element={
            <ProtectedRoute requiredRole={routes.ADMIN_SUPPORT.requiredRole}>
              <AdminSupportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.ADMIN_ACCOUNT_DELETIONS.path}
          element={
            <ProtectedRoute requiredRole={routes.ADMIN_ACCOUNT_DELETIONS.requiredRole}>
              <AdminAccountDeletionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.ADMIN_QUEUE_MANAGER.path}
          element={
            <ProtectedRoute requiredRole={routes.ADMIN_QUEUE_MANAGER.requiredRole}>
              <QueueManagerPage />
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route 
          path={routes.ADMIN_STEAM_DATA.path}
          element={<Navigate to={routes.ADMIN_STEAM_DATA.redirectPath || "/"} replace />}
        />
        <Route
          path={routes.AUTH_STEAM_DATA.path}
          element={<Navigate to={routes.AUTH_STEAM_DATA.redirectPath || "/"} replace />}
        />

        {/* Protected routes requiring authentication */}
        <Route
          path={routes.LIBRARY.path}
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.PICKER.path}
          element={
            <ProtectedRoute>
              <PickerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.DUST.path}
          element={
            <ProtectedRoute>
              <DustPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.SPEND.path}
          element={
            <ProtectedRoute>
              <SpendPage />
            </ProtectedRoute>
          }
        />

        {/* 404 handler */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Global transition loading indicator */}
      {isPending && (
        <div className="fixed bottom-4 right-4 z-50">
          <SteamLoader message="Processing..." size="sm" variant="secondary" />
        </div>
      )}
    </Suspense>
  );
};

export default App;
