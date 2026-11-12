import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ProviderPhotoGrid,
  type ProviderPhotoItem,
} from "@/features/vendor/presentation/ProviderPhotoGrid";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");

function items(count: number): ProviderPhotoItem[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i}`, url: `https://example.com/${i}.jpg` }));
}

function render(list: ProviderPhotoItem[], disabled = false, strings = en) {
  return renderToStaticMarkup(
    <ProviderPhotoGrid
      strings={strings}
      items={list}
      max={6}
      disabled={disabled}
      onAdd={() => {}}
      onRemove={() => {}}
    />,
  );
}

describe("ProviderPhotoGrid", () => {
  it("offers add and a labelled remove per photo while editing", () => {
    const html = render(items(2));
    expect(html).toContain(en.profile.photos.add);
    expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(html).toContain(`aria-label="${en.profile.photos.remove.replace("{index}", "1")}"`);
    expect(html).toContain(`aria-label="${en.profile.photos.remove.replace("{index}", "2")}"`);
  });

  it("hides add at six photos", () => {
    const html = render(items(6));
    expect(html).not.toContain(en.profile.photos.add);
    expect(html.match(/<img/g)).toHaveLength(6);
  });

  it("is view only when disabled", () => {
    const html = render(items(1), true);
    expect(html).not.toContain(en.profile.photos.add);
    expect(html).not.toContain(en.profile.photos.removeShort);
  });

  it("uses Arabic copy", () => {
    const html = render(items(1), false, ar);
    expect(html).toContain(ar.profile.photos.add);
    expect(html).toContain(ar.profile.photos.removeShort);
  });
});
