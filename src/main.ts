import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import vueQueryPlugin from './plugins/vue-query'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import '@vuepic/vue-datepicker/dist/main.css'
import '@mdi/font/css/materialdesignicons.css'

/**
 * Initialize the Vue application with synchronous hydration
 */
function initializeApp() {
  try {
    // Create Vue app
    const app = createApp(App)

    // Create Pinia store
    const pinia = createPinia()
    app.use(pinia)

    // Hydrate auth store from cookies BEFORE router initialization
    const authStore = useAuthStore()
    authStore.initializeFromStorage()

    // Hydrate user store from authStore
    const userStore = useUserStore()
    userStore.initializeFromStorage()

    // Install plugins
    app.use(router)
    app.use(vuetify)
    app.use(vueQueryPlugin)

    // Mount the app
    app.mount('#app')

    return app
  } catch (error) {
    console.error('Failed to initialize Vue application:', error)
    throw error
  }
}

// Initialize the app
initializeApp()

export default initializeApp
