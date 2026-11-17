"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, Hand, Lock, RotateCcw } from "lucide-react";
import type { RadiusEstimate } from "@/lib/simulasi";
import { getMapTileConfig, type GeoPoint } from "@/lib/simulasi-visual";

export type MapClickTarget = "observer" | "epicenter";

interface LeafletMapCanvasProps {
  epicenter: GeoPoint;
  observer: GeoPoint;
  radiusFeltIII: RadiusEstimate;
  radiusDamagingVI: RadiusEstimate;
  clickTarget: MapClickTarget;
  onEpicenterMove: (point: GeoPoint) => void;
  onObserverMove: (point: GeoPoint) => void;
}

function createEpicenterIcon(): L.DivIcon {
  return L.divIcon({
    className: "sigap-map-divicon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12" fill="#FFFDFB" stroke="#1A1613" stroke-width="2.5"/>
        <circle cx="14" cy="14" r="5" fill="#1A1613"/>
      </svg>
    </span>`,
  });
}

function createObserverIcon(): L.DivIcon {
  return L.divIcon({
    className: "sigap-map-divicon",
    iconSize: [30, 34],
    iconAnchor: [15, 30],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:34px;" aria-hidden="true">
      <svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 2C8.373 2 3 7.373 3 14C3 22.75 15 32 15 32C15 32 27 22.75 27 14C27 7.373 21.627 2 15 2Z" fill="#1A1613" stroke="#FFFDFB" stroke-width="2.5"/>
        <circle cx="15" cy="14" r="4.5" fill="#FFFDFB"/>
      </svg>
    </span>`,
  });
}

export default function LeafletMapCanvas({
  epicenter,
  observer,
  radiusFeltIII,
  radiusDamagingVI,
  clickTarget,
  onEpicenterMove,
  onObserverMove,
}: LeafletMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const epicenterMarkerRef = useRef<L.Marker | null>(null);
  const observerMarkerRef = useRef<L.Marker | null>(null);

  const clickTargetRef = useRef<MapClickTarget>(clickTarget);
  clickTargetRef.current = clickTarget;
  const onEpicenterMoveRef = useRef(onEpicenterMove);
  onEpicenterMoveRef.current = onEpicenterMove;
  const onObserverMoveRef = useRef(onObserverMove);
  onObserverMoveRef.current = onObserverMove;

  const [tileFailed, setTileFailed] = useState(false);
  const [tileLoadedOnce, setTileLoadedOnce] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchMapUnlocked, setTouchMapUnlocked] = useState(false);

  const tileConfig = useMemo(() => getMapTileConfig(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarseMedia = window.matchMedia?.("(pointer: coarse)");
    const detectTouch = () => {
      const hasCoarse = Boolean(coarseMedia?.matches);
      const isNarrow = window.innerWidth < 1024;
      setIsTouchDevice(hasCoarse || isNarrow);
    };
    detectTouch();
    window.addEventListener("resize", detectTouch);
    return () => window.removeEventListener("resize", detectTouch);
  }, []);

  // Inisialisasi instance Leaflet satu kali per mount.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [epicenter.lat, epicenter.lon],
      zoom: 7,
      minZoom: 2,
      maxZoom: 16,
      scrollWheelZoom: false,
      keyboard: true,
      attributionControl: false,
      zoomControl: true,
    });

    // Atribusi OSM dipasang eksplisit dengan kontras sesuai DESIGN.md
    const attributionControl = L.control.attribution({ prefix: false });
    attributionControl.addAttribution(tileConfig.attributionHtml);
    attributionControl.addTo(map);

    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 18,
      crossOrigin: "anonymous",
    });

    let failedTilesCount = 0;
    tileLayer.on("tileload", () => {
      failedTilesCount = 0;
      setTileLoadedOnce(true);
      setTileFailed(false);
    });
    tileLayer.on("tileerror", () => {
      failedTilesCount += 1;
      if (failedTilesCount >= 2 || !tileLoadedOnce) {
        setTileFailed(true);
      }
    });
    tileLayer.addTo(map);

    const circlesGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = circlesGroup;

    const epicMarker = L.marker([epicenter.lat, epicenter.lon], {
      draggable: true,
      keyboard: true,
      icon: createEpicenterIcon(),
      title: "Pusat gempa (geser untuk mengubah)",
      alt: "Penanda pusat gempa",
    }).addTo(map);
    epicMarker.bindTooltip("Pusat gempa", { direction: "top", offset: [0, -14] });
    epicMarker.on("dragend", () => {
      const pos = epicMarker.getLatLng();
      onEpicenterMoveRef.current({ lat: pos.lat, lon: pos.lng });
    });
    epicenterMarkerRef.current = epicMarker;

    const obsMarker = L.marker([observer.lat, observer.lon], {
      draggable: true,
      keyboard: true,
      icon: createObserverIcon(),
      title: "Lokasi Anda (geser atau pakai tombol arah)",
      alt: "Penanda lokasi Anda",
    }).addTo(map);
    obsMarker.bindTooltip("Anda", { direction: "top", offset: [0, -28] });
    obsMarker.on("dragend", () => {
      const pos = obsMarker.getLatLng();
      onObserverMoveRef.current({ lat: pos.lat, lon: pos.lng });
    });
    observerMarkerRef.current = obsMarker;

    map.on("click", (ev: L.LeafletMouseEvent) => {
      const point: GeoPoint = { lat: ev.latlng.lat, lon: ev.latlng.lng };
      if (clickTargetRef.current === "epicenter") {
        onEpicenterMoveRef.current(point);
      } else {
        onObserverMoveRef.current(point);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersGroupRef.current = null;
      epicenterMarkerRef.current = null;
      observerMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileConfig.url, tileConfig.attributionHtml]);

  // Jaga agar di layar sentuh peta tidak merebut gulir 1 jari kecuali diaktifkan atau disentuh 2 jari.
  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return;

    const applyDragState = (enabled: boolean) => {
      if (enabled) {
        map.dragging.enable();
        map.touchZoom.enable();
      } else {
        map.dragging.disable();
        map.touchZoom.disable();
      }
    };

    const shouldEnableTouchMap = !isTouchDevice || touchMapUnlocked;
    applyDragState(shouldEnableTouchMap);

    const handleTouchStart = (e: TouchEvent) => {
      if (!isTouchDevice || touchMapUnlocked) return;
      if (e.touches.length >= 2) {
        applyDragState(true);
      } else {
        applyDragState(false);
      }
    };

    const handleTouchEnd = () => {
      if (!isTouchDevice || touchMapUnlocked) return;
      applyDragState(false);
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isTouchDevice, touchMapUnlocked]);

  const fitMapToContent = (animate: boolean) => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = L.latLngBounds([
      [epicenter.lat, epicenter.lon],
      [observer.lat, observer.lon],
    ]);

    layersGroupRef.current?.eachLayer((layer) => {
      if (layer instanceof L.Circle) {
        bounds.extend(layer.getBounds());
      }
    });

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    map.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: 11,
      animate: animate && !reducedMotion,
    });
  };

  // Sinkronisasi marker, lingkaran dampak netral, dan fitBounds otomatis.
  useEffect(() => {
    const map = mapRef.current;
    const circlesGroup = layersGroupRef.current;
    const epicMarker = epicenterMarkerRef.current;
    const obsMarker = observerMarkerRef.current;
    if (!map || !circlesGroup || !epicMarker || !obsMarker) return;

    epicMarker.setLatLng([epicenter.lat, epicenter.lon]);
    obsMarker.setLatLng([observer.lat, observer.lon]);
    circlesGroup.clearLayers();

    const drawRadiusCircle = (
      estimate: RadiusEstimate,
      variant: "felt" | "damaging"
    ) => {
      if (
        estimate.status === "out_of_mag_calibration" ||
        estimate.status === "not_reached"
      ) {
        return;
      }

      const isBeyond300 = estimate.status === "beyond_300";
      const radiusMeters = isBeyond300
        ? 300_000
        : estimate.radiusKm !== null && estimate.radiusKm > 0
          ? estimate.radiusKm * 1000
          : 0;

      if (radiusMeters <= 0) return;

      L.circle([epicenter.lat, epicenter.lon], {
        radius: radiusMeters,
        color: "#1A1613",
        weight: variant === "damaging" ? 2 : 1.5,
        opacity: isBeyond300 ? 0.55 : variant === "damaging" ? 0.85 : 0.6,
        fillColor: "#1A1613",
        fillOpacity: isBeyond300 ? 0.04 : variant === "damaging" ? 0.14 : 0.06,
        dashArray: isBeyond300 ? "8 6" : undefined,
        interactive: false,
      }).addTo(circlesGroup);
    };

    // Urutan: lingkaran luar (terasa >= III) lalu lingkaran dalam (merusak ringan >= VI)
    drawRadiusCircle(radiusFeltIII, "felt");
    drawRadiusCircle(radiusDamagingVI, "damaging");

    fitMapToContent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    epicenter.lat,
    epicenter.lon,
    observer.lat,
    observer.lon,
    radiusFeltIII.status,
    radiusFeltIII.radiusKm,
    radiusDamagingVI.status,
    radiusDamagingVI.radiusKm,
  ]);

  return (
    <div className="space-y-2.5">
      {tileFailed && (
        <div
          role="alert"
          className="rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-warning-strong)] px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-[var(--color-warning-strong)]"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="font-semibold">Peta tidak dapat dimuat</p>
            <p>
              Lapisan tile peta gagal dimuat atau perangkat sedang luring. Penanda, lingkaran estimasi, serta ringkasan teks jarak dan radius di bawah peta tetap akurat dan dapat digunakan.
            </p>
          </div>
        </div>
      )}

      <div className="relative isolate rounded-[20px] overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]">
        <div
          ref={containerRef}
          role="region"
          aria-label="Peta interaktif dampak gempa"
          style={{
            touchAction: isTouchDevice && !touchMapUnlocked ? "pan-y" : "none",
          }}
          className="w-full h-[320px] sm:h-[380px] z-0"
        />

        {/* Kontrol tampilan peta & kunci gulir sentuh */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => fitMapToContent(true)}
            aria-label="Sesuaikan tampilan agar pusat gempa, Anda, dan lingkaran terlihat"
            className="inline-flex items-center gap-1.5 min-h-[44px] rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Paskan peta</span>
          </button>

          {isTouchDevice && (
            <button
              type="button"
              aria-pressed={touchMapUnlocked}
              onClick={() => setTouchMapUnlocked((prev) => !prev)}
              className="inline-flex items-center gap-1.5 min-h-[44px] whitespace-nowrap rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors duration-150"
            >
              {touchMapUnlocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Kunci gulir</span>
                </>
              ) : (
                <>
                  <Hand className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Geser peta</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Catatan atribusi & panduan sentuh yang selalu terlihat & aksesibel */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
        <span>
          Sumber peta dasar:{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-[var(--color-text-primary)] font-medium"
          >
            © OpenStreetMap contributors
          </a>
        </span>
        {isTouchDevice && !touchMapUnlocked && (
          <span>
            Gunakan dua jari atau tombol &ldquo;Geser peta&rdquo; untuk menggeser peta.
          </span>
        )}
      </div>
    </div>
  );
}
