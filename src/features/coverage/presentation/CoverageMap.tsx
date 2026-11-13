"use client";

import { useEffect, useRef, useState } from "react";

import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./coverage.module.css";

type CoverageMapProps = {
  lat: number;
  lng: number;
  radiusMeters: number;
  onPick: (lat: number, lng: number) => void;
};

type GoogleMapsNamespace = {
  maps: {
    Map: new (
      el: HTMLElement,
      opts: { center: { lat: number; lng: number }; zoom: number },
    ) => {
      addListener: (event: string, handler: (e: { latLng: { lat: () => number; lng: () => number } | null }) => void) => void;
      setCenter: (c: { lat: number; lng: number }) => void;
    };
    Marker: new (opts: {
      map: unknown;
      position: { lat: number; lng: number };
      draggable: boolean;
    }) => {
      setPosition: (p: { lat: number; lng: number }) => void;
      addListener: (event: string, handler: () => void) => void;
      getPosition: () => { lat: () => number; lng: () => number } | null;
    };
    Circle: new (opts: {
      map: unknown;
      center: { lat: number; lng: number };
      radius: number;
      fillOpacity: number;
      strokeWeight: number;
    }) => {
      setCenter: (c: { lat: number; lng: number }) => void;
      setRadius: (r: number) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
    __tpMapsReady?: () => void;
  }
}

function getMapsKey(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || !key.trim()) return null;
  return key.trim();
}

function loadMapsScript(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>("script[data-tp-maps]");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("maps_load_failed")));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.dataset.tpMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("maps_load_failed"));
    document.head.appendChild(script);
  });
}

export function CoverageMap({ lat, lng, radiusMeters, onPick }: CoverageMapProps) {
  const strings = useStrings();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<{
    map: InstanceType<GoogleMapsNamespace["maps"]["Map"]>;
    marker: InstanceType<GoogleMapsNamespace["maps"]["Marker"]>;
    circle: InstanceType<GoogleMapsNamespace["maps"]["Circle"]>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const key = getMapsKey();
      if (!key) {
        setError(strings.coverage.mapsKeyMissing);
        return;
      }

      void (async () => {
        try {
          await loadMapsScript(key);
          if (cancelled || !containerRef.current || !window.google?.maps) return;

          const center = { lat, lng };
          const map = new window.google.maps.Map(containerRef.current, {
            center,
            zoom: 12,
          });
          const marker = new window.google.maps.Marker({
            map,
            position: center,
            draggable: true,
          });
          const circle = new window.google.maps.Circle({
            map,
            center,
            radius: radiusMeters,
            fillOpacity: 0.15,
            strokeWeight: 1,
          });

          map.addListener("click", (e) => {
            const pos = e.latLng;
            if (!pos) return;
            onPick(pos.lat(), pos.lng());
          });
          marker.addListener("dragend", () => {
            const pos = marker.getPosition();
            if (!pos) return;
            onPick(pos.lat(), pos.lng());
          });

          mapRef.current = { map, marker, circle };
          setError(null);
        } catch {
          if (!cancelled) setError(strings.coverage.mapsLoadError);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Mount once; position updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only load
  }, [strings.coverage.mapsKeyMissing, strings.coverage.mapsLoadError]);

  useEffect(() => {
    const refs = mapRef.current;
    if (!refs) return;
    const center = { lat, lng };
    refs.map.setCenter(center);
    refs.marker.setPosition(center);
    refs.circle.setCenter(center);
    refs.circle.setRadius(radiusMeters);
  }, [lat, lng, radiusMeters]);

  if (error) {
    return (
      <div className={styles.mapFallback} role="status">
        <p className={styles.hint}>{error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className={styles.mapFrame} role="application" />;
}
