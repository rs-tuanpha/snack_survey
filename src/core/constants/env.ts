/**
 * Environment Configuration
 * Centralized environment variables configuration
 */

export const ENV_CONFIG = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  
  // Socket.IO Configuration
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000',
  
  // App Configuration
  APP_ENV: import.meta.env.MODE || 'development',
  IS_DEVELOPMENT: import.meta.env.MODE === 'development',
  IS_PRODUCTION: import.meta.env.MODE === 'production',
  
  // Other environment variables
  APP_NAME: import.meta.env.VITE_APP_NAME || 'SnackSurvey',
} as const;

console.log('🌍 Environment Configuration:', {
  API_BASE_URL: ENV_CONFIG.API_BASE_URL,
  SOCKET_URL: ENV_CONFIG.SOCKET_URL,
  APP_ENV: ENV_CONFIG.APP_ENV,
});

export default ENV_CONFIG;

