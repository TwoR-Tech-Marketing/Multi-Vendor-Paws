export const Routes = {
  home: "/",
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  },
  vendor: {
    dashboard: "/dashboard",
    accountStatus: "/account-status",
    storeSetup: "/store-setup",
    products: "/products",
    orders: "/orders",
    earnings: "/earnings",
  },
} as const;
