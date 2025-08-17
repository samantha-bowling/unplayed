
// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthStatus } from "@/context/AuthContext";
import SteamLoader from "@/components/SteamLoader";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import LibraryPage from "./pages/LibraryPage";
import AuthDebugPage from "./pages/AuthDebugPage";
import SupportPage from "./pages/SupportPage";
import AdminSupportPage from "./pages/AdminSupportPage";
import AdminSteamDataPage from "./pages/AdminSteamDataPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminAccountDeletionsPage from "./pages/AdminAccountDeletionsPage";
import QueueManagerPage from "./pages/QueueManagerPage";
import AdminHltbDataPage from "./pages/AdminHltbDataPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import DustPage from "./pages/DustPage";
import SpendPage from "./pages/SpendPage";
import LoginErrorPage from "./pages/LoginErrorPage";
import AuthCallbackHandler from "@/pages/AuthCallbackHandler";
import SteamAuthHandler from "@/pages/SteamAuthHandler";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTransition, Suspense } from "react";
import { UserRole } from "@/utils/auth-utils";

const App = () => {
  const { status } = useAuth();
  const [isPending] = useTransition();

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
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackHandler />} />
        <Route path="/auth/steam-callback" element={<SteamAuthHandler />} />
        <Route path="/login-error" element={<LoginErrorPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        {/* Admin routes with role protection */}
        <Route
          path="/auth-debug"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <AuthDebugPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <AdminSupportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/account-deletions"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <AdminAccountDeletionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queue-manager"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <QueueManagerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/hltb-data"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <AdminHltbDataPage />
            </ProtectedRoute>
          }
        />

        {/* Redirects for old routes */}
        <Route path="/admin/steam-data" element={<Navigate to="/admin/hltb-data" replace />} />
        <Route path="/auth/steam-data" element={<Navigate to="/admin/hltb-data" replace />} />

        {/* Protected routes requiring authentication */}
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dust"
          element={
            <ProtectedRoute>
              <DustPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spend"
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
