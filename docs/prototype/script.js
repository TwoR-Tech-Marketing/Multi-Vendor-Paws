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
/** Pages without the portal app side menu */
const NO_PORTAL_NAV = new Set(["overview", "login", "register"]);
const ADMIN_PAGES = new Set([
  "admin-vendors",
  "admin-products",
  "admin-orders",
  "audit-log",
  "roles",
]);

const MOBILE_MAX_WIDTH = 767;

let currentScreen = "overview";

function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
}

function updatePortalChrome(screenId) {
  const layout = document.getElementById("portalLayout");
  const showNav = !NO_PORTAL_NAV.has(screenId);
  layout?.classList.toggle("portal-layout--with-nav", showNav);
  layout?.classList.toggle("portal-layout--no-nav", !showNav);

  document.querySelectorAll(".portal-nav-item").forEach((item) => {
    const navId = item.dataset.nav;
    const isActive =
      navId === screenId ||
      (screenId === "product-form" && navId === "products") ||
      (screenId === "order-detail" && navId === "orders");
    item.classList.toggle("active", isActive);
  });

  const roleLabel = document.getElementById("portalRoleLabel");
  if (roleLabel) {
    roleLabel.textContent = ADMIN_PAGES.has(screenId) ? "Admin Portal" : "Vendor Portal";
  }

  const select = document.getElementById("protoScreenSelect");
  if (select && select.value !== screenId) {
    select.value = screenId;
  }
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

  const meta = PAGE_META[screenId];
  document.getElementById("pageTitle").textContent = meta.title;
  document.getElementById("pageSubtitle").textContent = meta.subtitle;

  document.getElementById("appShell")?.classList.toggle("is-auth", AUTH_PAGES.has(screenId));

  updatePortalChrome(screenId);

  if (updateHash) {
    const nextHash = `#/${screenId}`;
    if (location.hash !== nextHash) {
      history.pushState({ screen: screenId }, "", nextHash);
    }
  }

  closePortalDrawer();
  document.querySelector(".app-content")?.scrollTo({ top: 0, behavior: "smooth" });
}

function showScreen(screenId) {
  navigateTo(screenId);
}

function openPortalDrawer() {
  if (!isMobileViewport()) return;
  if (!document.getElementById("portalLayout")?.classList.contains("portal-layout--with-nav")) {
    return;
  }
  document.body.classList.add("portal-drawer-open");
  document.getElementById("portalMenuBtn")?.setAttribute("aria-expanded", "true");
}

function closePortalDrawer() {
  document.body.classList.remove("portal-drawer-open");
  document.getElementById("portalMenuBtn")?.setAttribute("aria-expanded", "false");
}

function togglePortalDrawer() {
  if (document.body.classList.contains("portal-drawer-open")) {
    closePortalDrawer();
  } else {
    openPortalDrawer();
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

function buildProtoScreenSelect() {
  const select = document.getElementById("protoScreenSelect");
  if (!select) return;

  select.innerHTML = "";
  Object.entries(PAGE_META).forEach(([id, meta]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = meta.title;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    navigateTo(select.value);
  });
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

  document.getElementById("portalMenuBtn")?.addEventListener("click", togglePortalDrawer);
  document.getElementById("portalDrawerClose")?.addEventListener("click", closePortalDrawer);
  document.getElementById("portalBackdrop")?.addEventListener("click", closePortalDrawer);

  window.addEventListener("popstate", () => {
    navigateTo(getScreenFromHash(), { updateHash: false });
  });

  window.addEventListener("resize", () => {
    if (!isMobileViewport()) closePortalDrawer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePortalDrawer();

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
  buildProtoScreenSelect();
  initNavigation();

  const initial = getScreenFromHash();
  if (location.hash) {
    navigateTo(initial, { updateHash: false });
  } else {
    navigateTo("overview", { updateHash: true });
  }
});
