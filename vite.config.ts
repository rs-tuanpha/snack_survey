import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import basicSsl from '@vitejs/plugin-basic-ssl'
import dotenv from 'dotenv'
dotenv.config()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), basicSsl()],
  server: {
    host: true,
    https: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    'process.env': {
      VUE_APP_API_KEY: process.env.VUE_APP_API_KEY,
      VUE_APP_AUTH_DOMAIN: process.env.VUE_APP_AUTH_DOMAIN,
      VUE_APP_PROJECT_ID: process.env.VUE_APP_PROJECT_ID,
      VUE_APP_STORAGE_BUCKET: process.env.VUE_APP_STORAGE_BUCKET,
      VUE_APP_MESSAGING_SENDER_ID: process.env.VUE_APP_MESSAGING_SENDER_ID,
      VUE_APP_APP_ID: process.env.VUE_APP_APP_ID,
      VUE_APP_MEASURE_MEMBER_ID: process.env.VUE_APP_MEASURE_MEMBER_ID
    }
  },
  base: '/snack_survey/'
})
