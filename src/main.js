import { createApp } from "vue";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import ToastService from "primevue/toastservice";
import "primeicons/primeicons.css";
import VueTheMask from "vue-the-mask";
import store from "./store";
import App from "./App.vue";
import router from "./router";
// Importações de estilos
//import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/dashboard-theme.css";
import vuetify from "./plugins/vuetify";
import { vMaska } from "./directives/maska";
// Importações de scripts
// import "bootstrap";
// import { library } from "@fortawesome/fontawesome-svg-core";
// import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
// import {
//   faEdit,
//   faTrash,
//   faEye,
//   faDollarSign,
//   faList,
// } from "@fortawesome/free-solid-svg-icons";

//library.add(faEdit, faTrash, faEye, faDollarSign, faList);

const app = createApp(App);
app.directive("maska", vMaska);
// app.component("fa-icon", FontAwesomeIcon);
app.use(store);
app.use(router);
app.use(VueTheMask);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: "p",
      cssLayer: false,
    },
  },
});
app.use(ToastService);
app.use(vuetify);

app.mount("#app");
