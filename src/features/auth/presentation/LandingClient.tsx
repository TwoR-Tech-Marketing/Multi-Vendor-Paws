"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import type { SVGProps } from "react";

import {
  IconBell,
  IconChart,
  IconCheck,
  IconCoins,
  IconHandshake,
  IconInbox,
  IconLifebuoy,
  IconPackage,
  IconPaw,
  IconReceipt,
  IconSmartphone,
  IconSparkle,
  IconStar,
  IconStore,
  IconTruck,
  IconWallet,
  IconArrowRight,
} from "./landing-icons";
import styles from "./landing.module.css";

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

const TICKER_PILLS: { Icon: SvgIcon; label: string }[] = [
  { Icon: IconSmartphone, label: "Mobile app visibility" },
  { Icon: IconCheck, label: "Admin-reviewed onboarding" },
  { Icon: IconBell, label: "Real-time order updates" },
  { Icon: IconLifebuoy, label: "Vendor support" },
  { Icon: IconStore, label: "Store management" },
  { Icon: IconCoins, label: "Commission-based earnings" },
];

const VENDOR_AVATARS = [
  { initials: "MK", tone: "lavender" as const, title: "Mia — treats shop" },
  { initials: "JR", tone: "peach" as const, title: "Jordan — pet accessories" },
  { initials: "SL", tone: "mint" as const, title: "Sara — organic food" },
  { initials: "AP", tone: "rose" as const, title: "Alex — grooming supplies" },
];

const FEATURES: { Icon: SvgIcon; title: string; description: string }[] = [
  {
    Icon: IconStore,
    title: "Your store, your way",
    description:
      "Set up your shop with a logo, photos, and story — then manage products, stock, and images from one dashboard.",
  },
  {
    Icon: IconSmartphone,
    title: "Reach pet parents on the app",
    description:
      "Buyers discover your treats, food, and accessories on Pawlio. You run the store; they shop on their phones.",
  },
  {
    Icon: IconSparkle,
    title: "Stand out in the feed",
    description:
      "Highlight your own branded products so loyal customers spot your store at a glance.",
  },
  {
    Icon: IconInbox,
    title: "Orders that find you",
    description:
      "New orders land in your inbox in real time — only your store, only your sales.",
  },
  {
    Icon: IconWallet,
    title: "See what you earn",
    description:
      "Track commissions and weekly earnings without spreadsheets. Clear numbers, clear payouts.",
  },
  {
    Icon: IconHandshake,
    title: "A team that reviews you",
    description:
      "We personally approve every vendor — usually within 24 hours — so pet parents shop with confidence.",
  },
];

const STEPS = [
  {
    num: 1,
    title: "Tell us about your shop",
    description:
      "Sign up with your business email, add your store details, and share what you sell.",
  },
  {
    num: 2,
    title: "We review your application",
    description:
      "Our admin team checks your store personally. Most vendors hear back within 24 hours.",
  },
  {
    num: 3,
    title: "Open for pet parents",
    description:
      "List products, watch orders roll in from the app, and grow alongside 200+ fellow vendors.",
  },
];

const NOTIFICATIONS: {
  Icon: SvgIcon;
  tone: "purple" | "green" | "amber";
  title: string;
  detail: string;
}[] = [
  {
    Icon: IconPackage,
    tone: "purple",
    title: "New order #1042",
    detail: "Dog food bundle · 2 min ago",
  },
  {
    Icon: IconTruck,
    tone: "green",
    title: "Order shipped",
    detail: "Cat treats · Ready for pickup",
  },
  {
    Icon: IconChart,
    tone: "amber",
    title: "Weekly earnings",
    detail: "Commission updated · just now",
  },
];

function PawWatermark() {
  return (
    <svg
      className={styles.cardWatermark}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <ellipse cx="60" cy="78" rx="22" ry="18" fill="currentColor" />
      <circle cx="38" cy="52" r="10" fill="currentColor" />
      <circle cx="52" cy="42" r="10" fill="currentColor" />
      <circle cx="68" cy="42" r="10" fill="currentColor" />
      <circle cx="82" cy="52" r="10" fill="currentColor" />
    </svg>
  );
}

function VendorAvatarStack() {
  return (
    <div className={styles.avatarStack} aria-label="Vendor community">
      {VENDOR_AVATARS.map((avatar, index) => (
        <div
          key={avatar.initials}
          className={`${styles.avatar} ${styles[`avatar${avatar.tone.charAt(0).toUpperCase() + avatar.tone.slice(1)}`]}`}
          style={{ zIndex: VENDOR_AVATARS.length - index }}
          title={avatar.title}
        >
          {avatar.initials}
        </div>
      ))}
    </div>
  );
}

function TickerPills() {
  const pills = [...TICKER_PILLS, ...TICKER_PILLS];

  return (
    <div className={styles.tickerWrap} aria-hidden="true">
      <div className={styles.tickerTrack}>
        <div className={styles.tickerGroup}>
          {pills.map((pill, index) => (
            <span key={`a-${pill.label}-${index}`} className={styles.tickerPill}>
              <span className={styles.tickerIcon}>
                <pill.Icon width={15} height={15} />
              </span>
              {pill.label}
            </span>
          ))}
        </div>
        <div className={styles.tickerGroup}>
          {pills.map((pill, index) => (
            <span key={`b-${pill.label}-${index}`} className={styles.tickerPill}>
              <span className={styles.tickerIcon}>
                <pill.Icon width={15} height={15} />
              </span>
              {pill.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingClient() {
  return (
    <main className={styles.page}>
      <div className={styles.bgWarm} aria-hidden="true" />
      <div className={styles.purpleBand} aria-hidden="true" />
      <div className={`${styles.orb} ${styles.orb1}`} aria-hidden="true" />
      <div className={`${styles.orb} ${styles.orb2}`} aria-hidden="true" />
      <div className={`${styles.orb} ${styles.orb3}`} aria-hidden="true" />

      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/pawlio-logo.png"
              alt="Pawlio"
              width={48}
              height={48}
              className={styles.logoImage}
              priority
            />
            <div className={styles.logoText}>
              <strong className={styles.brandName}>Pawlio</strong>
              <span>Vendor portal</span>
            </div>
          </Link>
          <nav className={styles.nav}>
            <Link href="/login" className={styles.navLink}>
              Sign in
            </Link>
            <Link href="/register" className={styles.navCta}>
              Get started
            </Link>
          </nav>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Built to last · Rooted in real value
            </p>
            <h1>
              Your pet store,{" "}
              <span className={styles.headlineAccent}>loved</span> by thousands
              of pet parents
            </h1>
            <p className={styles.heroLead}>
              Join <strong>200+ pet vendors</strong> already selling treats, food,
              and accessories on Pawlio — from home kitchens to neighborhood shops
              like yours.
            </p>
            <p className={styles.heroBody}>
              Run your catalog, watch orders arrive in real time, and see your
              earnings grow. Pet parents shop on the app; you manage everything
              right here.
            </p>
            <div className={styles.heroActions}>
              <Link href="/register" className={styles.btnPrimary}>
                Create vendor account
                <IconArrowRight className={styles.btnArrow} width={18} height={18} />
              </Link>
              <Link href="/login" className={styles.btnSecondary}>
                Sign in to dashboard
              </Link>
            </div>
            <div className={styles.socialProof}>
              <VendorAvatarStack />
              <p className={styles.socialProofText}>
                <IconStar className={styles.starIcon} width={14} height={14} />
                4.9 avg vendor rating · Free to join · Reviewed in 24hrs
              </p>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.previewCard}>
              <PawWatermark />

              <div className={styles.inlineAlert}>
                <span className={styles.inlineAlertIcon}>
                  <IconBell width={14} height={14} />
                </span>
                New order from the app
              </div>

              <div className={styles.storeIdentity}>
                <div className={styles.storeAvatar}>
                  <IconPaw width={20} height={20} />
                </div>
                <div className={styles.storeMeta}>
                  <strong>Paws &amp; Co.</strong>
                  <span>Organic treats · Cairo</span>
                </div>
                <span className={styles.previewBadge}>
                  <span className={styles.badgeDot} />
                  Active
                </span>
              </div>

              <div className={styles.previewStats}>
                <div className={`${styles.statBox} ${styles.statPurple}`}>
                  <span className={styles.statIcon}>
                    <IconPackage width={16} height={16} />
                  </span>
                  <div>
                    <strong>24</strong>
                    <span>Products</span>
                  </div>
                </div>
                <div className={`${styles.statBox} ${styles.statBlue}`}>
                  <span className={styles.statIcon}>
                    <IconReceipt width={16} height={16} />
                  </span>
                  <div>
                    <strong>8</strong>
                    <span>Open orders</span>
                  </div>
                </div>
                <div className={`${styles.statBox} ${styles.statAmber}`}>
                  <span className={styles.statIcon}>
                    <IconStar width={16} height={16} />
                  </span>
                  <div>
                    <strong>4.9</strong>
                    <span>Rating</span>
                  </div>
                </div>
              </div>

              <div className={styles.previewRows}>
                {NOTIFICATIONS.map((item) => (
                  <div
                    key={item.title}
                    className={`${styles.previewRow} ${styles[`notify${item.tone.charAt(0).toUpperCase() + item.tone.slice(1)}`]}`}
                  >
                    <span className={styles.notifyDot} aria-hidden="true" />
                    <div className={styles.rowIcon}>
                      <item.Icon width={16} height={16} />
                    </div>
                    <div className={styles.rowText}>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <TickerPills />

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>
              Made for shop owners,{" "}
              <span className={styles.headlineAccent}>not spreadsheets</span>
            </h2>
            <p>
              Whether you bake dog treats at home or run a corner pet store,
              Pawlio gives you the tools to sell — without the corporate fuss.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <article key={feature.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <feature.Icon width={22} height={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>From signup to first sale</h2>
            <p>
              A straightforward onboarding path — we review every store so pet
              parents know they can trust who they buy from.
            </p>
          </div>
          <div className={styles.steps}>
            {STEPS.map((step) => (
              <article key={step.num} className={styles.stepCard}>
                <div className={styles.stepNum}>{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            <Image
              src="/pawlio-logo.png"
              alt=""
              width={32}
              height={32}
              className={styles.footerLogo}
              aria-hidden
            />
            <p>© {new Date().getFullYear()} Pawlio. Built with care for pet vendors.</p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/register">Become a vendor</Link>
            <Link href="/login">Sign in</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
