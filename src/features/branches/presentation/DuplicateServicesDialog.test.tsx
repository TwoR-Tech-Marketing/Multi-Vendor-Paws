import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DuplicateServicesDialog } from "@/features/branches/presentation/DuplicateServicesDialog";
import { makeBranch, makeService } from "@/features/branches/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function render(props: Partial<Parameters<typeof DuplicateServicesDialog>[0]> = {}) {
  return renderToStaticMarkup(
    <DuplicateServicesDialog
      open
      strings={en}
      locale="en"
      sources={[makeBranch({ branchId: "b2", name: "Maadi" })]}
      fromBranchId="b2"
      onFromChange={noop}
      services={[
        makeService({ serviceId: "s1", nameEn: "Checkup" }),
        makeService({ serviceId: "s2", nameEn: "Vaccine" }),
        makeService({ serviceId: "s3", nameEn: "Old", status: "archived" }),
      ]}
      isSubmitting={false}
      error={null}
      resultMessage={null}
      onSubmit={noop}
      onClose={noop}
      {...props}
    />,
  );
}

describe("DuplicateServicesDialog", () => {
  it("renders nothing when closed", () => {
    expect(render({ open: false })).toBe("");
  });

  it("shows the source picker, active service checkboxes and skip existing", () => {
    const html = render();
    expect(html).toContain('role="dialog"');
    expect(html).toContain(en.services.duplicate.title);
    expect(html).toContain(en.services.duplicate.from);
    expect(html).toContain("Maadi");
    expect(html).toContain(en.services.duplicate.selectAll);
    expect(html).toContain("Checkup");
    expect(html).toContain("Vaccine");
    expect(html).not.toContain(">Old<");
    expect(html).toContain(en.services.duplicate.skipExisting);
    expect(html).toContain(en.services.duplicate.submit);
    expect(html).not.toContain("<select");
  });

  it("shows a shimmer list while the source services load", () => {
    const html = render({ services: null });
    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Copy services<\/button>/);
  });

  it("explains when there is no branch to copy from", () => {
    const html = render({ sources: [] });
    expect(html).toContain(en.services.duplicate.noSources);
    expect(html).not.toContain(`>${en.services.duplicate.submit}</button>`);
  });

  it("shows the result and errors", () => {
    const result = en.services.duplicate.result.replace("{created}", "2").replace("{skipped}", "1");
    expect(render({ resultMessage: result })).toContain("2 services copied, 1 skipped.");
    expect(render({ error: en.errors.branches.limit })).toContain(en.errors.branches.limit);
  });

  it("renders in Arabic", () => {
    const html = render({ strings: ar, locale: "ar" });
    expect(html).toContain(ar.services.duplicate.title);
    expect(html).toContain("كشف");
  });
});
