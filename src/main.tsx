
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SteamSessionProvider } from './hooks/useSteamSession';
import { AuthProvider } from './context/AuthContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { FullScreenModeProvider } from './context/FullScreenModeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Create a client with stale time to prevent too many re-fetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          {/* Move SteamSessionProvider outside DemoModeProvider to ensure proper dependency order */}
          <SteamSessionProvider>
            {/* DemoModeProvider inside SteamSessionProvider so it can access both auth and steam contexts */}
            <DemoModeProvider>
              <FullScreenModeProvider>
                <App />
              </FullScreenModeProvider>
            </DemoModeProvider>
          </SteamSessionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
