import { describe, expect, it } from "vitest";

import { canOpenAvailability } from "@/features/branches/presentation/branch-copy";
import { makeBranch } from "@/features/branches/presentation/test-fixtures";

describe("canOpenAvailability", () => {
  it("links availability from active clinic and groomer branches only", () => {
    expect(canOpenAvailability(makeBranch(), "clinic")).toBe(true);
    expect(canOpenAvailability(makeBranch(), "groomer")).toBe(true);
    expect(canOpenAvailability(makeBranch({ status: "archived" }), "clinic")).toBe(false);
    expect(canOpenAvailability(makeBranch(), "store")).toBe(false);
    expect(canOpenAvailability(makeBranch(), "doctor")).toBe(false);
  });
});
