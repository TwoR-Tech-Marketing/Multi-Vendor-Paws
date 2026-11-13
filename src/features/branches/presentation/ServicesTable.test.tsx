import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { makeService } from "@/features/branches/presentation/test-fixtures";
import { ServicesTable } from "@/features/branches/presentation/ServicesTable";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function render(props: Partial<Parameters<typeof ServicesTable>[0]> = {}) {
  return renderToStaticMarkup(
    <ServicesTable
      services={[makeService()]}
      strings={en}
      locale="en"
      readOnly={false}
      onEdit={noop}
      onArchive={noop}
      onRestore={noop}
      {...props}
    />,
  );
}

describe("ServicesTable", () => {
  it("shows the empty state", () => {
    expect(render({ services: [] })).toContain(en.services.emptyTitle);
  });

  it("shows name, piastres as EGP, duration and status in English", () => {
    const html = render();
    expect(html).toContain("Checkup");
    expect(html).toContain("250.00 EGP");
    expect(html).toContain("30 min");
    expect(html).toContain(en.branches.activeBadge);
    expect(html).toContain(en.services.edit);
    expect(html).toContain(en.services.archive);
  });

  it("uses the Arabic name and copy in Arabic", () => {
    const html = render({ strings: ar, locale: "ar" });
    expect(html).toContain("كشف");
    expect(html).toContain(ar.services.durationMinutes.replace("{count}", "30"));
    expect(html).toContain("\u2066250.00\u2069 ج.م");
  });

  it("shows free services, photo thumbs and restore for archived rows", () => {
    const html = render({
      services: [
        makeService({ pricePiastres: 0, photoUrl: "https://firebasestorage.googleapis.com/p.png" }),
        makeService({ serviceId: "s2", status: "archived" }),
      ],
    });
    expect(html).toContain(en.services.free);
    expect(html).toContain("firebasestorage.googleapis.com");
    expect(html).toContain(en.branches.archivedBadge);
    expect(html).toContain(en.services.restore);
  });

  it("hides actions when read only", () => {
    const html = render({ readOnly: true });
    expect(html).not.toContain(en.services.actions);
    expect(html).not.toContain(en.services.edit);
  });
});
