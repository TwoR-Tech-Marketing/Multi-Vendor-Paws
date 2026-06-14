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
    productNew: "/products/new",
    productEdit: (productId: string) => `/products/${productId}/edit`,
    productDetail: (productId: string) => `/products/${productId}`,
    orders: "/orders",
    orderDetail: (orderId: string) => `/orders/${orderId}`,
    earnings: "/earnings",
    payouts: "/earnings/payouts",
    settings: "/settings",
    notifications: "/notifications",
  },
} as const;
