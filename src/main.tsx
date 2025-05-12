import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SteamSessionProvider } from './hooks/useSteamSession'; // make sure the path matches your project

createRoot(document.getElementById("root")!).render(
  <SteamSessionProvider>
    <App />
  </SteamSessionProvider>
);
