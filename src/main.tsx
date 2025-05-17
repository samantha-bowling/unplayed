
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
import AuthHydrationGate from '@/components/AuthHydrationGate';

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
        {/* Auth provider is the most critical and should be at the root */}
        <AuthProvider>
          {/* SteamSession provider comes next as it can be accessed by Demo mode */}
          <SteamSessionProvider>
            {/* Demo mode needs access to both auth and steam contexts */}
            <DemoModeProvider>
              {/* Auth hydration gate prevents rendering until auth state is stable */}
              <AuthHydrationGate>
                {/* Full screen mode is UI only and can be inside the gate */}
                <FullScreenModeProvider>
                  <App />
                </FullScreenModeProvider>
              </AuthHydrationGate>
            </DemoModeProvider>
          </SteamSessionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
