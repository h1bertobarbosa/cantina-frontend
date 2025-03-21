import { createWebHistory, createRouter } from "vue-router";

const routes = [
  {
    path: "/signup",
    component: () => import("../components/SignUp.vue"),
  },
  {
    path: "/signin",
    component: () => import("../components/SignIn.vue"),
  },

  {
    path: "/dashboard",
    component: () => import("../layouts/DashboardLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "/",
        component: () => import("../components/Dashboard.vue"),
      },
      {
        path: "products",
        component: () => import("../components/Products.vue"),
      },
      {
        path: "clients",
        component: () => import("../components/Clients.vue"),
      },
      {
        path: "sales",
        component: () => import("../components/Sales.vue"),
      },
      {
        path: "billings",
        component: () => import("../components/Billings.vue"),
      },
      {
        path: "users",
        component: () => import("../components/Users.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: routes,
  linkActiveClass: "active",
});

router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem("accessToken");

  if (to.matched.some((record) => record.meta.requiresAuth) && !loggedIn) {
    // Se a rota requer autenticação e o usuário não está logado
    next("/signin");
  } else {
    next();
  }
});

export default router;
