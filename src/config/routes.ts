import { RouteType } from '@/types/route.types';

export const routes: readonly RouteType[] = [
  {
    path: '/',
    component: () => import('@/pages/HomePage'),
  },
  {
    path: '/welcome',
    component: () => import('@/pages/WelcomePage'),
  },
  {
    path: '/library',
    component: () => import('@/pages/LibraryPage'),
  },
  {
    path: '/auth',
    component: () => import('@/pages/AuthPage'),
  },
  {
    path: '/login-error',
    component: () => import('@/pages/LoginErrorPage'),
  },
  {
    path: '/profile',
    component: () => import('@/pages/ProfilePage'),
  },
  {
    path: '/admin',
    component: () => import('@/pages/AdminPage'),
  },
  {
    path: '/admin/users',
    component: () => import('@/pages/AdminUsersPage'),
  },
  {
    path: '/admin/steam-queue',
    component: () => import('@/pages/AdminSteamQueuePage'),
  },
  {
    path: '/admin/steam-queue/:id',
    component: () => import('@/pages/AdminSteamQueueDetailsPage'),
  },
  {
    path: '/admin/game-estimates',
    component: () => import('@/pages/AdminGameEstimatesPage'),
  },
  {
    path: '/admin/game-estimates/:id',
    component: () => import('@/pages/AdminGameEstimateDetailsPage'),
  },
  {
    path: '/admin/game-enrichment',
    component: () => import('@/pages/AdminGameEnrichmentPage'),
  },
  {
    path: '/admin/game-enrichment/:id',
    component: () => import('@/pages/AdminGameEnrichmentDetailsPage'),
  },
  {
    path: '/admin/game-details/:id',
    component: () => import('@/pages/AdminGameDetailsPage'),
  },
  {
    path: '/admin/dust-migration',
    component: () => import('@/pages/AdminDustMigrationPage'),
  },
  {
    path: '/dust',
    component: () => import('@/pages/DustPage'),
  },
  {
    path: '/clean',
    component: () => import('@/pages/CleanPage'),
  },
  {
    path: '/settings',
    component: () => import('@/pages/SettingsPage'),
  },
  {
    path: '/about',
    component: () => import('@/pages/AboutPage'),
  },
  {
    path: '/privacy',
    component: () => import('@/pages/PrivacyPage'),
  },
  {
    path: '/terms',
    component: () => import('@/pages/TermsPage'),
  },
  {
    path: '/donate',
    component: () => import('@/pages/DonatePage'),
  },
  {
    path: '/test-dust-migration', component: () => import('@/pages/TestDustMigrationPage')
  },
] as const;
