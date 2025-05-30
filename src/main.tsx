
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { FullScreenModeProvider } from './context/FullScreenModeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
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
    <BrowserRouter>
      <AuthProvider>
        <DemoModeProvider>
          <FullScreenModeProvider>
            <Sonner />
            <App />
          </FullScreenModeProvider>
        </DemoModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
