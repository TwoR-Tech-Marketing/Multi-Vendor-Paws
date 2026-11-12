import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

const session = { profile: { vendorType: "store" as string | undefined } };

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/features/vendor/presentation/PortalSessionContext", () => ({
  usePortalSession: () => session,
}));

function render(screen: "products" | "orders" | "coverage") {
  return renderToStaticMarkup(
    <VendorScreenGuard screen={screen}>
      <p>store page</p>
    </VendorScreenGuard>,
  );
}

describe("VendorScreenGuard", () => {
  beforeEach(() => {
    session.profile.vendorType = "store";
  });

  it("renders store pages for store vendors and vendors without a type", () => {
    for (const screen of ["products", "orders", "coverage"] as const) {
      expect(render(screen)).toContain("store page");
    }
    session.profile.vendorType = undefined;
    expect(render("products")).toContain("store page");
  });

  it.each(["clinic", "groomer", "doctor", "hotel"])(
    "shows the skeleton instead of store pages for %s",
    (type) => {
      session.profile.vendorType = type;
      for (const screen of ["products", "orders", "coverage"] as const) {
        const html = render(screen);
        expect(html).not.toContain("store page");
        expect(html).toContain('aria-busy="true"');
      }
    },
  );
});
