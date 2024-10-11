import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueTheMask from 'vue-the-mask';
// Importações de estilos
import 'bootstrap/dist/css/bootstrap.min.css';

// Importações de scripts
import 'bootstrap';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faEdit, faTrash, faEye, faDollarSign, faList } from '@fortawesome/free-solid-svg-icons'

library.add(faEdit, faTrash, faEye, faDollarSign, faList)

const app = createApp(App)
app.component('fa-icon', FontAwesomeIcon)
app.use(router)
app.use(VueTheMask)
app.mount('#app')