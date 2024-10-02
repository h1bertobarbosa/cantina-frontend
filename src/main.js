import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// Importações de estilos
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

// Importações de scripts
import 'jquery';
import 'popper.js';
import 'bootstrap';


const app = createApp(App)
app.use(router)
app.mount('#app')