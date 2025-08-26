import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import vueQueryPlugin from './plugins/vue-query'
import '@vuepic/vue-datepicker/dist/main.css'
import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(vueQueryPlugin)
app.mount('#app')

export default app
