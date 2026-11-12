import { FirebaseError } from "firebase/app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const auth = {
    currentUser: null as { uid: string } | null,
    authStateReady: vi.fn(async () => undefined),
  };
  return {
    auth,
    setPersistence: vi.fn(async () => undefined),
    signInWithCustomToken: vi.fn(async (_auth: unknown, token: string) => {
      auth.currentUser = { uid: token.replace("token-", "") };
    }),
    signOut: vi.fn(async () => {
      auth.currentUser = null;
    }),
  };
});

vi.mock("firebase/auth", () => ({
  browserSessionPersistence: "session",
  setPersistence: mocks.setPersistence,
  signInWithCustomToken: mocks.signInWithCustomToken,
  signOut: mocks.signOut,
}));
vi.mock("@/lib/firebase", () => ({ firebaseAuth: mocks.auth }));

import {
  CLIENT_AUTH_RECHECK_MS,
  clearClientAuth,
  ensureClientAuth,
  FIREBASE_TOKEN_PATH,
  resetClientAuthStateForTests,
} from "@/lib/client-auth";

const fetchMock = vi.fn();

function sessionResponse(uid: string) {
  return new Response(JSON.stringify({ token: `token-${uid}`, uid }), { status: 200 });
}

beforeEach(() => {
  resetClientAuthStateForTests();
  mocks.auth.currentUser = null;
  mocks.setPersistence.mockClear();
  mocks.signInWithCustomToken.mockClear();
  mocks.signOut.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ensureClientAuth", () => {
  it("signs in with the session token when there is no client user", async () => {
    fetchMock.mockResolvedValueOnce(sessionResponse("v1"));

    await ensureClientAuth();

    expect(fetchMock).toHaveBeenCalledWith(
      FIREBASE_TOKEN_PATH,
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
    expect(mocks.setPersistence).toHaveBeenCalledWith(mocks.auth, "session");
    expect(mocks.signInWithCustomToken).toHaveBeenCalledWith(mocks.auth, "token-v1");
    expect(mocks.auth.currentUser?.uid).toBe("v1");
  });

  it("does not fetch again once the client user matches the session", async () => {
    fetchMock.mockResolvedValueOnce(sessionResponse("v1"));
    await ensureClientAuth();
    fetchMock.mockClear();

    await ensureClientAuth();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signs in once for concurrent calls", async () => {
    fetchMock.mockResolvedValueOnce(sessionResponse("v1"));

    await Promise.all([ensureClientAuth(), ensureClientAuth(), ensureClientAuth()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithCustomToken).toHaveBeenCalledTimes(1);
  });

  it("keeps an unverified client user that already matches the session", async () => {
    mocks.auth.currentUser = { uid: "v1" };
    fetchMock.mockResolvedValueOnce(sessionResponse("v1"));

    await ensureClientAuth();

    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
  });

  it("re-signs in when the client user belongs to another account", async () => {
    mocks.auth.currentUser = { uid: "store1" };
    fetchMock.mockResolvedValueOnce(sessionResponse("clinic1"));

    await ensureClientAuth();

    expect(mocks.signInWithCustomToken).toHaveBeenCalledWith(mocks.auth, "token-clinic1");
    expect(mocks.auth.currentUser?.uid).toBe("clinic1");
  });

  it("re-checks the session after a sign out", async () => {
    fetchMock.mockResolvedValueOnce(sessionResponse("store1"));
    await ensureClientAuth();
    await clearClientAuth();
    fetchMock.mockResolvedValueOnce(sessionResponse("clinic1"));

    await ensureClientAuth();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mocks.auth.currentUser?.uid).toBe("clinic1");
  });

  it("throws unauthenticated and clears the client user without a session", async () => {
    mocks.auth.currentUser = { uid: "stale" };
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 401 }));

    const error = await ensureClientAuth().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(FirebaseError);
    expect((error as FirebaseError).code).toBe("functions/unauthenticated");
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.auth.currentUser).toBeNull();
    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
  });

  it("allows a retry after a failed request", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(ensureClientAuth()).rejects.toMatchObject({ code: "functions/internal" });

    fetchMock.mockResolvedValueOnce(sessionResponse("v1"));
    await ensureClientAuth();

    expect(mocks.auth.currentUser?.uid).toBe("v1");
  });

  it("asks the session again once the confirmation is older than the recheck window", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    fetchMock.mockResolvedValueOnce(sessionResponse("v1"));
    await ensureClientAuth();

    now.mockReturnValue(1_000_000 + CLIENT_AUTH_RECHECK_MS - 1);
    await ensureClientAuth();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000_000 + CLIENT_AUTH_RECHECK_MS);
    fetchMock.mockResolvedValueOnce(sessionResponse("v1"));
    await ensureClientAuth();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mocks.signInWithCustomToken).toHaveBeenCalledTimes(1);
  });

  it("does not sign in when a sign out happens while the token is on its way", async () => {
    let release: (response: Response) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
    );

    const pending = ensureClientAuth().catch((caught: unknown) => caught);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await clearClientAuth();
    release(sessionResponse("store1"));

    const error = await pending;
    expect((error as FirebaseError).code).toBe("functions/unauthenticated");
    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
    expect(mocks.auth.currentUser).toBeNull();

    fetchMock.mockResolvedValueOnce(sessionResponse("clinic1"));
    await ensureClientAuth();
    expect(mocks.auth.currentUser?.uid).toBe("clinic1");
  });
});
