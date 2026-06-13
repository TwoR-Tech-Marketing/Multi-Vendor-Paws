import {
  SkeletonAvatar,
  SkeletonBox,
  SkeletonIcon,
  SkeletonNavItem,
  SkeletonText,
} from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";
import { PortalContentSkeleton } from "@/features/vendor/presentation/PortalContentSkeleton";

import shellStyles from "./portalShellSkeleton.module.css";

const NAV_ITEM_COUNT = 5;

export function PortalShellSkeleton() {
  return (
    <div className={shellStyles.shell} role="status" aria-label={Strings.common.loading}>
      <aside className={shellStyles.sidebar}>
        <SkeletonBox
          className={shellStyles.logo}
          width={46}
          height={46}
          borderRadius="var(--radius-sm)"
        />

        <div className={shellStyles.navScroll}>
          {Array.from({ length: NAV_ITEM_COUNT }).map((_, index) => (
            <SkeletonNavItem
              key={index}
              labelWidth={index % 2 === 0 ? 68 : 84}
              showRule={index < NAV_ITEM_COUNT - 1}
            />
          ))}
        </div>

        <div className={shellStyles.logout}>
          <SkeletonIcon size={18} />
          <SkeletonText width={56} />
        </div>
      </aside>

      <div className={shellStyles.main}>
        <header className={shellStyles.topbar}>
          <div className={shellStyles.topbarRow}>
            <SkeletonBox width={44} height={44} borderRadius="var(--radius-sm)" />
            <div className={shellStyles.topbarRight}>
              <SkeletonIcon size={24} />
              <SkeletonAvatar size={40} />
            </div>
          </div>

          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderRow}>
              <SkeletonBox width={44} height={44} borderRadius="var(--radius-sm)" />
              <div className={shellStyles.pageHeaderTitle}>
                <SkeletonText size="xl" width="42%" />
                <SkeletonText size="sm" width="58%" />
              </div>
            </div>
          </div>
        </header>

        <div className={shellStyles.content}>
          <PortalContentSkeleton />
        </div>
      </div>
    </div>
  );
}
