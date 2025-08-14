import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    ...(mode === 'development' ? [componentTagger()] : []),
    ...(process.env.ANALYZE ? [visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    })] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          charts: ['recharts', './src/components/PriceDistributionChart.tsx'],
          auth: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          // Heavy components  
          'game-grid': ['./src/components/GameGrid.tsx'],
          'donor-grid': ['./src/components/DonorGrid.tsx'],
          // Admin pages
          admin: [
            './src/pages/AdminDashboardPage.tsx',
            './src/pages/AdminSupportPage.tsx',
            './src/pages/AdminAccountDeletionsPage.tsx',
            './src/pages/QueueManagerPage.tsx',
            './src/pages/AdminHltbDataPage.tsx',
            './src/components/admin/HeaderImageEnhancementCard.tsx'
          ]
        },
      },
    },
    // Enable source maps for better debugging
    sourcemap: mode === 'development',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
}));
