<!-- src/layouts/DashboardLayout.vue -->
<template>
  <div>

    <!-- Navbar -->
    <nav class="navbar fixed-top navbar-expand-md navbar-dark bg-primary mb-3">
      <div class="flex-row d-flex">
        <button type="button" class="navbar-toggler mr-2" data-toggle="offcanvas" @click="toggleSidebar"
          title="Toggle responsive left sidebar">
          <span class="navbar-toggler-icon"></span>
        </button>
        <a class="navbar-brand" href="#" title="Admin Template">Admin Template</a>
      </div>
      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#collapsingNavbar">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="navbar-collapse collapse" id="collapsingNavbar">
        <ul class="navbar-nav">
          <li class="nav-item active">
            <router-link class="nav-link" to="/">Home</router-link>
          </li>
        </ul>
        <ul class="navbar-nav ml-auto">
          <li class="nav-item">
            <span class="nav-link">Olá, {{ userName }}</span>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#" @click.prevent="logout">Sair</a>
          </li>
        </ul>
      </div>
    </nav>
    <!-- Sidebar e Conteúdo Principal -->
    <div class="container-fluid" id="main">
      <div class="row row-offcanvas row-offcanvas-left">
        <!-- Sidebar -->
        <div class="col-md-3 col-lg-2 sidebar-offcanvas bg-light pl-0" id="sidebar" role="navigation">
          <ul class="nav flex-column sticky-top pl-0 pt-5 mt-3">
            <li class="nav-item">
              <router-link class="nav-link" to="/dashboard/products">Produtos</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/clientes">Clientes</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/vendas">Vendas</router-link>
            </li>
          </ul>
        </div>
        <!-- Conteúdo Principal -->
        <div class="col main pt-5 mt-3">
          <router-view></router-view>
        </div>
      </div>
    </div>
    <!-- Footer -->
    <footer class="container-fluid">
      <p class="text-right small">©2024 Minha Empresa</p>
    </footer>
  </div>
</template>

<script>
import { jwtDecode } from "jwt-decode";
export default {

  name: 'DashboardLayout',
  data() {
    return {
      userName: ''
    };
  },
  created() {
    this.getUserName();
  },
  methods: {
    getUserName() {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {

        this.$router.push('/signin');
        return;
      }
      try {
        // Decodifica o token JWT para extrair o payload
        const decodedToken = jwtDecode(accessToken);

        // Verifica se o campo 'name' existe no token
        if (decodedToken && decodedToken.name) {
          this.userName = decodedToken.name;
        } else {
          // Se não houver o campo 'name', define um nome padrão
          this.userName = 'Usuário';
        }
      } catch (error) {
        console.error('Erro ao decodificar o token JWT:', error);
        // Em caso de erro, redireciona para a página de login
        this.$router.push('/signin');
      }
    },
    logout() {
      // Remove os dados do usuário e o token
      localStorage.removeItem('accessToken');
      this.$router.push('/signin');
    },
    toggleSidebar() {
      // Alterna a classe que controla a visibilidade do sidebar
      document.getElementById('sidebar').classList.toggle('active');
    }
  }
};
</script>

<style scoped>
/* Estilos personalizados, se necessário */
/* Exemplo de estilo para esconder o sidebar */
#sidebar.active {
  display: none;
}

/* Exemplo de estilos para o sidebar */
@media screen and (max-width: 768px) {
  .row-offcanvas {
    position: relative;
    transition: all 0.25s ease-out;
  }

  .row-offcanvas-left .sidebar-offcanvas {
    left: -33%;
  }

  .row-offcanvas-left.active {
    left: 33%;
    margin-left: -33%;
  }

  .sidebar-offcanvas {
    position: absolute;
    top: 0;
    width: 33%;
  }
}
</style>
