// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from "vuetify/iconsets/mdi";
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#4FC08D', // Vue green
          secondary: '#42A085', // Darker Vue green
          accent: '#66D9A3', // Light Vue green accent
          error: '#F44336',
          warning: '#FF9800',
          info: '#2196F3',
          success: '#4FC08D', // Vue green for success
          surface: '#FAFAFA',
          background: '#FFFFFF',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'on-surface': '#2C3E50',
          'on-background': '#2C3E50',
          'surface-variant': 'rgba(79, 192, 141, 0.1)',
          'outline': 'rgba(79, 192, 141, 0.3)',
          'outline-variant': 'rgba(79, 192, 141, 0.1)',
        }
      }
    }
  },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi
    },
  },
})

export default vuetify
