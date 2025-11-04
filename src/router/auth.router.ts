import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

/**
 * Enhanced authentication router guard using auth store
 */
const checkAuth = (router: Router) => {
  router.beforeEach(async (to, from, next) => {
    try {
      
      const publicRoutes = ['/login', '/register'];
      const isPublicRoute = publicRoutes.includes(to.path);

      // Get auth store instance
      const authStore = useAuthStore();
      
      // Check authentication status from store
      const isAuthenticated = authStore.isAuthenticated;


      if (!isAuthenticated && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        next('/login');
        return;
      }
      
      if (isAuthenticated && isPublicRoute) {
        // Authenticated but trying to access public route (login/register)
        next('/');
        return;
      }
      
      // Allow navigation
      next();
    } catch (error) {
      console.error('❌ Router Guard Error:', error);
      // On error, redirect to login for safety
      next('/login');
    }
  });

  router.afterEach((to, from) => {
    // Navigation completed
  });
};

export default checkAuth;
