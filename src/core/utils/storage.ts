import jsCookie from 'js-cookie'

/**
 * Handle get/set/remove Session
 */
export const Session = {
  get: <T = any>(key: string, fallbackValue = {}): T => {
    if (typeof sessionStorage === 'undefined') {
      return fallbackValue as T
    }
    const data = sessionStorage.getItem(key)

    try {
      return (JSON.parse(data as string) || fallbackValue) as T
    } catch (error) {
      return (data || fallbackValue) as T
    }
  },
  set: (key: string, value?: string | object) => {
    sessionStorage.setItem(key, JSON.stringify(value))
  },
  remove: (key: string) => {
    sessionStorage.removeItem(key)
  }
}

/**
 * Handle get/set/remove LocalStorage
 */
export const LocalStorage = {
  get: <T = any>(key: string, fallbackValue = {}): T => {
    if (typeof localStorage === 'undefined') {
      return fallbackValue as T
    }
    const data = localStorage.getItem(key)
    try {
      return (JSON.parse(data as string) ?? fallbackValue) as T
    } catch (e) {
      return (data || fallbackValue) as T
    }
  },
  set: (key: string, value?: string | object) => {
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove: (key: string) => {
    localStorage.removeItem(key)
  }
}

/**
 * Handle Cookie (use lib js-cookie)
 * Refer check detail: https://www.npmjs.com/package/js-cookie
 */
export const Cookies = jsCookie.withAttributes({ secure: true })

/** clear all account setting when login */
export const clearAccountData = () => {
  LocalStorage.remove('account_info')
  LocalStorage.remove('account_avatar')
  LocalStorage.remove('account_username')
  LocalStorage.remove('account_team')
}
