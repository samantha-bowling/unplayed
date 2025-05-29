import { lazy } from 'react';

// Main routes
export const HOME_ROUTE = '/';
export const LOGIN_ROUTE = '/login';
export const CALLBACK_ROUTE = '/callback';

// Main features
export const LIBRARY_ROUTE = '/library';
export const DUSTSCORE_ROUTE = '/dust';
export const SPEND_ROUTE = '/spend';

// Admin routes
export const ADMIN_DASHBOARD_ROUTE = '/admin';
export const ADMIN_SUPPORT_ROUTE = '/admin/support';
export const ADMIN_QUEUE_MANAGER_ROUTE = '/admin/queue';
export const ADMIN_STEAM_DATA_ROUTE = '/admin/steam-data';
export const ADMIN_ACCOUNT_DELETIONS_ROUTE = '/admin/account-deletions';

// Other routes
export const LEADERBOARD_ROUTE = '/leaderboard';
export const RANDOM_PICKER_ROUTE = '/random';
export const SUPPORT_ROUTE = '/support';
export const LOGIN_ERROR_ROUTE = '/login-error';
export const NOT_FOUND_ROUTE = '*';
export const AUTH_DEBUG_ROUTE = '/auth-debug'; // Used for debug auth flow in development

// Models
export interface RouteConfig {
  path: string;
  component: any; // React component
  isAdmin?: boolean;
  isProtected?: boolean;
}

// Lazy route components
const Index = lazy(() => import('@/pages/Index'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const AuthCallbackHandler = lazy(() => import('@/pages/AuthCallbackHandler'));
const LibraryPage = lazy(() => import('@/pages/LibraryPage'));
const DustPage = lazy(() => import('@/pages/DustPage'));
const SpendPage = lazy(() => import('@/pages/SpendPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));
const LoginErrorPage = lazy(() => import('@/pages/LoginErrorPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const AuthDebugPage = lazy(() => import('@/pages/AuthDebugPage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
const AdminSupportPage = lazy(() => import('@/pages/AdminSupportPage'));
const QueueManagerPage = lazy(() => import('@/pages/QueueManagerPage'));
const AdminSteamDataPage = lazy(() => import('@/pages/AdminSteamDataPage'));
const AdminAccountDeletionsPage = lazy(() => import('@/pages/AdminAccountDeletionsPage'));

// Define routes
export const routes: RouteConfig[] = [
  // Public routes
  { path: HOME_ROUTE, component: Index },
  { path: LOGIN_ROUTE, component: AuthPage },
  { path: CALLBACK_ROUTE, component: AuthCallbackHandler },
  { path: LOGIN_ERROR_ROUTE, component: LoginErrorPage },
  { path: NOT_FOUND_ROUTE, component: NotFound },
  
  // Protected routes
  { path: LIBRARY_ROUTE, component: LibraryPage, isProtected: true },
  { path: DUSTSCORE_ROUTE, component: DustPage, isProtected: true },
  { path: SPEND_ROUTE, component: SpendPage, isProtected: true },
  { path: LEADERBOARD_ROUTE, component: LeaderboardPage, isProtected: true },
  { path: SUPPORT_ROUTE, component: SupportPage, isProtected: true },
  
  // Admin routes
  { path: ADMIN_DASHBOARD_ROUTE, component: AdminDashboardPage, isProtected: true, isAdmin: true },
  { path: ADMIN_SUPPORT_ROUTE, component: AdminSupportPage, isProtected: true, isAdmin: true },
  { path: ADMIN_QUEUE_MANAGER_ROUTE, component: QueueManagerPage, isProtected: true, isAdmin: true },
  { path: ADMIN_STEAM_DATA_ROUTE, component: AdminSteamDataPage, isProtected: true, isAdmin: true },
  { path: ADMIN_ACCOUNT_DELETIONS_ROUTE, component: AdminAccountDeletionsPage, isProtected: true, isAdmin: true },
  
  // Debug routes (only available in development)
  { path: AUTH_DEBUG_ROUTE, component: AuthDebugPage },
];
