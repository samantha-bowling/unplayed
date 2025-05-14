
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import LibraryPage from "./pages/LibraryPage";
import PickerPage from "./pages/PickerPage";
import AuthDebugPage from "./pages/AuthDebugPage";
import SupportPage from "./pages/SupportPage";
import AdminSupportPage from "./pages/AdminSupportPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import DustPage from "./pages/DustPage";
import SpendPage from "./pages/SpendPage";
import LoginErrorPage from "./pages/LoginErrorPage";
import WelcomeGate from "@/pages/WelcomeGate";
import AuthCallbackHandler from "@/pages/AuthCallbackHandler";
import ProtectedRoute from "@/components/ProtectedRoute";

if (window.location.hash.includes("access_token")) {
  window.history.replaceState(null, "", window.location.pathname);
  console.log("🧹 Cleaned up #access_token from URL (App.tsx)");
}

const App = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/callback" element={<AuthCallbackHandler />} />
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
      path="/admin/support"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminSupportPage />
        </ProtectedRoute>
      }
    />
    <Route path="/leaderboard" element={<LeaderboardPage />} />
    <Route path="/welcome" element={<WelcomeGate />} />
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
);

export default App;
