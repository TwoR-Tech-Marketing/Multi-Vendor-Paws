import { describe, expect, it } from "vitest";

import { egpToPiastres, formatEgp, piastresToEgp } from "@/features/products/domain/currency";

const MINUS = /^-/;

describe("formatEgp", () => {
  it("formats zero and positive piastres without a sign", () => {
    expect(formatEgp(0)).toBe(formatEgp(-0));
    expect(formatEgp(0)).not.toMatch(MINUS);
    expect(formatEgp(12550)).toMatch(/125\.5/);
    expect(formatEgp(12550)).not.toMatch(MINUS);
  });

  it("formats negative piastres as a minus sign plus the absolute amount", () => {
    expect(formatEgp(-50)).toBe(`-${formatEgp(50)}`);
    expect(formatEgp(-199)).toBe(`-${formatEgp(199)}`);
    expect(formatEgp(-199)).toMatch(/1\.99/);
    expect(formatEgp(-2500)).toMatch(/^-EGP\s?25/);
  });

  it("never throws on unusual input", () => {
    expect(() => formatEgp(Number.NaN)).not.toThrow();
    expect(formatEgp(Number.NaN)).toBe(formatEgp(0));
    expect(formatEgp(-199.7)).toBe(formatEgp(-199));
  });
});

describe("input converters keep their guards", () => {
  it("rejects negative input amounts", () => {
    expect(() => egpToPiastres(-1)).toThrow(RangeError);
    expect(() => piastresToEgp(-1)).toThrow(RangeError);
    expect(egpToPiastres(1.99)).toBe(199);
    expect(piastresToEgp(199)).toBe(1.99);
  });
});
