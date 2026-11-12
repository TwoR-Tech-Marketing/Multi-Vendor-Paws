import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPoller, type VisibilitySource } from "@/features/telehealth/application/poller";

function fakeVisibility() {
  let hidden = false;
  const listeners = new Set<() => void>();
  const source: VisibilitySource = {
    isHidden: () => hidden,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    source,
    listeners,
    setHidden(value: boolean) {
      hidden = value;
      listeners.forEach((l) => l());
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createPoller", () => {
  it("runs the task every interval after start", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const poller = createPoller(task, 3000, fakeVisibility().source);
    poller.start();
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(6000);
    expect(task).toHaveBeenCalledTimes(3);
    poller.stop();
  });

  it("pauses while hidden and runs at once when visible again", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const visibility = fakeVisibility();
    const poller = createPoller(task, 10_000, visibility.source);
    poller.start();
    visibility.setHidden(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(task).not.toHaveBeenCalled();
    visibility.setHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(task).toHaveBeenCalledTimes(2);
    poller.stop();
  });

  it("does not start a timer when started hidden", async () => {
    const task = vi.fn();
    const visibility = fakeVisibility();
    visibility.setHidden(true);
    createPoller(task, 1000, visibility.source).start();
    await vi.advanceTimersByTimeAsync(5000);
    expect(task).not.toHaveBeenCalled();
  });

  it("never overlaps a slow run and keeps going after errors", async () => {
    let finish: () => void = () => {};
    const task = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const poller = createPoller(task, 1000, fakeVisibility().source);
    poller.start();
    await vi.advanceTimersByTimeAsync(5000);
    expect(task).toHaveBeenCalledTimes(1);
    finish();
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(3);
    poller.stop();
  });

  it("stops the timer and the visibility listener", async () => {
    const task = vi.fn();
    const visibility = fakeVisibility();
    const poller = createPoller(task, 1000, visibility.source);
    poller.start();
    poller.stop();
    expect(visibility.listeners.size).toBe(0);
    visibility.setHidden(false);
    await vi.advanceTimersByTimeAsync(5000);
    expect(task).not.toHaveBeenCalled();
  });
});
