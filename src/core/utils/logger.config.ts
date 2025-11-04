/**
 * Logger configuration for different environments
 */

import { logger, LogLevel } from '@/core/utils/logger'

/**
 * Configure logger for production environment
 */
export const configureProductionLogger = (): void => {
  // Production mode - only errors and critical warnings
  logger.enableProductionMode()

  // Disable all debug and info logs
  logger.setLevel(LogLevel.ERROR)

  // Only enable console for critical errors
  logger.setCategoryEnabled('auth', false)
  logger.setCategoryEnabled('api', false)
  logger.setCategoryEnabled('router', false)
  logger.setCategoryEnabled('storage', false)
  logger.setCategoryEnabled('ui', false)
  logger.setCategoryEnabled('socket', false)
  logger.setCategoryEnabled('topic', false)
}

/**
 * Configure logger for development environment
 */
export const configureDevelopmentLogger = (): void => {
  // Development mode - enable all logs
  logger.enableAll()
  logger.setLevel(LogLevel.DEBUG)
}

/**
 * Configure logger for testing environment
 */
export const configureTestingLogger = (): void => {
  // Testing mode - disable all logs
  logger.disableAll()
}

/**
 * Auto-configure logger based on environment
 */
export const autoConfigureLogger = (): void => {
  const env = process.env.NODE_ENV

  switch (env) {
    case 'production':
      configureProductionLogger()
      break
    case 'development':
      configureDevelopmentLogger()
      break
    case 'test':
      configureTestingLogger()
      break
    default:
      // Default to development mode
      configureDevelopmentLogger()
  }
}

/**
 * Initialize logger configuration
 * Call this in main.ts before any other imports
 */
export const initializeLogger = (): void => {
  autoConfigureLogger()
}
