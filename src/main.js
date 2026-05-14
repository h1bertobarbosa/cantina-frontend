import { createApp } from 'vue'
import VueTheMask from 'vue-the-mask';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import store from './store';
import App from './App.vue'
import router from './router'
// Importações de estilos
import 'bootstrap/dist/css/bootstrap.min.css';
import 'primeicons/primeicons.css';
import './assets/dashboard-theme.css';

// Importações de scripts
import 'bootstrap';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faEdit, faTrash, faEye, faDollarSign, faList } from '@fortawesome/free-solid-svg-icons'

library.add(faEdit, faTrash, faEye, faDollarSign, faList)

const app = createApp(App)
app.component('fa-icon', FontAwesomeIcon)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false,
      cssLayer: false
    }
  }
})
app.use(store)
app.use(router)
app.use(VueTheMask)
app.mount('#app')
