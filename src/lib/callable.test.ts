import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureClientAuth: vi.fn(async () => undefined),
  callableFn: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock("firebase/functions", () => ({ httpsCallable: mocks.httpsCallable }));
vi.mock("@/lib/client-auth", () => ({ ensureClientAuth: mocks.ensureClientAuth }));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: { id: "functions" } }));

import { invokeCallable } from "@/lib/callable";

beforeEach(() => {
  mocks.ensureClientAuth.mockReset();
  mocks.ensureClientAuth.mockResolvedValue(undefined);
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.httpsCallable.mockReturnValue(mocks.callableFn);
});

describe("invokeCallable", () => {
  it("ensures the client user first, then returns the callable data", async () => {
    mocks.callableFn.mockResolvedValue({ data: { ok: true } });

    const data = await invokeCallable("group-name", { a: 1 });

    expect(data).toEqual({ ok: true });
    expect(mocks.httpsCallable).toHaveBeenCalledWith({ id: "functions" }, "group-name");
    expect(mocks.callableFn).toHaveBeenCalledWith({ a: 1 });
    expect(mocks.ensureClientAuth.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.callableFn.mock.invocationCallOrder[0],
    );
  });

  it("does not call the callable when there is no session", async () => {
    mocks.ensureClientAuth.mockRejectedValue({ code: "functions/unauthenticated" });

    await expect(invokeCallable("group-name", {})).rejects.toMatchObject({
      code: "functions/unauthenticated",
    });
    expect(mocks.callableFn).not.toHaveBeenCalled();
  });
});
