
// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthStatus } from "@/context/AuthContext";
import SteamLoader from "@/components/SteamLoader";
import LoadingFallback from "@/components/LoadingFallback";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTransition, Suspense, lazy, useEffect } from "react";
import { UserRole } from "@/utils/auth-utils";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";

// Lazy load all page components for better code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const AuthDebugPage = lazy(() => import("./pages/AuthDebugPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const AdminSupportPage = lazy(() => import("./pages/AdminSupportPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminAccountDeletionsPage = lazy(() => import("./pages/AdminAccountDeletionsPage"));
const QueueManagerPage = lazy(() => import("./pages/QueueManagerPage"));
const AdminHltbDataPage = lazy(() => import("./pages/AdminHltbDataPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const DustPage = lazy(() => import("./pages/DustPage"));
const SpendPage = lazy(() => import("./pages/SpendPage"));
const LoginErrorPage = lazy(() => import("./pages/LoginErrorPage"));
const AuthCallbackHandler = lazy(() => import("@/pages/AuthCallbackHandler"));
const SteamAuthHandler = lazy(() => import("@/pages/SteamAuthHandler"));

const App = () => {
  const { status } = useAuth();
  const [isPending] = useTransition();
  const { trackCustomMetric } = usePerformanceMonitor();

  // Track app initialization time
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      trackCustomMetric('app_initialization', performance.now() - startTime);
    };
  }, [trackCustomMetric]);

  // Show central loading UI only during initial app loading
  if (status === AuthStatus.LOADING) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SteamLoader message="Loading application..." size="md" variant="secondary" />
      </div>
    );
  }

  return (
    <>
      <PWAInstallBanner />
      <Suspense fallback={<LoadingFallback message="Loading content..." />}>
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
    </>
  );
};

export default App;
