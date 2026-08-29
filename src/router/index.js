import { createWebHistory, createRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";

const auditAllowedEmail = "humberto.obarbosa@gmail.com";

const getTokenUser = () => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return null;
  }

  try {
    return jwtDecode(accessToken);
  } catch (error) {
    localStorage.removeItem("accessToken");
    return null;
  }
};

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
        path: "",
        component: () => import("../components/DashBoard.vue"),
      },
      {
        path: "products",
        component: () => import("../components/Products.vue"),
      },
      {
        path: "clients",
        component: () => import("../components/ClientsPage.vue"),
      },
      {
        path: "sales",
        component: () => import("../components/SalesPage.vue"),
      },
      {
        path: "billings",
        component: () => import("../components/Billings.vue"),
      },
      {
        path: "users",
        component: () => import("../components/UsersPage.vue"),
      },
      {
        path: "audit",
        component: () => import("../components/AuditLogs.vue"),
        meta: { requiresAudit: true },
      },
      {
        path: "/charge-history",
        name: "ChargeHistory",
        component: () => import("../components/ChargeHistory.vue"),
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
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAudit = to.matched.some((record) => record.meta.requiresAudit);
  const user = requiresAuth ? getTokenUser() : null;

  if (requiresAuth && !user) {
    // Se a rota requer autenticação e o usuário não está logado
    next("/signin");
  } else if (requiresAudit && user?.email !== auditAllowedEmail) {
    next("/dashboard");
  } else {
    next();
  }
});

export default router;
