export const Strings = {
  common: {
    loading: "Loading...",
    signOut: "Sign out",
    signingOut: "Signing out...",
    cancel: "Cancel",
    comingSoon: "Coming soon",
    comingSoonDescription:
      "This section is being built. It will be available once vendor data and backend integrations are ready.",
    backToHome: "Back to home",
    save: "Save changes",
  },
  portal: {
    brandName: "Tender Paws",
    brandTagline: "Vendor Portal",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    openProfile: "Open profile",
    goBack: "Go back",
  },
  nav: {
    dashboard: "Dashboard",
    products: "Products",
    orders: "Orders",
    earnings: "Earnings",
    settings: "Settings",
    logOut: "Log out",
    lockedHint: "Available after admin approval",
  },
  pages: {
    dashboard: {
      title: "Dashboard",
      subtitle: "Your store overview",
    },
    profile: {
      title: "Profile",
      subtitle: "Store details, account status, and change requests",
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
    settings: {
      title: "Settings",
      subtitle: "Appearance and language preferences",
    },
    notifications: {
      title: "Notifications",
      subtitle: "Orders, account updates, and store alerts",
    },
  },
  accountStatus: {
    title: "Your application",
    activeTitle: "Store activated",
    activeMessage:
      "Your vendor account is active. You can manage products, orders, and earnings from the portal.",
    pendingMessage: "Your vendor application is pending admin review.",
    pendingBannerTitle: "Pending admin activation",
    pendingBannerMessage:
      "Your store profile was submitted. You cannot publish products until approved.",
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
    active: "active",
  },
  profile: {
    currentProfileTitle: "Current profile",
    requestChangesTitle: "Request store info changes",
    requestChangesHint:
      "Updates are reviewed by the Tender Paws admin team before they go live.",
    signInEmailNote: "Sign-in email cannot be changed here. Contact support if needed.",
    uploadLogo: "Click to upload a new logo",
    noLogo: "No logo",
    submitChangeRequest: "Submit change request",
    submittingChangeRequest: "Submitting...",
    changeRequestSuccess:
      "Change request submitted. An admin will review your updated store information.",
    changeRequestError: "Could not submit your change request. Please try again.",
    pendingChangeExists:
      "You already have a pending change request. Wait for admin review before submitting another.",
    pendingChangeBanner:
      "A profile change request is pending admin review. You will be notified once it is processed.",
    fields: {
      ownerName: "Owner full name",
      signInEmail: "Sign-in email",
      phone: "Mobile phone",
      storeName: "Store name",
      storeDescription: "Store description",
      contactPhone: "Contact phone",
      contactEmail: "Store contact email",
      contactAddress: "Business address",
      logo: "Store logo",
      updatedAt: "Last updated",
    },
    validation: {
      ownerName: "Owner name is required.",
      phone: "Mobile phone is required.",
      storeName: "Store name is required.",
      storeDescription: "Store description is required.",
      contactPhone: "Contact phone is required.",
      contactEmail: "Store contact email is required.",
      contactAddress: "Business address is required.",
    },
  },
  signOut: {
    confirmTitle: "Sign out?",
    confirmMessage:
      "You'll be signed out of your current session. Any unsaved changes may be lost.",
    confirmAction: "Yes, sign out",
  },
  session: {
    title: "Active session",
    device: "Device",
    signedIn: "Signed in",
    lastLogin: "Last login",
    accountCreated: "Account created",
    location: "Location",
  },
  notifications: {
    open: "Open notifications",
    unreadSummaryZero: "You have no unread notifications",
    unreadSummaryOne: "You have 1 unread notification",
    unreadSummaryMany: "You have {count} unread notifications",
    markAllAsRead: "Mark all as read",
    markAllBusy: "Please wait…",
    tabAll: "All",
    tabUnread: "Unread",
    emptyAllTitle: "No notifications",
    emptyUnreadTitle: "No unread notifications",
    emptySubtitle: "You're all caught up.",
    loading: "Loading notifications…",
  },
  settings: {
    appearanceTitle: "Appearance",
    themeLabel: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    languageTitle: "Language",
    languageLabel: "Display language",
    languageEnglish: "English",
    languageArabic: "Arabic",
    savedHint: "Preferences are saved on this device.",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
  },
} as const;
