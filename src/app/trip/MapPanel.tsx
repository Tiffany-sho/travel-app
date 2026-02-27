"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

type Departure = {
  location: string;
  datetime: string;
  datetimeUndecided: boolean;
};

type Spot = {
  id: string;
  name: string;
  category: string;
  memo: string;
  visitDate: string;
  visitTime: string;
};

type Props = {
  destination: string;
  departure: Departure | null;
  spots: Spot[];
};

const DOT_COLORS: Record<string, string> = {
  観光: "#38bdf8",
  グルメ: "#fb923c",
  ショッピング: "#f472b6",
  宿泊: "#c084fc",
  その他: "#9ca3af",
};

async function nominatimGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept-Language": "ja,en" } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function MapPanel({ destination, departure, spots }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const LRef = useRef<any>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Leaflet マップを初期化（クライアントサイドのみ）
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import("leaflet").then((mod) => {
      const L = mod.default;
      LRef.current = L;

      const map = L.map(containerRef.current!, {
        center: [35.6762, 139.6503],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setLeafletLoaded(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      LRef.current = null;
    };
  }, []);

  // 旅行先にマップを中心合わせ
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    nominatimGeocode(destination).then((coord) => {
      if (coord && mapRef.current) {
        mapRef.current.setView([coord.lat, coord.lng], 11);
      }
    });
  }, [leafletLoaded, destination]);

  // スポット・出発地が変わったらマーカーを更新
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !LRef.current) return;
    let cancelled = false;
    const L = LRef.current;

    // 既存マーカーを削除
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    type PlaceItem = { name: string; label: string; color: string; radius: number };
    const items: PlaceItem[] = [];

    if (departure && departure.location !== "未定") {
      items.push({
        name: departure.location,
        label: `出発: ${departure.location}`,
        color: "#4f46e5",
        radius: 10,
      });
    }
    spots.forEach((s) =>
      items.push({
        name: s.name,
        label: s.name,
        color: DOT_COLORS[s.category] ?? "#9ca3af",
        radius: 8,
      })
    );

    if (items.length === 0) return () => { cancelled = true; };

    const geocodeAll = items.map(async ({ name, label, color, radius }) => {
      const coord = await nominatimGeocode(name);
      if (cancelled || !coord || !mapRef.current) return null;

      const marker = L.circleMarker([coord.lat, coord.lng], {
        radius,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        fillOpacity: 1,
      })
        .bindPopup(`<b style="font-size:13px;white-space:nowrap">${label}</b>`)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
      return coord;
    });

    Promise.all(geocodeAll).then((coords) => {
      if (cancelled || !mapRef.current) return;
      const valid = coords.filter((c): c is { lat: number; lng: number } => c !== null);
      if (valid.length === 0) return;

      if (valid.length === 1) {
        mapRef.current.setView([valid[0].lat, valid[0].lng], 14);
      } else {
        const bounds = L.latLngBounds(valid.map((c) => [c.lat, c.lng] as [number, number]));
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => { cancelled = true; };
  }, [leafletLoaded, departure, spots]);

  return (
    <div className="relative h-full w-full bg-gray-100 dark:bg-gray-800">
      <div ref={containerRef} className="w-full h-full" />
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">地図を読み込み中...</p>
        </div>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
