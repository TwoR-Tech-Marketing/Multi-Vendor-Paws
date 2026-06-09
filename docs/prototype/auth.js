/** Demo auth for vendor-only prototype (localStorage — not production Firebase). */

const AUTH_STORAGE_KEY = "mvp-vendor-auth-v1";

const DEMO_VENDOR = {
  id: "demo-vendor-1",
  ownerName: "Ahmed Hassan",
  email: "vendor@happytails.com",
  password: "password123",
  phone: "+20 100 123 4567",
  storeName: "Happy Tails Hub",
  storeDescription: "Premium pet food, toys, and accessories in Greater Cairo.",
  contactPhone: "+20 100 123 4567",
  contactEmail: "contact@happytails.com",
  contactAddress: "Nasr City, Cairo, Egypt",
  logoDataUrl: null,
  status: "active",
  createdAt: "2026-05-15T10:00:00.000Z",
};

const PROTECTED_SCREENS = new Set([
  "dashboard",
  "store-setup",
  "products",
  "product-form",
  "orders",
  "order-detail",
  "earnings",
  "account-status",
]);

function readStore() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { vendors: [DEMO_VENDOR], session: null };
}

function writeStore(store) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(store));
}

function seedDemoVendor() {
  const store = readStore();
  const hasDemo = store.vendors.some((v) => v.email === DEMO_VENDOR.email);
  if (!hasDemo) {
    store.vendors.unshift(DEMO_VENDOR);
    writeStore(store);
  }
}

function getSessionVendor() {
  const store = readStore();
  if (!store.session?.vendorId) return null;
  return store.vendors.find((v) => v.id === store.session.vendorId) ?? null;
}

function signIn(email, password) {
  const store = readStore();
  const vendor = store.vendors.find(
    (v) => v.email.toLowerCase() === email.trim().toLowerCase() && v.password === password,
  );

  if (!vendor) {
    return { ok: false, error: "Invalid email or password." };
  }

  store.session = { vendorId: vendor.id, email: vendor.email };
  writeStore(store);
  return { ok: true, vendor };
}

function signUp(payload) {
  const store = readStore();
  const email = payload.email.trim().toLowerCase();

  if (store.vendors.some((v) => v.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const vendor = {
    id: `vendor-${Date.now()}`,
    ownerName: payload.ownerName.trim(),
    email,
    password: payload.password,
    phone: payload.phone.trim(),
    storeName: payload.storeName.trim(),
    storeDescription: payload.storeDescription.trim(),
    contactPhone: payload.contactPhone.trim(),
    contactEmail: payload.contactEmail.trim().toLowerCase(),
    contactAddress: payload.contactAddress.trim(),
    logoDataUrl: payload.logoDataUrl ?? null,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  store.vendors.push(vendor);
  store.session = { vendorId: vendor.id, email: vendor.email };
  writeStore(store);
  return { ok: true, vendor };
}

function signOut() {
  const store = readStore();
  store.session = null;
  writeStore(store);
}

function updateVendorProfile(updates) {
  const store = readStore();
  const vendor = getSessionVendor();
  if (!vendor) return { ok: false, error: "Not signed in." };

  const index = store.vendors.findIndex((v) => v.id === vendor.id);
  if (index < 0) return { ok: false, error: "Vendor not found." };

  store.vendors[index] = { ...store.vendors[index], ...updates };
  writeStore(store);
  return { ok: true, vendor: store.vendors[index] };
}

function isProtectedScreen(screenId) {
  return PROTECTED_SCREENS.has(screenId);
}

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

window.VendorAuth = {
  seedDemoVendor,
  getSessionVendor,
  signIn,
  signUp,
  signOut,
  updateVendorProfile,
  isProtectedScreen,
  getInitials,
  DEMO_VENDOR,
};
