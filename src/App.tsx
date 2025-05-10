
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DemoModeProvider } from "@/context/DemoModeContext";
import { FullScreenModeProvider } from "@/context/FullScreenModeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import LibraryPage from "./pages/LibraryPage";
import PickerPage from "./pages/PickerPage";
import AuthDebugPage from "./pages/AuthDebugPage";
import SupportPage from "./pages/SupportPage";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoModeProvider>
            <FullScreenModeProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth-debug" element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthDebugPage />
                  </ProtectedRoute>
                } />
                <Route path="/support" element={<SupportPage />} />
                {/* Protected routes */}
                <Route path="/library" element={
                  <ProtectedRoute>
                    <LibraryPage />
                  </ProtectedRoute>
                } />
                <Route path="/picker" element={
                  <ProtectedRoute>
                    <PickerPage />
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </FullScreenModeProvider>
          </DemoModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
