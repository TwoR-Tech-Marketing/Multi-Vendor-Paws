import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/preferences/PreferencesContext", () => ({ useStrings: vi.fn() }));
vi.mock("@/features/vendor/infrastructure/vendor-documents.api", () => ({
  fetchMyVendorDocuments: vi.fn(),
  fetchVendorDocumentRequirements: vi.fn(),
}));

import { DocumentStatusBadge } from "@/features/vendor/presentation/VendorDocumentsSection";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");

describe("DocumentStatusBadge", () => {
  it.each([
    ["approved", "success", en.accountStatus.documentApproved],
    ["pending", "warning", en.accountStatus.documentPending],
    ["rejected", "danger", en.accountStatus.documentRejected],
  ] as const)("shows %s as a %s text badge", (status, tone, label) => {
    const html = renderToStaticMarkup(<DocumentStatusBadge status={status} strings={en} />);
    expect(html).toContain(`data-tone="${tone}"`);
    expect(html).toContain(`>${label}</span>`);
  });

  it("shows a neutral missing badge, in Arabic too", () => {
    const html = renderToStaticMarkup(<DocumentStatusBadge status={null} strings={ar} />);
    expect(html).toContain('data-tone="neutral"');
    expect(html).toContain(ar.accountStatus.documentsMissing);
  });
});
