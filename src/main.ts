import { createApp } from 'vue'
import { VueFire } from 'vuefire'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { firebaseApp } from './plugins/firebase'

const app = createApp(App)
app.use(VueFire, {
    firebaseApp,
})
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(VueFire, {
  firebaseApp
})
app.mount('#app')

export default app
