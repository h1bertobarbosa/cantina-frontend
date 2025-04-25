import { createVuetify } from "vuetify";
import "vuetify/styles"; // Importa os estilos base do Vuetify
import "@mdi/font/css/materialdesignicons.css"; // Importa os ícones MDI
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
// Importe componentes e diretivas que você quer registrar globalmente (opcional)
// import * as components from 'vuetify/components'
// import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
  },
  theme: {
    defaultTheme: "light",
  },
});
