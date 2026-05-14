<template>
  <div class="dashboard-shell">
    <aside class="dashboard-sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand__badge">
          CN
        </div>
        <div>
          <p class="sidebar-brand__eyebrow">
            Plataforma Cantina
          </p>
          <h1 class="sidebar-brand__title">
            Painel administrativo
          </h1>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in navigationItems"
          :key="item.to"
          class="sidebar-nav__item"
          :class="{ 'sidebar-nav__item--active': isRouteActive(item.to) }"
          type="button"
          @click="navigateTo(item.to)"
        >
          <i
            class="pi"
            :class="item.icon"
          />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-user">
        <Avatar
          :label="userInitials"
          shape="circle"
          class="sidebar-user__avatar"
        />
        <div>
          <p class="sidebar-user__label">
            Conta ativa
          </p>
          <strong>{{ userName }}</strong>
        </div>
      </div>
    </aside>

    <Drawer
      v-model:visible="mobileDrawerVisible"
      position="left"
      class="dashboard-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <div class="sidebar-brand__badge">
            CN
          </div>
          <div>
            <p class="sidebar-brand__eyebrow">
              Plataforma Cantina
            </p>
            <strong class="drawer-header__title">Painel administrativo</strong>
          </div>
        </div>
      </template>

      <nav class="sidebar-nav sidebar-nav--mobile">
        <button
          v-for="item in navigationItems"
          :key="`${item.to}-mobile`"
          class="sidebar-nav__item"
          :class="{ 'sidebar-nav__item--active': isRouteActive(item.to) }"
          type="button"
          @click="navigateTo(item.to)"
        >
          <i
            class="pi"
            :class="item.icon"
          />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </Drawer>

    <main class="dashboard-main">
      <Toolbar class="dashboard-toolbar">
        <template #start>
          <div class="toolbar-context">
            <Button
              icon="pi pi-bars"
              text
              rounded
              class="toolbar-menu-button"
              @click="mobileDrawerVisible = true"
            />

            <div>
              <p class="toolbar-context__eyebrow">
                {{ currentContext.eyebrow }}
              </p>
              <h2 class="toolbar-context__title">
                {{ currentContext.title }}
              </h2>
            </div>
          </div>
        </template>

        <template #end>
          <div class="toolbar-user">
            <div class="toolbar-user__text">
              <span class="toolbar-user__greeting">Ola, {{ userName }}</span>
              <small>{{ currentContext.description }}</small>
            </div>

            <Avatar
              :label="userInitials"
              shape="circle"
              class="toolbar-user__avatar"
            />

            <Button
              label="Sair"
              icon="pi pi-sign-out"
              severity="secondary"
              variant="outlined"
              @click="logout"
            />
          </div>
        </template>
      </Toolbar>

      <div class="dashboard-content">
        <router-view />
      </div>

      <footer class="dashboard-footer">
        <span>©{{ new Date().getFullYear() }} Consolidated Technology</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { jwtDecode } from 'jwt-decode';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import Toolbar from 'primevue/toolbar';

const route = useRoute();
const router = useRouter();

const mobileDrawerVisible = ref(false);

const navigationItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'pi-home' },
  { label: 'Produtos', to: '/dashboard/products', icon: 'pi-box' },
  { label: 'Clientes', to: '/dashboard/clients', icon: 'pi-users' },
  { label: 'Vendas', to: '/dashboard/sales', icon: 'pi-shopping-cart' },
  { label: 'Faturas', to: '/dashboard/billings', icon: 'pi-file' },
  { label: 'Usuarios', to: '/dashboard/users', icon: 'pi-id-card' },
  { label: 'Historico', to: '/charge-history', icon: 'pi-history' },
];

const pageContextMap = [
  {
    match: (path) => path === '/dashboard' || path === '/',
    eyebrow: 'Visao geral',
    title: 'Dashboard',
    description: 'Acompanhe os indicadores centrais da operacao.',
  },
  {
    match: (path) => path.startsWith('/dashboard/clients'),
    eyebrow: 'Relacionamento',
    title: 'Clientes',
    description: 'Gerencie cadastros, busca, edicao e exclusao de clientes.',
  },
  {
    match: (path) => path.startsWith('/dashboard/products'),
    eyebrow: 'Catalogo',
    title: 'Produtos',
    description: 'Organize o catalogo da cantina.',
  },
  {
    match: (path) => path.startsWith('/dashboard/sales'),
    eyebrow: 'Movimento',
    title: 'Vendas',
    description: 'Consulte as vendas registradas.',
  },
  {
    match: (path) => path.startsWith('/dashboard/billings'),
    eyebrow: 'Financeiro',
    title: 'Faturas',
    description: 'Acompanhe cobrancas e recebimentos.',
  },
  {
    match: (path) => path.startsWith('/dashboard/users'),
    eyebrow: 'Acesso',
    title: 'Usuarios',
    description: 'Gerencie usuarios da conta.',
  },
  {
    match: (path) => path.startsWith('/charge-history'),
    eyebrow: 'Auditoria',
    title: 'Historico de lancamentos',
    description: 'Consulte os registros recentes da conta.',
  },
];

const currentContext = computed(() => {
  const currentPath = route.path;
  return pageContextMap.find((item) => item.match(currentPath)) || pageContextMap[0];
});

const getUserName = () => {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    router.push('/signin');
    return 'Usuario';
  }

  try {
    const decodedToken = jwtDecode(accessToken);
    return decodedToken?.name || 'Usuario';
  } catch (error) {
    console.error('Erro ao decodificar o token JWT:', error);
    localStorage.removeItem('accessToken');
    router.push('/signin');
    return 'Usuario';
  }
};

const userName = computed(() => getUserName());
const userInitials = computed(() => (
  userName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
));

const isRouteActive = (targetPath) => {
  if (targetPath === '/dashboard') {
    return route.path === '/dashboard' || route.path === '/';
  }

  return route.path.startsWith(targetPath);
};

const navigateTo = (targetPath) => {
  mobileDrawerVisible.value = false;
  router.push(targetPath);
};

const logout = () => {
  localStorage.removeItem('accessToken');
  router.push('/signin');
};
</script>

<style scoped>
.dashboard-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  background: transparent;
}

.dashboard-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
  height: 100vh;
  padding: 28px 22px;
  background: linear-gradient(180deg, #102a43 0%, #183a66 100%);
  color: #fff;
}

.sidebar-brand {
  display: flex;
  gap: 14px;
  align-items: center;
}

.sidebar-brand__badge,
.toolbar-user__avatar,
.sidebar-user__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-weight: 700;
}

.sidebar-brand__eyebrow,
.toolbar-context__eyebrow,
.sidebar-user__label {
  margin: 0 0 4px;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.72;
}

.sidebar-brand__title,
.drawer-header__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.sidebar-nav {
  display: grid;
  gap: 8px;
}

.sidebar-nav__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.sidebar-nav__item:hover,
.sidebar-nav__item--active {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  transform: translateX(2px);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
}

.dashboard-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 22px;
}

.dashboard-toolbar {
  margin-bottom: 22px;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.toolbar-context,
.toolbar-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-menu-button {
  display: none;
}

.toolbar-context__title {
  margin: 0;
  color: var(--app-text);
  font-size: 1.45rem;
  font-weight: 700;
}

.toolbar-user {
  justify-content: flex-end;
}

.toolbar-user__text {
  display: grid;
  text-align: right;
  color: var(--app-text-muted);
}

.toolbar-user__greeting {
  color: var(--app-text);
  font-weight: 600;
}

.dashboard-content {
  min-width: 0;
  flex: 1;
}

.dashboard-footer {
  display: flex;
  justify-content: flex-end;
  padding: 18px 6px 8px;
  color: var(--app-text-muted);
  font-size: 0.84rem;
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 959px) {
  .dashboard-shell {
    grid-template-columns: 1fr;
  }

  .dashboard-sidebar {
    display: none;
  }

  .dashboard-main {
    padding: 14px;
  }

  .dashboard-toolbar {
    margin-bottom: 16px;
  }

  .toolbar-menu-button {
    display: inline-flex;
  }

  .toolbar-context,
  .toolbar-user {
    width: 100%;
  }

  .toolbar-user {
    gap: 12px;
    flex-wrap: wrap;
  }

  .toolbar-user__text {
    order: 3;
    width: 100%;
    text-align: left;
  }
}
</style>
