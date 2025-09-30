import type { Router } from 'vue-router';
import { logger } from '@/core/utils/logger';
import { useAuthStore } from '@/stores/auth';
import { getCookieRaw, CookieKeys } from '@/core/utils/cookieUtils'

// Simple cookie utilities for router use - using type-safe CookieKeys
const cookieUtils = {
  get: (key: keyof typeof CookieKeys): string | null => getCookieRaw(CookieKeys[key]),
  getJSON: <T>(key: keyof typeof CookieKeys): T | null => {
    const value = getCookieRaw(CookieKeys[key])
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
}

/**
 * Enhanced authentication router guard with cookie storage integration
 */
const checkAuth = (router: Router) => {
  router.beforeEach(async (to, from, next) => {
    try {
      logger.router.debug(`Checking authentication for route: ${to.path}`);

      const publicRoutes = ['/login', '/register'];
      const isPublicRoute = publicRoutes.includes(to.path);

      // Check authentication status using AuthStorage (cookies)
      const accessToken = cookieUtils.get('ACCESS_TOKEN')
      const user = cookieUtils.getJSON('USER_DATA')
      const isAuthenticated = !!(accessToken && user);

      logger.router.debug(`Authentication status: ${isAuthenticated}`);

      if (!isAuthenticated && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        logger.router.info('Redirecting to login (not authenticated)');
        next('/login');
      }
      if (isAuthenticated && isPublicRoute) {
        // Authenticated but trying to access public route (login/register)
        logger.router.info('Redirecting to home (already authenticated)');
        next('/');
      }
      // Allow navigation
      logger.router.debug('Navigation allowed');
      next();
    } catch (error) {
      logger.router.error('Router Guard Error:', error);
      // On error, redirect to login for safety
      next('/login');
    }
  });

  router.afterEach((to, from) => {
    // Log navigation for debugging
    logger.router.debug(`Navigation completed: ${from.path} → ${to.path}`);
  });
};

/**
 * Initialize authentication state when router is set up
 * This should be called after the router is created and storage is hydrated
 */
export const initializeAuthRouter = async (router: Router) => {
  try {
    logger.router.debug('Initializing authentication state...');

    // Wait for storage manager to be initialized
    // Storage initialization moved to hooks
    logger.router.info('Storage initialization skipped (moved to hooks)');

    // Initialize auth store to restore state from storage
    const authStore = useAuthStore();

    // Hydrate auth store from storage
    authStore.initializeFromStorage();

    if (authStore.isAuthenticated) {
      logger.router.info('Authentication state initialized from storage');
    } else {
      logger.router.debug('No authentication state found in storage');
    }

    // Router is available for future use if needed
    logger.router.debug(`Router instance available: ${!!router}`);
  } catch (error) {
    logger.router.error('Failed to initialize authentication:', error);
  }
};

export default checkAuth;
