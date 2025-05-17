
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

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider> {/* AuthProvider now wraps SteamSessionProvider to ensure context is available */}
          <SteamSessionProvider>
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
