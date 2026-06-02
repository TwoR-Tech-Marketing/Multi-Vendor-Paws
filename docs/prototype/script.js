const PAGE_META = {
  overview: {
    title: "Scope Overview",
    subtitle: "Phase 3 deliverables for client approval",
  },
  login: { title: "Vendor Login", subtitle: "A · Authentication" },
  register: { title: "Vendor Registration", subtitle: "A · Onboarding" },
  "store-setup": { title: "Store Profile Setup", subtitle: "A · Store identity" },
  "account-status": { title: "Account Status", subtitle: "A · Activation workflow" },
  dashboard: { title: "Vendor Dashboard", subtitle: "Operations overview" },
  products: { title: "Products", subtitle: "B · Vendor catalog" },
  "product-form": { title: "Add / Edit Product", subtitle: "B · Product fields" },
  orders: { title: "Vendor Orders", subtitle: "D · Own orders only" },
  "order-detail": { title: "Order Detail", subtitle: "D · Status updates" },
  earnings: { title: "Earnings & Payouts", subtitle: "F · Financial foundation" },
  "admin-vendors": { title: "Manage Vendors", subtitle: "E · Admin governance" },
  "admin-products": { title: "Products Oversight", subtitle: "E · Centralized visibility" },
  "admin-orders": { title: "Orders Monitoring", subtitle: "E · Cross-vendor orders" },
  "audit-log": { title: "Audit Log", subtitle: "G · Major actions" },
  roles: { title: "Roles & Permissions", subtitle: "G · Access control" },
};

const AUTH_PAGES = new Set(["login", "register"]);
const MOBILE_BREAKPOINT = 900;

let currentScreen = "overview";

function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

function navigateTo(screenId, { updateHash = true } = {}) {
  if (!PAGE_META[screenId]) return;

  currentScreen = screenId;

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const target = document.getElementById(`page-${screenId}`);
  if (target) {
    target.classList.add("active");
  }

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.nav === screenId);
  });

  const meta = PAGE_META[screenId];
  document.getElementById("pageTitle").textContent = meta.title;
  document.getElementById("pageSubtitle").textContent = meta.subtitle;

  const shell = document.getElementById("appShell");
  shell?.classList.toggle("is-auth", AUTH_PAGES.has(screenId));

  if (updateHash) {
    const nextHash = `#/${screenId}`;
    if (location.hash !== nextHash) {
      history.pushState({ screen: screenId }, "", nextHash);
    }
  }

  closeDrawer();
  document.querySelector(".app-content")?.scrollTo({ top: 0, behavior: "smooth" });
}

/** @deprecated use navigateTo — kept for inline color buttons */
function showScreen(screenId) {
  navigateTo(screenId);
}

function openDrawer() {
  if (!isMobileViewport()) return;
  document.body.classList.add("drawer-open");
  document.getElementById("drawerToggle")?.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  document.body.classList.remove("drawer-open");
  document.getElementById("drawerToggle")?.setAttribute("aria-expanded", "false");
}

function toggleDrawer() {
  if (document.body.classList.contains("drawer-open")) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

function setColorTheme(theme) {
  document.documentElement.setAttribute(
    "data-color",
    theme === "purple" ? "purple" : "orange",
  );

  document.getElementById("chipOrange")?.classList.toggle("active", theme === "orange");
  document.getElementById("chipPurple")?.classList.toggle("active", theme === "purple");

  try {
    localStorage.setItem("mvp-prototype-color", theme);
  } catch {
    /* ignore */
  }
}

function getScreenFromHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  return PAGE_META[hash] ? hash : "overview";
}

function handleNavClick(event) {
  const trigger = event.target.closest("[data-nav]");
  if (!trigger) return;

  const screenId = trigger.dataset.nav;
  if (!screenId || !PAGE_META[screenId]) return;

  event.preventDefault();
  navigateTo(screenId);
}

function initNavigation() {
  document.addEventListener("click", handleNavClick);

  document.querySelectorAll(".scope-link, .row-link").forEach((el) => {
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const screenId = el.dataset.nav;
        if (screenId) navigateTo(screenId);
      }
    });
  });

  document.getElementById("loginForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    navigateTo("dashboard");
  });

  document.getElementById("drawerToggle")?.addEventListener("click", toggleDrawer);
  document.getElementById("drawerClose")?.addEventListener("click", closeDrawer);
  document.getElementById("drawerBackdrop")?.addEventListener("click", closeDrawer);

  window.addEventListener("popstate", () => {
    navigateTo(getScreenFromHash(), { updateHash: false });
  });

  window.addEventListener("resize", () => {
    if (!isMobileViewport()) closeDrawer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();

    const order = Object.keys(PAGE_META);
    const index = order.indexOf(currentScreen);
    if (index < 0) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateTo(order[(index + 1) % order.length]);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateTo(order[(index - 1 + order.length) % order.length]);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  let savedColor = "orange";
  try {
    savedColor = localStorage.getItem("mvp-prototype-color") || "orange";
  } catch {
    /* ignore */
  }
  setColorTheme(savedColor);

  initNavigation();

  const initial = getScreenFromHash();
  if (location.hash) {
    navigateTo(initial, { updateHash: false });
  } else {
    navigateTo("overview", { updateHash: true });
  }
});
