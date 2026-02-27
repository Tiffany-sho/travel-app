"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

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

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function MapPanel({ destination, departure, spots }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Initialize map once script loads
  useEffect(() => {
    if (!mapsLoaded || !containerRef.current || mapRef.current) return;
    const google = (window as any).google;

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: { lat: 35.6762, lng: 139.6503 },
      zoom: 10,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    infoWindowRef.current = new google.maps.InfoWindow();

    // Center map on the trip destination
    new google.maps.Geocoder().geocode(
      { address: destination },
      (results: any, status: string) => {
        if (status === "OK" && results?.[0] && mapRef.current) {
          mapRef.current.setCenter(results[0].geometry.location);
          mapRef.current.setZoom(12);
        }
      }
    );
  }, [mapsLoaded, destination]);

  // Update markers when spots or departure change
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;
    let cancelled = false;
    const google = (window as any).google;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    type PlaceItem = { name: string; label: string; color: string; isDeparture: boolean };
    const items: PlaceItem[] = [];

    if (departure && departure.location !== "未定") {
      items.push({
        name: departure.location,
        label: `出発: ${departure.location}`,
        color: "#4f46e5",
        isDeparture: true,
      });
    }
    spots.forEach((s) =>
      items.push({
        name: s.name,
        label: s.name,
        color: DOT_COLORS[s.category] ?? "#9ca3af",
        isDeparture: false,
      })
    );

    if (items.length === 0) return () => { cancelled = true; };

    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    let done = 0;

    items.forEach(({ name, label, color, isDeparture }) => {
      geocoder.geocode({ address: name }, (results: any, status: string) => {
        if (cancelled) return;
        done++;

        if (status === "OK" && results?.[0] && mapRef.current) {
          const pos = results[0].geometry.location;
          bounds.extend(pos);

          const marker = new google.maps.Marker({
            position: pos,
            map: mapRef.current,
            title: name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: isDeparture ? 10 : 8,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          marker.addListener("click", () => {
            infoWindowRef.current?.setContent(
              `<div style="font-size:13px;font-weight:600;padding:4px 2px;white-space:nowrap">${label}</div>`
            );
            infoWindowRef.current?.open(mapRef.current, marker);
          });

          markersRef.current.push(marker);
        }

        if (done === items.length && !cancelled) {
          if (markersRef.current.length === 1) {
            mapRef.current?.setCenter(markersRef.current[0].getPosition());
            mapRef.current?.setZoom(14);
          } else if (markersRef.current.length > 1) {
            mapRef.current?.fitBounds(bounds, 60);
          }
        }
      });
    });

    return () => { cancelled = true; };
  }, [mapsLoaded, departure, spots]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 text-center p-6">
        <div>
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">地図を表示するには</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2 leading-relaxed">
            .env.local に<br />
            <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded font-mono text-xs">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>
            <br />
            を設定してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`}
        strategy="afterInteractive"
        onLoad={() => setMapsLoaded(true)}
      />
      <div ref={containerRef} className="w-full h-full" />
      {!mapsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <p className="text-gray-400 dark:text-gray-500 text-sm">地図を読み込み中...</p>
        </div>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
