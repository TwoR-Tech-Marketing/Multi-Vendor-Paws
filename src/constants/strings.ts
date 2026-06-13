export const Strings = {
  common: {
    loading: "Loading...",
    signOut: "Sign out",
    signingOut: "Signing out...",
    comingSoon: "Coming soon",
    comingSoonDescription:
      "This section is being built. It will be available once vendor data and backend integrations are ready.",
    backToHome: "Back to home",
    cancel: "Cancel",
    save: "Save changes",
  },
  portal: {
    brandName: "Tender Paws",
    brandTagline: "Vendor Portal",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  nav: {
    dashboard: "Dashboard",
    accountStatus: "Account Status",
    storeSetup: "Store Profile",
    products: "Products",
    orders: "Orders",
    earnings: "Earnings",
    lockedHint: "Available after admin approval",
  },
  pages: {
    dashboard: {
      title: "Dashboard",
      subtitle: "Your store overview",
    },
    accountStatus: {
      title: "Account Status",
      subtitle: "Application and activation status",
    },
    storeSetup: {
      title: "Store Profile",
      subtitle: "Name, logo, description, and contacts",
    },
    products: {
      title: "Products",
      subtitle: "Catalog, stock, and product status",
    },
    orders: {
      title: "Orders",
      subtitle: "Your store orders only",
    },
    earnings: {
      title: "Earnings",
      subtitle: "Sales, commission, and payouts",
    },
  },
  accountStatus: {
    title: "Account status",
    pendingMessage: "Your vendor application is pending admin review.",
    suspendedProductsMessage:
      "You cannot access products, orders, or earnings while your account is suspended.",
    pendingProductsMessage:
      "You will be able to access products and orders once an admin approves your application in the Tender Paws admin panel.",
    store: "Store",
    email: "Email",
    status: "Status",
    reason: "Reason",
    accessRestored: "Access restored",
    contactSupport: "Contact support",
    suspended: "suspended",
    pending: "pending",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
  },
} as const;
