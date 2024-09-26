import { createWebHistory, createRouter } from "vue-router";
import SignUp from '../components/SignUp.vue';
import SignIn from '../components/SignIn.vue';
import DashBoard from '../components/Dashboard.vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import Products from '../components/Products.vue';

const routes = [
  {
    path: '/signup',
    component: SignUp
  },
  {
    path: '/signin',
    component: SignIn
  },

  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '/',
        component: DashBoard
      },
      {
        path: 'products',
        component: Products
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: routes,
  linkActiveClass: 'active'
})

router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('accessToken');

  if (to.matched.some(record => record.meta.requiresAuth) && !loggedIn) {
    // Se a rota requer autenticação e o usuário não está logado
    next('/signin');
  } else {
    next();
  }
});

export default router;