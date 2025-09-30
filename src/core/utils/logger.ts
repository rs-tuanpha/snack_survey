/**
 * Logger utility for controlled logging in development and production
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableAuthLogs: boolean
  enableApiLogs: boolean
  enableRouterLogs: boolean
  enableStorageLogs: boolean
  enableUILogs: boolean
  enableSocketLogs: boolean
  enableTopicLogs: boolean
}

class Logger {
  private config: LoggerConfig

  constructor() {
    // Set default config based on environment
    const isDevelopment = process.env.NODE_ENV === 'development'

    this.config = {
      level: isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR,
      enableConsole: isDevelopment,
      enableAuthLogs: isDevelopment,
      enableApiLogs: isDevelopment,
      enableRouterLogs: isDevelopment,
      enableStorageLogs: isDevelopment,
      enableUILogs: isDevelopment,
      enableSocketLogs: isDevelopment,
      enableTopicLogs: isDevelopment
    }
  }

  private shouldLog(level: LogLevel, category?: string): boolean {
    if (!this.config.enableConsole) return false
    if (level > this.config.level) return false

    // Category-specific logging control
    if (category === 'auth' && !this.config.enableAuthLogs) return false
    if (category === 'api' && !this.config.enableApiLogs) return false
    if (category === 'router' && !this.config.enableRouterLogs) return false
    if (category === 'storage' && !this.config.enableStorageLogs) return false
    if (category === 'ui' && !this.config.enableUILogs) return false
    if (category === 'socket' && !this.config.enableSocketLogs) return false
    if (category === 'topic' && !this.config.enableTopicLogs) return false

    return true
  }

  private formatMessage(level: string, category: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] ${level} [${category.toUpperCase()}]: ${message}`
  }

  error(category: string, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR, category)) {
      console.error(this.formatMessage('ERROR', category, message), ...args)
    }
  }

  warn(category: string, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN, category)) {
      console.warn(this.formatMessage('WARN', category, message), ...args)
    }
  }

  info(category: string, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO, category)) {
      console.info(this.formatMessage('INFO', category, message), ...args)
    }
  }

  debug(category: string, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      console.debug(this.formatMessage('DEBUG', category, message), ...args)
    }
  }

  // Convenience methods for specific categories
  auth = {
    error: (message: string, ...args: any[]) => this.error('auth', message, ...args),
    warn: (message: string, ...args: any[]) => this.warn('auth', message, ...args),
    info: (message: string, ...args: any[]) => this.info('auth', message, ...args),
    debug: (message: string, ...args: any[]) => this.debug('auth', message, ...args)
  }

  api = {
    error: (message: string, ...args: any[]) => this.error('api', message, ...args),
    warn: (message: string, ...args: any[]) => this.warn('api', message, ...args),
    info: (message: string, ...args: any[]) => this.info('api', message, ...args),
    debug: (message: string, ...args: any[]) => this.debug('api', message, ...args)
  }

  router = {
    error: (message: string, ...args: any[]) => this.error('router', message, ...args),
    warn: (message: string, ...args: any[]) => this.warn('router', message, ...args),
    info: (message: string, ...args: any[]) => this.info('router', message, ...args),
    debug: (message: string, ...args: any[]) => this.debug('router', message, ...args)
  }

  storage = {
    error: (message: string, ...args: any[]) => this.error('storage', message, ...args),
    warn: (message: string, ...args: any[]) => this.warn('storage', message, ...args),
    info: (message: string, ...args: any[]) => this.info('storage', message, ...args),
    debug: (message: string, ...args: any[]) => this.debug('storage', message, ...args)
  }

  app = {
    error: (message: string, ...args: any[]) => this.error('app', message, ...args),
    warn: (message: string, ...args: any[]) => this.warn('app', message, ...args),
    info: (message: string, ...args: any[]) => this.info('app', message, ...args),
    debug: (message: string, ...args: any[]) => this.debug('app', message, ...args)
  }

  ui = {
    error: (message: string, ...args: any[]) => this.error('ui', message, ...args),
    warn: (message: string, ...args: any[]) => this.warn('ui', message, ...args),
    info: (message: string, ...args: any[]) => this.info('ui', message, ...args),
    debug: (message: string, ...args: any[]) => this.debug('ui', message, ...args)
  }

  socket = {
    error: (message: string, ...args: any[]) => this.error('socket', message, ...args),
    warn: (message: string, ...args: any[]) => this.warn('socket', message, ...args),
    info: (message: string, ...args: any[]) => this.info('socket', message, ...args),
    debug: (message: string, ...args: any[]) => this.debug('socket', message, ...args)
  }

  topic = {
    error: (message: string, ...args: any[]) => this.error('topic', message, ...args),
    warn: (message: string, ...args: any[]) => this.warn('topic', message, ...args),
    info: (message: string, ...args: any[]) => this.info('topic', message, ...args),
    debug: (message: string, ...args: any[]) => this.debug('topic', message, ...args)
  }

  // Configuration methods
  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  setCategoryEnabled(category: 'auth' | 'api' | 'router' | 'storage' | 'ui' | 'socket' | 'topic', enabled: boolean): void {
    switch (category) {
      case 'auth':
        this.config.enableAuthLogs = enabled
        break
      case 'api':
        this.config.enableApiLogs = enabled
        break
      case 'router':
        this.config.enableRouterLogs = enabled
        break
      case 'storage':
        this.config.enableStorageLogs = enabled
        break
      case 'ui':
        this.config.enableUILogs = enabled
        break
      case 'socket':
        this.config.enableSocketLogs = enabled
        break
      case 'topic':
        this.config.enableTopicLogs = enabled
        break
    }
  }

  enableAll(): void {
    this.config.enableConsole = true
    this.config.enableAuthLogs = true
    this.config.enableApiLogs = true
    this.config.enableRouterLogs = true
    this.config.enableStorageLogs = true
    this.config.enableUILogs = true
    this.config.enableSocketLogs = true
    this.config.enableTopicLogs = true
  }

  disableAll(): void {
    this.config.enableConsole = false
    this.config.enableAuthLogs = false
    this.config.enableApiLogs = false
    this.config.enableRouterLogs = false
    this.config.enableStorageLogs = false
    this.config.enableUILogs = false
    this.config.enableSocketLogs = false
    this.config.enableTopicLogs = false
  }

  // Production mode - only errors
  enableProductionMode(): void {
    this.config.level = LogLevel.ERROR
    this.config.enableConsole = true
    this.config.enableAuthLogs = false
    this.config.enableApiLogs = false
    this.config.enableRouterLogs = false
    this.config.enableStorageLogs = false
    this.config.enableUILogs = false
    this.config.enableSocketLogs = false
    this.config.enableTopicLogs = false
  }
}

// Export singleton instance
export const logger = new Logger()

// Export for testing
export { Logger }
