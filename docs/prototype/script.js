const PAGE_META = {
  landing: { title: "Vendor Portal", subtitle: "Sell on Tender Paws" },
  login: { title: "Sign in", subtitle: "A · Vendor authentication" },
  register: { title: "Create account", subtitle: "A · Vendor registration" },
  "forgot-password": { title: "Reset password", subtitle: "A · Account recovery" },
  "account-status": { title: "Account Status", subtitle: "A · Activation workflow" },
  dashboard: { title: "Dashboard", subtitle: "Your store overview" },
  "store-setup": { title: "Store Profile", subtitle: "A · Store identity" },
  products: { title: "Products", subtitle: "B · Vendor catalog" },
  "product-form": { title: "Add / Edit Product", subtitle: "B · Product fields" },
  orders: { title: "Orders", subtitle: "D · Your orders only" },
  "order-detail": { title: "Order Detail", subtitle: "D · Status updates" },
  earnings: { title: "Earnings", subtitle: "F · Financial foundation" },
};

const PUBLIC_SCREENS = new Set(["landing", "login", "register", "forgot-password"]);
const AUTH_LAYOUT_SCREENS = new Set(["login", "register", "forgot-password"]);

const MOBILE_MAX_WIDTH = 767;
let currentScreen = "landing";
let registerStep = 1;
let registerLogoDataUrl = null;

function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function showAuthError(elId, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.classList.remove("hidden");
  } else {
    el.textContent = "";
    el.classList.add("hidden");
  }
}

function updateUserChrome() {
  const vendor = VendorAuth.getSessionVendor();
  const avatar = document.getElementById("userAvatar");
  const name = document.getElementById("userName");
  const email = document.getElementById("userEmail");

  if (vendor) {
    avatar.textContent = VendorAuth.getInitials(vendor.ownerName);
    name.textContent = vendor.storeName || vendor.ownerName;
    email.textContent = vendor.email;
  }
}

function renderReviewGrid(container, vendor) {
  if (!container || !vendor) return;
  container.innerHTML = `
    <div class="review-row"><span>Owner</span><strong>${vendor.ownerName}</strong></div>
    <div class="review-row"><span>Email</span><strong>${vendor.email}</strong></div>
    <div class="review-row"><span>Phone</span><strong>${vendor.phone}</strong></div>
    <div class="review-row"><span>Store</span><strong>${vendor.storeName}</strong></div>
    <div class="review-row"><span>Description</span><strong>${vendor.storeDescription}</strong></div>
    <div class="review-row"><span>Contact phone</span><strong>${vendor.contactPhone}</strong></div>
    <div class="review-row"><span>Contact email</span><strong>${vendor.contactEmail}</strong></div>
    <div class="review-row"><span>Address</span><strong>${vendor.contactAddress}</strong></div>
    <div class="review-row"><span>Status</span><strong class="status-label status-${vendor.status}">${vendor.status}</strong></div>
  `;
}

function populateAccountStatusPage() {
  const vendor = VendorAuth.getSessionVendor();
  if (!vendor) return;

  renderReviewGrid(document.getElementById("accountStatusReview"), vendor);
  document.getElementById("timelineSubmitted").textContent = formatDate(vendor.createdAt);

  const banner = document.getElementById("accountStatusBanner");
  const icon = document.getElementById("accountStatusIcon");
  const title = document.getElementById("accountStatusTitle");
  const message = document.getElementById("accountStatusMessage");

  banner.className = "status-banner";
  if (vendor.status === "active") {
    banner.classList.add("active");
    icon.textContent = "check_circle";
    title.textContent = "Store active";
    message.textContent = "Your store is approved. You can manage products and fulfill orders.";
    document.getElementById("timelineReview")?.classList.replace("active", "done");
    document.getElementById("timelineActive")?.classList.add("done");
    document.querySelector("#timelineActive small").textContent = "Approved";
  } else if (vendor.status === "suspended") {
    banner.classList.add("suspended");
    icon.textContent = "block";
    title.textContent = "Account suspended";
    message.textContent = "Contact Tender Paws support. Your store is temporarily unavailable.";
  } else {
    banner.classList.add("pending");
    icon.textContent = "hourglass_top";
    title.textContent = "Pending admin activation";
    message.textContent = "Your application is under review. You cannot publish products until approved.";
  }
}

function populateStoreSetupPage() {
  const vendor = VendorAuth.getSessionVendor();
  if (!vendor) return;

  document.getElementById("storeNameInput").value = vendor.storeName;
  document.getElementById("storeDescInput").value = vendor.storeDescription;
  document.getElementById("storePhoneInput").value = vendor.contactPhone;
  document.getElementById("storeEmailInput").value = vendor.contactEmail;
  document.getElementById("storeAddressInput").value = vendor.contactAddress;
  document.getElementById("storePreviewName").textContent = vendor.storeName;
  document.getElementById("storePreviewDesc").textContent = vendor.storeDescription;
}

function postNavigate(screenId) {
  updateUserChrome();

  if (screenId === "account-status") populateAccountStatusPage();
  if (screenId === "store-setup") populateStoreSetupPage();
  if (screenId === "register") setRegisterStep(1);
}

function resolvePostLoginRoute(vendor) {
  if (vendor.status === "pending") return "account-status";
  if (vendor.status === "suspended") return "account-status";
  return "dashboard";
}

function guardNavigation(screenId) {
  const vendor = VendorAuth.getSessionVendor();
  const isProtected = VendorAuth.isProtectedScreen(screenId);

  if (isProtected && !vendor) {
    return "login";
  }

  if (vendor && PUBLIC_SCREENS.has(screenId) && screenId !== "landing") {
    return resolvePostLoginRoute(vendor);
  }

  if (vendor?.status === "pending" && ["products", "product-form", "orders", "order-detail", "earnings"].includes(screenId)) {
    return "account-status";
  }

  if (vendor?.status === "suspended" && isProtected && screenId !== "account-status") {
    return "account-status";
  }

  return screenId;
}

function updatePortalChrome(screenId) {
  const layout = document.getElementById("portalLayout");
  const vendor = VendorAuth.getSessionVendor();
  const showNav = Boolean(vendor) && !AUTH_LAYOUT_SCREENS.has(screenId) && screenId !== "landing";

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

  const select = document.getElementById("protoScreenSelect");
  if (select && select.value !== screenId) select.value = screenId;
}

function navigateTo(screenId, { updateHash = true, skipGuard = false } = {}) {
  if (!PAGE_META[screenId]) return;

  const targetScreen = skipGuard ? screenId : guardNavigation(screenId);
  if (!PAGE_META[targetScreen]) return;

  currentScreen = targetScreen;

  document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
  document.getElementById(`page-${targetScreen}`)?.classList.add("active");

  const meta = PAGE_META[targetScreen];
  document.getElementById("pageTitle").textContent = meta.title;
  document.getElementById("pageSubtitle").textContent = meta.subtitle;

  document.getElementById("appShell")?.classList.toggle("is-auth", AUTH_LAYOUT_SCREENS.has(targetScreen));

  updatePortalChrome(targetScreen);
  postNavigate(targetScreen);

  if (updateHash) {
    const nextHash = `#/${targetScreen}`;
    if (location.hash !== nextHash) {
      history.pushState({ screen: targetScreen }, "", nextHash);
    }
  }

  closePortalDrawer();
  document.querySelector(".app-content")?.scrollTo({ top: 0, behavior: "smooth" });
}

function showScreen(screenId) {
  navigateTo(screenId);
}

function handleSignOut() {
  VendorAuth.signOut();
  navigateTo("landing");
}

function openPortalDrawer() {
  if (!isMobileViewport()) return;
  if (!document.getElementById("portalLayout")?.classList.contains("portal-layout--with-nav")) return;
  document.body.classList.add("portal-drawer-open");
  document.getElementById("portalMenuBtn")?.setAttribute("aria-expanded", "true");
}

function closePortalDrawer() {
  document.body.classList.remove("portal-drawer-open");
  document.getElementById("portalMenuBtn")?.setAttribute("aria-expanded", "false");
}

function togglePortalDrawer() {
  document.body.classList.contains("portal-drawer-open") ? closePortalDrawer() : openPortalDrawer();
}

function setColorTheme(theme) {
  document.documentElement.setAttribute("data-color", theme === "purple" ? "purple" : "orange");
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
  return PAGE_META[hash] ? hash : null;
}

function handleNavClick(event) {
  const trigger = event.target.closest("[data-nav]");
  if (!trigger) return;
  const screenId = trigger.dataset.nav;
  if (!screenId || !PAGE_META[screenId]) return;
  event.preventDefault();
  navigateTo(screenId);
}

function setRegisterStep(step) {
  registerStep = step;
  document.querySelectorAll(".signup-step").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.step) === step);
    el.classList.toggle("done", Number(el.dataset.step) < step);
  });
  document.querySelectorAll(".signup-panel").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.panel) === step);
  });
}

function getRegisterFormData() {
  const form = document.getElementById("registerForm");
  const data = Object.fromEntries(new FormData(form).entries());
  data.logoDataUrl = registerLogoDataUrl;
  return data;
}

function validateRegisterStep(step) {
  const form = document.getElementById("registerForm");
  const data = getRegisterFormData();

  if (step === 1) {
    if (!data.ownerName?.trim()) return "Owner name is required.";
    if (!data.email?.trim()) return "Email is required.";
    if (!data.phone?.trim()) return "Phone is required.";
    if (!data.password || data.password.length < 8) return "Password must be at least 8 characters.";
    if (data.password !== data.confirmPassword) return "Passwords do not match.";
  }

  if (step === 2) {
    if (!data.storeName?.trim()) return "Store name is required.";
    if (!data.storeDescription?.trim()) return "Store description is required.";
    if (!data.contactAddress?.trim()) return "Business address is required.";
    if (!data.contactPhone?.trim()) return "Contact phone is required.";
    if (!data.contactEmail?.trim()) return "Contact email is required.";
  }

  return null;
}

function buildRegisterReview() {
  const data = getRegisterFormData();
  const review = document.getElementById("registerReview");
  if (!review) return;

  review.innerHTML = `
    <div class="review-row"><span>Owner</span><strong>${data.ownerName}</strong></div>
    <div class="review-row"><span>Email</span><strong>${data.email}</strong></div>
    <div class="review-row"><span>Phone</span><strong>${data.phone}</strong></div>
    <div class="review-row"><span>Store</span><strong>${data.storeName}</strong></div>
    <div class="review-row"><span>Description</span><strong>${data.storeDescription}</strong></div>
    <div class="review-row"><span>Address</span><strong>${data.contactAddress}</strong></div>
    <div class="review-row"><span>Contact phone</span><strong>${data.contactPhone}</strong></div>
    <div class="review-row"><span>Contact email</span><strong>${data.contactEmail}</strong></div>
    <div class="review-row"><span>Logo</span><strong>${registerLogoDataUrl ? "Uploaded" : "Not provided"}</strong></div>
  `;
}

function initAuth() {
  VendorAuth.seedDemoVendor();

  document.getElementById("loginForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    showAuthError("loginError", null);

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const result = VendorAuth.signIn(email, password);

    if (!result.ok) {
      showAuthError("loginError", result.error);
      return;
    }

    navigateTo(resolvePostLoginRoute(result.vendor));
  });

  document.getElementById("registerNext1")?.addEventListener("click", () => {
    const err = validateRegisterStep(1);
    showAuthError("registerError", err);
    if (!err) setRegisterStep(2);
  });

  document.getElementById("registerBack2")?.addEventListener("click", () => setRegisterStep(1));

  document.getElementById("registerNext2")?.addEventListener("click", () => {
    const err = validateRegisterStep(2);
    showAuthError("registerError", err);
    if (!err) {
      buildRegisterReview();
      setRegisterStep(3);
    }
  });

  document.getElementById("registerBack3")?.addEventListener("click", () => setRegisterStep(2));

  document.getElementById("registerForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    showAuthError("registerError", null);

    if (!document.getElementById("registerTerms").checked) {
      showAuthError("registerError", "Please accept the vendor terms.");
      return;
    }

    const err = validateRegisterStep(2) || validateRegisterStep(1);
    if (err) {
      showAuthError("registerError", err);
      return;
    }

    const result = VendorAuth.signUp(getRegisterFormData());
    if (!result.ok) {
      showAuthError("registerError", result.error);
      return;
    }

    registerLogoDataUrl = null;
    document.getElementById("registerForm").reset();
    navigateTo("account-status");
  });

  document.getElementById("forgotForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    alert("Password reset link sent (demo). In production this uses Firebase Auth.");
    navigateTo("login");
  });

  document.getElementById("storeSetupForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const updates = {
      storeName: document.getElementById("storeNameInput").value,
      storeDescription: document.getElementById("storeDescInput").value,
      contactPhone: document.getElementById("storePhoneInput").value,
      contactEmail: document.getElementById("storeEmailInput").value,
      contactAddress: document.getElementById("storeAddressInput").value,
    };
    VendorAuth.updateVendorProfile(updates);
    populateStoreSetupPage();
    alert("Store profile saved (demo).");
  });

  const logoBox = document.getElementById("logoUploadBox");
  const logoInput = document.getElementById("logoInput");
  logoBox?.addEventListener("click", () => logoInput?.click());
  logoInput?.addEventListener("change", () => {
    const file = logoInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      registerLogoDataUrl = reader.result;
      const preview = document.getElementById("logoPreview");
      preview.src = registerLogoDataUrl;
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("topbarSignOut")?.addEventListener("click", handleSignOut);
  document.getElementById("sidebarSignOut")?.addEventListener("click", handleSignOut);
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

  select.addEventListener("change", () => navigateTo(select.value, { skipGuard: true }));
}

function initNavigation() {
  document.addEventListener("click", handleNavClick);

  document.querySelectorAll(".row-link").forEach((el) => {
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (el.dataset.nav) navigateTo(el.dataset.nav);
      }
    });
  });

  document.getElementById("portalMenuBtn")?.addEventListener("click", togglePortalDrawer);
  document.getElementById("portalDrawerClose")?.addEventListener("click", closePortalDrawer);
  document.getElementById("portalBackdrop")?.addEventListener("click", closePortalDrawer);

  window.addEventListener("popstate", () => {
    const hashScreen = getScreenFromHash();
    navigateTo(hashScreen || (VendorAuth.getSessionVendor() ? "dashboard" : "landing"), {
      updateHash: false,
    });
  });

  window.addEventListener("resize", () => {
    if (!isMobileViewport()) closePortalDrawer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePortalDrawer();
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
  VendorAuth.seedDemoVendor();
  initAuth();
  buildProtoScreenSelect();
  initNavigation();

  const hashScreen = getScreenFromHash();
  const vendor = VendorAuth.getSessionVendor();

  if (hashScreen) {
    navigateTo(hashScreen, { updateHash: false });
  } else if (vendor) {
    navigateTo(resolvePostLoginRoute(vendor), { updateHash: true });
  } else {
    navigateTo("landing", { updateHash: true });
  }
});
