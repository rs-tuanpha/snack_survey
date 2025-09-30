/**
 * Enhanced Common Hook
 * Provides store operations, router utilities, and storage helpers
 * Attentive: only use hook in file *.vue
 */

import { storeToRefs } from 'pinia'
import * as store from '@/stores'
import { useRoute, type RouteLocationNormalized, useRouter, type RouteParams, type LocationQuery } from 'vue-router'
import { logger } from '@/core/utils/logger'

const useCommon = (initStoreName: string) => {
  /**
   * Start handle Common hook store
   * @param storeName
   * @returns
   */
  const getStore = (storeName?: string) => {
    const { [storeName ? storeName : initStoreName]: pinia } = store as Record<string, Function>

    return pinia
  }

  // Get store
  const storeGetters = (storeName?: string) => {
    const store = getStore(storeName)
    const storeData = storeToRefs(store())

    return { ...storeData }
  }

  // Store dispatch an action
  const storeDispatch = (fucDispatch: string, payload?: any, storeName?: string) => {
    const useStore = getStore(storeName)
    const { [fucDispatch]: action } = useStore()

    action(payload)
  }

  /**
   * Common router
   */
  const route = useRoute()
  const router = useRouter()

  const getRouter = (key: keyof RouteLocationNormalized) => {
    return route[key]
  }

  const getQuery = () => {
    return getRouter('query') as LocationQuery
  }

  const getParams = () => {
    return getRouter('params') as RouteParams
  }

  const handleRouter = {
    // settingConfig: {query, param}
    pushPath: (path: string, settingConfig: object = {}, openNewTab = false) => {
      const config = {
        ...{ path },
        ...settingConfig
      }

      if (!openNewTab) {
        router.push({ ...config })
      } else {
        const newRoute = router.resolve(config)
        window.open(newRoute.href)
      }
    },
    replacePath: (path: string, settingConfig: object = {}) => {
      const config = {
        ...{ path },
        ...settingConfig
      }

      router.replace({ ...config })
    },
    pushName: (nameRouter: string, settingConfig: object, openNewTab = false) => {
      const config = {
        ...{ name: nameRouter },
        ...settingConfig
      }

      if (!openNewTab) {
        router.push({ ...config })
      } else {
        const newRoute = router.resolve(config)
        window.open(newRoute.href)
      }
    }
  }

  /**
   * Storage utilities
   */
  const storage = {
    // LocalStorage helpers
    getLocalStorage: <T>(key: string, defaultValue: T): T => {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
      } catch (error) {
        logger.storage.error(`Failed to get localStorage key ${key}:`, error)
        return defaultValue
      }
    },

    setLocalStorage: <T>(key: string, value: T): void => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        logger.storage.debug(`Set localStorage key: ${key}`, value)
      } catch (error) {
        logger.storage.error(`Failed to set localStorage key ${key}:`, error)
      }
    },

    removeLocalStorage: (key: string): void => {
      try {
        localStorage.removeItem(key)
        logger.storage.debug(`Removed localStorage key: ${key}`)
      } catch (error) {
        logger.storage.error(`Failed to remove localStorage key ${key}:`, error)
      }
    },

    // SessionStorage helpers
    getSessionStorage: <T>(key: string, defaultValue: T): T => {
      try {
        const item = sessionStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
      } catch (error) {
        logger.storage.error(`Failed to get sessionStorage key ${key}:`, error)
        return defaultValue
      }
    },

    setSessionStorage: <T>(key: string, value: T): void => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value))
        logger.storage.debug(`Set sessionStorage key: ${key}`, value)
      } catch (error) {
        logger.storage.error(`Failed to set sessionStorage key ${key}:`, error)
      }
    },

    removeSessionStorage: (key: string): void => {
      try {
        sessionStorage.removeItem(key)
        logger.storage.debug(`Removed sessionStorage key: ${key}`)
      } catch (error) {
        logger.storage.error(`Failed to remove sessionStorage key ${key}:`, error)
      }
    }
  }

  return {
    // Store
    storeGetters,
    storeDispatch,

    // Router
    getRouter,
    getQuery,
    getParams,
    handleRouter,

    // Storage
    storage
  }
}

export default useCommon
