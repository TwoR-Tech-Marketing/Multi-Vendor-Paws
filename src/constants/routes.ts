export const Routes = {
  home: "/",
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  },
  vendor: {
    dashboard: "/dashboard",
    profile: "/profile",
    products: "/products",
    orders: "/orders",
    earnings: "/earnings",
  },
} as const;
