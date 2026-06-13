import type { AppStrings } from "@/shared/i18n/types";

export const arStrings: AppStrings = {
  common: {
    loading: "جاري التحميل...",
    signOut: "تسجيل الخروج",
    signingOut: "جاري تسجيل الخروج...",
    cancel: "إلغاء",
    comingSoon: "قريباً",
    comingSoonDescription:
      "نعمل على إعداد هذه الميزة. تفضّل بالعودة قريباً للاطلاع على التحديثات.",
    backToHome: "العودة للرئيسية",
    save: "حفظ التغييرات",
  },
  portal: {
    brandName: "تندر باوز",
    brandTagline: "بوابة البائع",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    openProfile: "فتح الملف الشخصي",
    goBack: "رجوع",
  },
  nav: {
    dashboard: "لوحة التحكم",
    products: "المنتجات",
    orders: "الطلبات",
    earnings: "الأرباح",
    settings: "الإعدادات",
    logOut: "تسجيل الخروج",
    lockedHint: "متاح بعد موافقة الإدارة",
  },
  pages: {
    dashboard: {
      title: "لوحة التحكم",
      subtitle: "نظرة عامة على متجرك",
    },
    profile: {
      title: "الملف الشخصي",
      subtitle: "تفاصيل المتجر وحالة الحساب وطلبات التعديل",
    },
    products: {
      title: "المنتجات",
      subtitle: "الكتالوج والمخزون وحالة المنتجات",
    },
    orders: {
      title: "الطلبات",
      subtitle: "طلبات متجرك فقط",
    },
    earnings: {
      title: "الأرباح",
      subtitle: "المبيعات والعمولة والمدفوعات",
    },
    settings: {
      title: "الإعدادات",
      subtitle: "المظهر وتفضيلات اللغة",
    },
    notifications: {
      title: "الإشعارات",
      subtitle: "الطلبات وتحديثات الحساب وتنبيهات المتجر",
    },
  },
  accountStatus: {
    title: "طلبك",
    activeTitle: "تم تفعيل المتجر",
    activeMessage:
      "حساب البائع نشط. يمكنك إدارة المنتجات والطلبات والأرباح من البوابة.",
    pendingMessage: "طلب البائع قيد مراجعة الإدارة.",
    pendingBannerTitle: "في انتظار تفعيل الإدارة",
    pendingBannerMessage:
      "تم إرسال ملف المتجر. لا يمكنك نشر المنتجات حتى الموافقة.",
    suspendedProductsMessage:
      "لا يمكنك الوصول إلى المنتجات أو الطلبات أو الأرباح أثناء تعليق حسابك.",
    pendingProductsMessage:
      "ستتمكن من الوصول إلى المنتجات والطلبات بعد موافقة الإدارة على طلبك.",
    store: "المتجر",
    email: "البريد الإلكتروني",
    status: "الحالة",
    reason: "السبب",
    accessRestored: "تم استعادة الوصول",
    contactSupport: "تواصل مع الدعم",
    suspended: "معلق",
    pending: "قيد الانتظار",
    active: "نشط",
  },
  profile: {
    currentProfileTitle: "الملف الحالي",
    requestChangesTitle: "طلب تعديل بيانات المتجر",
    requestChangesHint:
      "تتم مراجعة التحديثات من فريق إدارة تندر باوز قبل نشرها.",
    signInEmailNote: "لا يمكن تغيير بريد تسجيل الدخول هنا. تواصل مع الدعم عند الحاجة.",
    uploadLogo: "انقر لرفع شعار جديد",
    noLogo: "لا يوجد شعار",
    submitChangeRequest: "إرسال طلب التعديل",
    submittingChangeRequest: "جاري الإرسال...",
    changeRequestSuccess:
      "تم إرسال طلب التعديل. ستقوم الإدارة بمراجعة معلومات متجرك المحدثة.",
    changeRequestError: "تعذر إرسال طلب التعديل. يرجى المحاولة مرة أخرى.",
    pendingChangeExists:
      "لديك طلب تعديل قيد الانتظار. انتظر مراجعة الإدارة قبل إرسال طلب آخر.",
    pendingChangeBanner:
      "طلب تعديل الملف قيد مراجعة الإدارة. سيتم إشعارك عند معالجته.",
    fields: {
      ownerName: "الاسم الكامل للمالك",
      signInEmail: "بريد تسجيل الدخول",
      phone: "رقم الجوال",
      storeName: "اسم المتجر",
      storeDescription: "وصف المتجر",
      contactPhone: "هاتف التواصل",
      contactEmail: "بريد التواصل للمتجر",
      contactAddress: "عنوان العمل",
      logo: "شعار المتجر",
      updatedAt: "آخر تحديث",
    },
    validation: {
      ownerName: "اسم المالك مطلوب.",
      phone: "رقم الجوال مطلوب.",
      storeName: "اسم المتجر مطلوب.",
      storeDescription: "وصف المتجر مطلوب.",
      contactPhone: "هاتف التواصل مطلوب.",
      contactEmail: "بريد التواصل للمتجر مطلوب.",
      contactAddress: "عنوان العمل مطلوب.",
    },
  },
  signOut: {
    confirmTitle: "تسجيل الخروج؟",
    confirmMessage:
      "سيتم تسجيل خروجك من الجلسة الحالية. قد تفقد أي تغييرات غير محفوظة.",
    confirmAction: "نعم، تسجيل الخروج",
  },
  session: {
    title: "الجلسة النشطة",
    device: "الجهاز",
    signedIn: "وقت تسجيل الدخول",
    lastLogin: "آخر تسجيل دخول",
    accountCreated: "تاريخ إنشاء الحساب",
    location: "الموقع",
  },
  notifications: {
    open: "فتح الإشعارات",
    unreadSummaryZero: "لا توجد إشعارات غير مقروءة",
    unreadSummaryOne: "لديك إشعار واحد غير مقروء",
    unreadSummaryMany: "لديك {count} إشعارات غير مقروءة",
    markAllAsRead: "تعليم الكل كمقروء",
    markAllBusy: "يرجى الانتظار…",
    tabAll: "الكل",
    tabUnread: "غير مقروء",
    emptyAllTitle: "لا توجد إشعارات",
    emptyUnreadTitle: "لا توجد إشعارات غير مقروءة",
    emptySubtitle: "لقد اطلعت على كل شيء.",
    loading: "جاري تحميل الإشعارات…",
  },
  settings: {
    appearanceTitle: "المظهر",
    themeLabel: "السمة",
    themeLight: "فاتح",
    themeDark: "داكن",
    languageTitle: "اللغة",
    languageLabel: "لغة العرض",
    languageEnglish: "English",
    languageArabic: "العربية",
    savedHint: "يتم حفظ التفضيلات على هذا الجهاز.",
  },
  errors: {
    generic: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
};
