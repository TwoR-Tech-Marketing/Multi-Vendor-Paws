import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

import {
  getFirebaseClientConfig,
  getFirebaseEmulatorHosts,
  hasFirebaseEmulatorHosts,
  isDemoProjectId,
  parseEmulatorHost,
  type FirebaseClientConfig,
  type FirebaseEmulatorHosts,
} from "@/lib/firebase-client-env";

const FUNCTIONS_REGION = "us-central1";
const EMULATORS_CONNECTED = Symbol.for("multi-vendor-paws.firebase.emulatorsConnected");

type FirebaseClients = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
};

type EmulatorFlagHolder = { [EMULATORS_CONNECTED]?: boolean };

function connectEmulatorsOnce(clients: FirebaseClients, hosts: FirebaseEmulatorHosts): void {
  const holder = globalThis as EmulatorFlagHolder;
  if (holder[EMULATORS_CONNECTED]) return;
  holder[EMULATORS_CONNECTED] = true;

  if (hosts.auth) {
    connectAuthEmulator(clients.auth, `http://${hosts.auth}`, { disableWarnings: true });
  }
  if (hosts.firestore) {
    const { host, port } = parseEmulatorHost(hosts.firestore);
    connectFirestoreEmulator(clients.firestore, host, port);
  }
  if (hosts.functions) {
    const { host, port } = parseEmulatorHost(hosts.functions);
    connectFunctionsEmulator(clients.functions, host, port);
  }
  if (hosts.storage) {
    const { host, port } = parseEmulatorHost(hosts.storage);
    connectStorageEmulator(clients.storage, host, port);
  }
}

function createClients(config: FirebaseClientConfig): FirebaseClients {
  const hosts = getFirebaseEmulatorHosts();
  const useEmulators = hasFirebaseEmulatorHosts(hosts);
  if (useEmulators && !isDemoProjectId(config.projectId)) {
    throw new Error(
      "Firebase emulator hosts are set but the project id does not start with demo-. Refusing to start.",
    );
  }

  const app = getApps().length ? getApp() : initializeApp(config);
  const clients: FirebaseClients = {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
    functions: getFunctions(app, FUNCTIONS_REGION),
  };
  if (useEmulators) connectEmulatorsOnce(clients, hosts);
  return clients;
}

/**
 * Stand-in used when the browser Firebase variables are missing. Importing this
 * module never throws; only an actual use does, with a clear message. The route
 * trees render a configuration screen instead of reaching these.
 */
function unconfigured<T extends object>(): T {
  return new Proxy({} as T, {
    get(_target, property) {
      if (property === "then" || typeof property === "symbol") return undefined;
      throw new Error("Firebase client is not configured. Set the public Firebase variables.");
    },
  });
}

const config = getFirebaseClientConfig();
const clients = config ? createClients(config) : null;

export const firebaseApp: FirebaseApp = clients?.app ?? unconfigured<FirebaseApp>();
export const firebaseAuth: Auth = clients?.auth ?? unconfigured<Auth>();
export const firestore: Firestore = clients?.firestore ?? unconfigured<Firestore>();
export const firebaseStorage: FirebaseStorage =
  clients?.storage ?? unconfigured<FirebaseStorage>();
export const firebaseFunctions: Functions = clients?.functions ?? unconfigured<Functions>();
