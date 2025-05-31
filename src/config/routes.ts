
/**
 * Application Routes Configuration
 * 
 * This centralizes route definitions, permissions, and metadata
 * for better route management and access control.
 */
import { UserRole } from "@/utils/auth-utils";

export interface RouteConfig {
  path: string;
  requiresAuth: boolean; 
  requiredRole?: string;
  redirectPath?: string;
  title?: string;
  description?: string;
}

/**
 * Main application routes with metadata and permission requirements
 */
export const routes: Record<string, RouteConfig> = {
  // Public routes
  HOME: {
    path: "/",
    requiresAuth: false,
    title: "Unplayed - Find Games To Play",
    description: "Discover games in your Steam library that you haven't played yet."
  },
  AUTH: {
    path: "/auth",
    requiresAuth: false,
    title: "Sign In - Unplayed",
    description: "Sign in to your Unplayed account."
  },
  AUTH_CALLBACK: {
    path: "/auth/callback",
    requiresAuth: false
  },
  STEAM_CALLBACK: {
    path: "/auth/steam-callback",
    requiresAuth: false
  },
  LOGIN_ERROR: {
    path: "/login-error",
    requiresAuth: false
  },
  SUPPORT: {
    path: "/support",
    requiresAuth: false
  },
  LEADERBOARD: {
    path: "/leaderboard",
    requiresAuth: false
  },
  
  // Protected routes (require authentication)
  LIBRARY: {
    path: "/library",
    requiresAuth: true
  },
  DUST: {
    path: "/dust",
    requiresAuth: true
  },
  SPEND: {
    path: "/spend",
    requiresAuth: true
  },
  
  // Admin routes (require admin role)
  AUTH_DEBUG: {
    path: "/auth-debug",
    requiresAuth: true,
    requiredRole: UserRole.ADMIN
  },
  ADMIN_DASHBOARD: {
    path: "/admin/dashboard",
    requiresAuth: true,
    requiredRole: UserRole.ADMIN
  },
  ADMIN_SUPPORT: {
    path: "/admin/support",
    requiresAuth: true,
    requiredRole: UserRole.ADMIN
  },
  ADMIN_ACCOUNT_DELETIONS: {
    path: "/admin/account-deletions",
    requiresAuth: true,
    requiredRole: UserRole.ADMIN
  },
  ADMIN_QUEUE_MANAGER: {
    path: "/admin/queue-manager",
    requiresAuth: true,
    requiredRole: UserRole.ADMIN
  },
  ADMIN_HLTB_DATA: {
    path: "/admin/hltb-data",
    requiresAuth: true,
    requiredRole: UserRole.ADMIN,
    title: "Data Manager - Unplayed",
    description: "Manage and monitor HowLongToBeat data, and other metadata integrations for your game catalog."
  },
  
  // Redirects
  ADMIN_STEAM_DATA: {
    path: "/admin/steam-data",
    requiresAuth: true,
    redirectPath: "/admin/hltb-data"
  },
  AUTH_STEAM_DATA: {
    path: "/auth/steam-data",
    requiresAuth: true,
    redirectPath: "/admin/hltb-data"
  }
};

/**
 * Get route configuration by path
 */
export function getRouteByPath(path: string): RouteConfig | undefined {
  return Object.values(routes).find(route => route.path === path);
}

/**
 * Format path with parameters
 * @example formatPath('/users/:id', { id: '123' }) => '/users/123'
 */
export function formatPath(path: string, params: Record<string, string> = {}): string {
  let formattedPath = path;
  
  Object.entries(params).forEach(([key, value]) => {
    formattedPath = formattedPath.replace(`:${key}`, encodeURIComponent(value));
  });
  
  return formattedPath;
}

export default routes;
