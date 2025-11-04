/**
 * Vue Query (TanStack Query) configuration for Vue 3
 * This plugin sets up the query client and provides it to the Vue app
 */
import { VueQueryPlugin, QueryClient, type VueQueryPluginOptions } from '@tanstack/vue-query'
import type { App } from 'vue'

// Create a query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query defaults
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Disable refetch on window focus by default
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      // Global mutation defaults
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry once for server errors
        return failureCount < 1
      },
      retryDelay: 1000,
    },
  },
})

// Vue Query plugin options
const vueQueryOptions: VueQueryPluginOptions = {
  queryClient,
  enableDevtoolsV6Plugin: true, // Enable Vue devtools integration
}

// Plugin installation function
export function installVueQuery(app: App) {
  app.use(VueQueryPlugin, vueQueryOptions)
}

// Export the query client for direct access if needed
export { queryClient }

// Export default for easy importing
export default {
  install: installVueQuery,
  queryClient,
}
