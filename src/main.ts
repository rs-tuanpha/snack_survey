import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import vueQueryPlugin from './plugins/vue-query'
import storagePlugin from './plugins/storage'
import { logger } from '@/core/utils/logger'
import '@vuepic/vue-datepicker/dist/main.css'
import '@mdi/font/css/materialdesignicons.css'

/**
 * Initialize the Vue application with all plugins and storage hydration
 */
async function initializeApp() {
  try {
    logger.app.info('Initializing Vue application...')

    // Create Vue app
    const app = createApp(App)

    // Create Pinia store
    const pinia = createPinia()
    app.use(pinia)

    // Install plugins
    app.use(router)
    app.use(vuetify)
    app.use(vueQueryPlugin)

    // Install storage plugin with auto-hydration
    app.use(storagePlugin, {
      autoHydrate: true,
      debug: process.env.NODE_ENV === 'development',
      onHydrationComplete: () => {
        logger.app.info('Storage hydration completed - app ready')
      },
      onHydrationError: (error: Error) => {
        logger.app.error('Storage hydration failed:', error)
        // Continue app initialization even if storage hydration fails
      }
    })

    // Mount the app
    app.mount('#app')

    logger.app.info('Vue application initialized successfully')
    return app
  } catch (error) {
    logger.app.error('Failed to initialize Vue application:', error)
    throw error
  }
}

// Initialize the app
initializeApp()
  .then(() => {
    logger.app.info('Application started successfully')
  })
  .catch((error) => {
    logger.app.error('Application failed to start:', error)
  })

export default initializeApp
