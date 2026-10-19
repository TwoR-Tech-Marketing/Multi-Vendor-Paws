"use client";

import Link from "next/link";

import { Routes } from "@/constants/routes";
import { PawlioLogo } from "@/shared/components/PawlioLogo";
import {
  usePreferences,
  useStrings,
} from "@/shared/preferences/PreferencesContext";

import styles from "./landing.module.css";

const PLATES = {
  wall: "/assets/plates/wall.png",
  pavement: "/assets/plates/pavement.png",
  doorStore: "/assets/plates/door-store.png",
  doorClinic: "/assets/plates/door-clinic.png",
  doorGroomer: "/assets/plates/door-groomer.png",
  step1Card: "/assets/plates/step1-card.png",
  step2Palette: "/assets/plates/step2-palette.png",
  step3Sign: "/assets/plates/step3-sign.png",
} as const;

function Arrow() {
  return (
    <svg viewBox="0 0 60 24" aria-hidden="true">
      <path
        d="M2 12h50M42 4l14 8-14 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingClient() {
  const strings = useStrings();
  const { locale, setLocale } = usePreferences();
  const copy = strings.landing;
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <main className={styles.page}>
      <img
        className={`${styles.box} ${styles.wallPatch} ${styles.plate}`}
        src={PLATES.wall}
        alt=""
      />
      <div className={`${styles.box} ${styles.plinth}`} />
      <img
        className={`${styles.box} ${styles.pavement} ${styles.plate}`}
        src={PLATES.pavement}
        alt=""
      />
      <Link
        href={`${Routes.auth.register}?type=store`}
        className={`${styles.box} ${styles.doorStore}`}
        tabIndex={-1}
        aria-hidden
      >
        <img className={styles.plate} src={PLATES.doorStore} alt="" />
      </Link>
      <Link
        href={`${Routes.auth.register}?type=clinic`}
        className={`${styles.box} ${styles.doorClinic}`}
        tabIndex={-1}
        aria-hidden
      >
        <img className={styles.plate} src={PLATES.doorClinic} alt="" />
      </Link>
      <Link
        href={`${Routes.auth.register}?type=groomer`}
        className={`${styles.box} ${styles.doorGroomer}`}
        tabIndex={-1}
        aria-hidden
      >
        <img className={styles.plate} src={PLATES.doorGroomer} alt="" />
      </Link>
      <img
        className={`${styles.box} ${styles.step1Card} ${styles.plate}`}
        src={PLATES.step1Card}
        alt=""
      />
      <img
        className={`${styles.box} ${styles.step2Palette} ${styles.plate}`}
        src={PLATES.step2Palette}
        alt=""
      />
      <img
        className={`${styles.box} ${styles.step3Sign} ${styles.plate}`}
        src={PLATES.step3Sign}
        alt=""
      />

      <Link href={Routes.home} className={`${styles.box} ${styles.logo}`}>
        <PawlioLogo size={40} priority />
        <span className={styles.brandName}>{copy.brand}</span>
      </Link>

      <nav className={`${styles.box} ${styles.navLinks}`}>
        <a href="#store">{copy.navStores}</a>
        <a href="#clinic">{copy.navClinics}</a>
        <a href="#groomer">{copy.navGroomers}</a>
      </nav>

      <div className={`${styles.box} ${styles.navUtility}`}>
        <button
          type="button"
          className={styles.langSwitch}
          onClick={() => setLocale(nextLocale)}
        >
          {locale === "ar" ? copy.languageSwitchToEnglish : copy.languageSwitch}
        </button>
        <Link href={Routes.auth.login} className={styles.navSignIn}>
          {copy.signIn}
        </Link>
      </div>

      <h1 className={`${styles.box} ${styles.headline}`}>{copy.headline}</h1>
      <p className={`${styles.box} ${styles.headlinePair}`}>{copy.headlinePair}</p>
      <p className={`${styles.box} ${styles.lead}`}>{copy.lead}</p>

      <Link href={Routes.auth.register} className={`${styles.box} ${styles.btnJoin}`}>
        {copy.join}
      </Link>
      <Link href={Routes.auth.login} className={`${styles.box} ${styles.btnSignIn}`}>
        {copy.signIn}
      </Link>

      <Link
        id="store"
        href={`${Routes.auth.register}?type=store`}
        className={`${styles.box} ${styles.sign} ${styles.signStore} ${styles.shopfront}`}
      >
        <p className={styles.signTitle}>{copy.storeTitle}</p>
        <p className={styles.signSub}>{copy.storeSub}</p>
        <p className={styles.signCta}>{copy.openShop}</p>
      </Link>
      <Link
        id="clinic"
        href={`${Routes.auth.register}?type=clinic`}
        className={`${styles.box} ${styles.sign} ${styles.signClinic} ${styles.shopfront}`}
      >
        <p className={styles.signTitle}>{copy.clinicTitle}</p>
        <p className={styles.signSub}>{copy.clinicSub}</p>
        <p className={styles.signCta}>{copy.openShop}</p>
      </Link>
      <Link
        id="groomer"
        href={`${Routes.auth.register}?type=groomer`}
        className={`${styles.box} ${styles.sign} ${styles.signGroomer} ${styles.shopfront}`}
      >
        <p className={styles.signTitle}>{copy.groomerTitle}</p>
        <p className={styles.signSub}>{copy.groomerSub}</p>
        <p className={styles.signCta}>{copy.openShop}</p>
      </Link>

      <h2 className={`${styles.box} ${styles.howHeading}`}>{copy.howHeading}</h2>
      <p className={`${styles.box} ${styles.step1Label}`}>{copy.step1Label}</p>
      <p className={`${styles.box} ${styles.step1Caption}`}>{copy.step1Caption}</p>
      <div className={`${styles.box} ${styles.arrow}`}>
        <Arrow />
      </div>
      <p className={`${styles.box} ${styles.step2Title}`}>{copy.step2Title}</p>
      <p className={`${styles.box} ${styles.step2Caption}`}>{copy.step2Caption}</p>
      <div className={`${styles.box} ${styles.arrowTwo}`}>
        <Arrow />
      </div>
      <p className={`${styles.box} ${styles.step3Title}`}>{copy.step3Title}</p>
      <p className={`${styles.box} ${styles.step3Caption}`}>{copy.step3Caption}</p>
    </main>
  );
}
