import { describe, expect, it } from "vitest";

import {
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
} from "@/features/coverage/domain/types";

describe("coverage radius limits", () => {
  it("keeps the coverage validation window", () => {
    expect(MIN_RADIUS_METERS).toBe(500);
    expect(MAX_RADIUS_METERS).toBe(100_000);
    expect(MIN_RADIUS_METERS).toBeLessThan(MAX_RADIUS_METERS);
  });
});
