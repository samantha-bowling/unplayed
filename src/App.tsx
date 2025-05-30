
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Routes } from "react-router-dom";
import LoadingStateProvider from "@/components/loading-state-provider";
import Index from "@/pages/Index";
import IndexOptimized from "@/pages/IndexOptimized";
import AuthPage from "@/pages/AuthPage";
import AuthCallbackHandler from "@/pages/AuthCallbackHandler";
import SteamAuthHandler from "@/pages/SteamAuthHandler";
import LoginErrorPage from "@/pages/LoginErrorPage";
import AuthDebugPage from "@/pages/AuthDebugPage";
import LibraryPage from "@/pages/LibraryPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import DustPage from "@/pages/DustPage";
import SpendPage from "@/pages/SpendPage";
import SupportPage from "@/pages/SupportPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminSteamDataPage from "@/pages/AdminSteamDataPage";
import AdminHltbDataPage from "@/pages/AdminHltbDataPage";
import AdminSupportPage from "@/pages/AdminSupportPage";
import AdminAccountDeletionsPage from "@/pages/AdminAccountDeletionsPage";
import QueueManagerPage from "@/pages/QueueManagerPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <LoadingStateProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/index-optimized" element={<IndexOptimized />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
          <Route path="/auth/steam" element={<SteamAuthHandler />} />
          <Route path="/auth/error" element={<LoginErrorPage />} />
          <Route path="/auth/debug" element={<AuthDebugPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/dust" element={<DustPage />} />
          <Route path="/spend" element={<SpendPage />} />
          <Route path="/support" element={<SupportPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/steam-data" element={<ProtectedRoute><AdminSteamDataPage /></ProtectedRoute>} />
          <Route path="/admin/hltb-data" element={<ProtectedRoute><AdminHltbDataPage /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute><AdminSupportPage /></ProtectedRoute>} />
          <Route path="/admin/account-deletions" element={<ProtectedRoute><AdminAccountDeletionsPage /></ProtectedRoute>} />
          <Route path="/admin/queue-manager" element={<ProtectedRoute><QueueManagerPage /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LoadingStateProvider>
    </TooltipProvider>
  );
}

export default App;
