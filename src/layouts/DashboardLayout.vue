<template>
  <v-app>
    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer
      v-model="drawer"
      app
      color="grey-lighten-4"
      :permanent="$vuetify.display.mdAndUp"
      :temporary="$vuetify.display.smAndDown"
    >
      <v-list density="compact" nav>
        <!-- Itens de Navegação -->
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Home"
          value="home"
          to="/"
          exact
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-subheader>Gerenciar</v-list-subheader>
        <v-list-item
          prepend-icon="mdi-package-variant-closed"
          title="Produtos"
          value="products"
          to="/dashboard/products"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-group"
          title="Clientes"
          value="clients"
          to="/dashboard/clients"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-cart"
          title="Vendas"
          value="sales"
          to="/dashboard/sales"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-file-document"
          title="Faturas"
          value="billings"
          to="/dashboard/billings"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-cog"
          title="Usuários"
          value="users"
          to="/dashboard/users"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- App Bar (Navbar) -->
    <v-app-bar app color="primary" dark density="compact">
      <!-- Ícone para Toggler o Drawer em Telas Menores -->
      <v-app-bar-nav-icon
        @click="drawer = !drawer"
        class="d-md-none"
      ></v-app-bar-nav-icon>

      <v-app-bar-title>Admin</v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- Informações do Usuário e Logout -->
      <span class="mr-3 d-none d-sm-inline">Olá, {{ userName }}</span>
      <v-btn icon @click="logout">
        <v-tooltip activator="parent" location="bottom">Sair</v-tooltip>
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Conteúdo Principal -->
    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app class="pa-2" style="height: auto;">
      <v-spacer></v-spacer>
      <span class="text-caption">©{{ new Date().getFullYear() }} Consolidated Technology</span>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { jwtDecode } from "jwt-decode";
import { useDisplay } from 'vuetify'; // Importar useDisplay

// Acesso ao router
const router = useRouter();

// Controle do estado do navigation drawer (sidebar)
const drawer = ref(true); // Começa aberto por padrão em desktop

// Nome do usuário
const userName = ref('Usuário');

// Acesso às propriedades de display do Vuetify
const { mdAndUp } = useDisplay();

// Função para obter o nome do usuário do token JWT
const getUserName = () => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    router.push('/signin');
    return;
  }
  try {
    const decodedToken = jwtDecode(accessToken);
    // Verifica se o token decodificado e o campo 'name' existem
    if (decodedToken && decodedToken.name) {
      userName.value = decodedToken.name;
    } else {
      console.warn("Token JWT decodificado não contém o campo 'name'. Usando nome padrão.");
      userName.value = 'Usuário'; // Mantém o padrão se 'name' não existir
    }
  } catch (error) {
    console.error('Erro ao decodificar o token JWT:', error);
    localStorage.removeItem('accessToken'); // Limpa token inválido
    router.push('/signin');
  }
};

// Função de logout
const logout = () => {
  localStorage.removeItem('accessToken');
  router.push('/signin');
};

// Executa ao montar o componente
onMounted(() => {
  getUserName();
  // Ajusta o estado inicial do drawer com base no tamanho da tela
  // Se for menor que 'md', começa fechado.
  if (!mdAndUp.value) {
    drawer.value = false;
  }
});

</script>

<style scoped>
/* Estilos específicos do componente, se necessário. Vuetify cuida da maioria. */
.v-list-item--active {
    /* background-color: rgba(var(--v-theme-primary), 0.1); /* Exemplo de destaque */
    color: rgb(var(--v-theme-primary));
}
.v-list-item__prepend > .v-icon {
    margin-inline-end: 16px; /* Ajuste do espaçamento do ícone padrão do Vuetify 3 */
}

/* Ajuste fino para espaçamento no footer */
.v-footer {
  font-size: 0.8rem;
}
</style>