<template>
  <div class="dashboard-shell">
    <aside class="dashboard-sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="sidebar-brand">
        <div class="brand-mark">CN</div>
        <div>
          <strong>Cantina NED</strong>
          <p>Painel administrativo</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          @click="closeSidebar"
        >
          <span :class="['sidebar-icon', item.icon]"></span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="closeSidebar"></div>

    <div class="dashboard-main">
      <header class="dashboard-header">
        <div class="header-leading">
          <button class="header-toggle" type="button" @click="toggleSidebar">
            <i class="pi pi-bars"></i>
          </button>
          <div>
            <h1>{{ currentSectionTitle }}</h1>
            <p>Gestão centralizada de operação, clientes e vendas.</p>
          </div>
        </div>

        <div class="header-user">
          <div class="user-copy">
            <span class="user-greeting">Olá, {{ userName }}</span>
            <small>Conta ativa</small>
          </div>
          <div class="user-avatar">{{ userInitials }}</div>
          <button class="logout-button" type="button" @click="logout">
            <i class="pi pi-sign-out"></i>
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
import { jwtDecode } from 'jwt-decode';

export default {
  name: 'DashboardLayout',
  data() {
    return {
      userName: '',
      sidebarOpen: false,
      navigationItems: [
        { label: 'Produtos', to: '/dashboard/products', icon: 'pi pi-box' },
        { label: 'Clientes', to: '/dashboard/clients', icon: 'pi pi-users' },
        { label: 'Vendas', to: '/dashboard/sales', icon: 'pi pi-shopping-cart' },
        { label: 'Faturas', to: '/dashboard/billings', icon: 'pi pi-receipt' },
        { label: 'Usuários', to: '/dashboard/users', icon: 'pi pi-id-card' }
      ]
    };
  },
  computed: {
    currentSectionTitle() {
      const currentItem = this.navigationItems.find((item) =>
        this.$route.path.startsWith(item.to)
      );

      return currentItem ? currentItem.label : 'Dashboard';
    },
    userInitials() {
      return this.userName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((name) => name[0].toUpperCase())
        .join('') || 'U';
    }
  },
  created() {
    this.getUserName();
  },
  watch: {
    $route() {
      this.closeSidebar();
    }
  },
  methods: {
    getUserName() {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        this.$router.push('/signin');
        return;
      }

      try {
        const decodedToken = jwtDecode(accessToken);
        this.userName = decodedToken && decodedToken.name ? decodedToken.name : 'Humberto';
      } catch (error) {
        console.error('Erro ao decodificar o token JWT:', error);
        this.$router.push('/signin');
      }
    },
    logout() {
      localStorage.removeItem('accessToken');
      this.$router.push('/signin');
    },
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    closeSidebar() {
      this.sidebarOpen = false;
    }
  }
};
</script>

<style scoped>
.dashboard-shell {
  display: flex;
  min-height: 100vh;
}

.dashboard-sidebar {
  width: 272px;
  padding: 28px 20px;
  background: linear-gradient(180deg, #0f2038 0%, #132b4d 100%);
  color: #f8fbff;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: #fff;
  box-shadow: 0 18px 28px rgba(59, 130, 246, 0.25);
}

.sidebar-brand p {
  margin: 4px 0 0;
  color: rgba(226, 232, 240, 0.78);
  font-size: 0.92rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  color: rgba(241, 245, 249, 0.88);
  font-weight: 600;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.sidebar-link:hover {
  color: #fff;
  background: var(--app-sidebar-hover);
  transform: translateX(2px);
}

.sidebar-link.router-link-active {
  color: #fff;
  background: var(--app-sidebar-active);
}

.sidebar-icon {
  font-size: 1.1rem;
}

.dashboard-main {
  flex: 1;
  margin-left: 272px;
  min-width: 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 32px 0;
  align-items: center;
}

.header-leading {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-leading h1 {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 700;
}

.header-leading p {
  margin: 6px 0 0;
  color: var(--app-surface-muted);
}

.header-toggle {
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 14px;
  background: rgba(29, 78, 216, 0.1);
  color: var(--app-primary);
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px 10px 18px;
  border: 1px solid rgba(219, 228, 240, 0.9);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.07);
}

.user-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-greeting {
  font-weight: 600;
}

.user-copy small {
  color: var(--app-surface-muted);
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%);
}

.logout-button {
  border: 0;
  background: transparent;
  color: var(--app-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  padding: 10px 12px;
  border-radius: 999px;
}

.logout-button:hover {
  background: rgba(29, 78, 216, 0.08);
}

.dashboard-content {
  padding: 24px 32px 32px;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.46);
  z-index: 20;
}

@media (max-width: 1024px) {
  .dashboard-sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .dashboard-sidebar.is-open {
    transform: translateX(0);
  }

  .dashboard-main {
    margin-left: 0;
  }

  .header-toggle {
    display: inline-flex;
  }
}

@media (max-width: 768px) {
  .dashboard-header,
  .dashboard-content {
    padding-left: 20px;
    padding-right: 20px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-user {
    justify-content: space-between;
    border-radius: 24px;
  }

  .user-copy {
    align-items: flex-start;
  }

  .logout-button span {
    display: none;
  }
}
</style>
