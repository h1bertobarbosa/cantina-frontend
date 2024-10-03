import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// Importações de estilos
import 'bootstrap/dist/css/bootstrap.min.css';

// Importações de scripts
import 'jquery';
import 'popper.js';
import 'bootstrap';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faEdit, faTrash, faEye, faDollarSign } from '@fortawesome/free-solid-svg-icons'
library.add(faEdit, faTrash, faEye, faDollarSign)

const app = createApp(App)
app.component('fa-icon', FontAwesomeIcon)
app.use(router)
app.mount('#app')