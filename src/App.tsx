
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
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackHandler />} />
        <Route path="/auth/steam-callback" element={<SteamAuthHandler />} />
        <Route path="/login-error" element={<LoginErrorPage />} />
        <Route
          path="/auth-debug"
          element={
            <ProtectedRoute requiredRole="admin">
              <AuthDebugPage />
            </ProtectedRoute>
          }
        />
        <Route path="/support" element={<SupportPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminSupportPage />
            </ProtectedRoute>
          }
        />
        {/* Add redirect from the old path to the new queue manager path */}
        <Route 
          path="/admin/steam-data"
          element={<Navigate to="/admin/queue-manager" replace />}
        />
        <Route
          path="/auth/steam-data"
          element={<Navigate to="/admin/queue-manager" replace />}
        />
        <Route
          path="/admin/account-deletions"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminAccountDeletionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queue-manager"
          element={
            <ProtectedRoute requiredRole="admin">
              <QueueManagerPage />
            </ProtectedRoute>
          }
        />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/picker"
          element={
            <ProtectedRoute>
              <PickerPage />
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
