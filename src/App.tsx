
// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthStatus } from "@/context/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import SteamLoader from "@/components/SteamLoader";
import { Suspense, lazy } from "react";
import { UserRole } from "@/utils/auth-utils";

// Eager-loaded (common entry points)
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";

// Lazy-loaded pages
const NotFound = lazy(() => import("./pages/NotFound"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const AuthDebugPage = lazy(() => import("./pages/AuthDebugPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const AdminSupportPage = lazy(() => import("./pages/AdminSupportPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminAccountDeletionsPage = lazy(() => import("./pages/AdminAccountDeletionsPage"));
const QueueManagerPage = lazy(() => import("./pages/QueueManagerPage"));
const AdminDataManagerPage = lazy(() => import("./pages/AdminDataManagerPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const DustPage = lazy(() => import("./pages/DustPage"));
const SpendPage = lazy(() => import("./pages/SpendPage"));
const LoginErrorPage = lazy(() => import("./pages/LoginErrorPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AuthCallbackHandler = lazy(() => import("@/pages/AuthCallbackHandler"));
const SteamAuthHandler = lazy(() => import("@/pages/SteamAuthHandler"));
const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute"));

const App = () => {
  const { status } = useAuth();

  // Show central loading UI only during initial app loading
  if (status === AuthStatus.LOADING) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SteamLoader message="Loading application..." size="md" variant="secondary" />
      </div>
    );
  }

  return (
    <HelmetProvider>
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
          
          {/* Profile routes - both long and short URLs */}
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/u/:userId" element={<ProfilePage />} />

        {/* 
          Admin routes with role protection
          
          SECURITY: Admin routes use ProtectedRoute with requiredRole='admin', which automatically
          enables server-side RPC verification via verifyAdminRPC(). This provides defense-in-depth:
          1. Cached role check (fast UI, prevents flicker)
          2. Server RPC verification (secure enforcement, prevents privilege escalation)
          3. 5-second timeout protection (fails closed on network issues)
          4. Race condition protection (prevents state updates on unmounted components)
        */}
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
          path="/admin/data-manager"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <AdminDataManagerPage />
            </ProtectedRoute>
          }
        />

        {/* Redirects for old routes */}
        <Route path="/admin/steam-data" element={<Navigate to="/admin/data-manager" replace />} />
        <Route path="/auth/steam-data" element={<Navigate to="/admin/data-manager" replace />} />
        <Route path="/admin/hltb-data" element={<Navigate to="/admin/data-manager" replace />} />

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
      
    </Suspense>
    </HelmetProvider>
  );
};

export default App;
