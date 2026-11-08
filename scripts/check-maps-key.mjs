#!/usr/bin/env node
/**
 * Fails the build when REQUIRE_MAPS_KEY=1 and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 * is missing. No hardcoded key fallback.
 */
const required = process.env.REQUIRE_MAPS_KEY === "1";
if (!required) {
  process.exit(0);
}

const key = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
if (!key) {
  console.error(
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is required when REQUIRE_MAPS_KEY=1. Refusing to build with a missing or hardcoded maps key.",
  );
  process.exit(1);
}
