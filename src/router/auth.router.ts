import type { Router } from 'vue-router';
import { AuthStorage } from '@/core/utils/storage';
import { logger } from '@/core/utils/logger';
import { useAuthStore } from '@/stores/auth';

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
      const isAuthenticated = AuthStorage.isAuthenticated();
      
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
 * This should be called after the router is created
 */
export const initializeAuthRouter = async (router: Router) => {
  try {
    logger.router.debug('Initializing authentication state...');
    
    // Initialize auth store to restore state from storage
    const authStore = useAuthStore();
    if (!authStore.isInitialized) {
      await authStore.initializeAuth();
      logger.router.info('Authentication state initialized');
    } else {
      logger.router.debug('Authentication state already initialized');
    }
    
    // Router is available for future use if needed
    logger.router.debug(`Router instance available: ${!!router}`);
  } catch (error) {
    logger.router.error('Failed to initialize authentication:', error);
  }
};

export default checkAuth;
