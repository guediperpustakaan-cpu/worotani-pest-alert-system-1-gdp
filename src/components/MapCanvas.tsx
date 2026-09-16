"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Link from "next/link";
import { Bug, Crosshair, MapPin, User } from "lucide-react";
import { SEVERITY_COLOR, SEVERITY_RADIUS, type MapPoint } from "@/lib/mapTypes";
import { SeverityBadge, StatusBadge } from "@/components/ui";

type Props = {
  points: MapPoint[];
  center: [number, number];
  zoom?: number;
  height?: string;
  userLocation?: { lat: number; lng: number } | null;
  heatMode?: boolean;
  pickMode?: boolean;
  onPick?: (lat: number, lng: number) => void;
  focusPointId?: number | null;
};

function createIcon(color: string, active: boolean) {
  const size = active ? 42 : 32;
  return L.divIcon({
    className: "",
    html: `<div class="woro-marker" style="background:${color};width:${size}px;height:${size}px"><span style="filter:drop-shadow(0 1px 1px rgba(0,0,0,.35))">🐛</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, active ? -20 : -14],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:9999px;background:#2563eb;border:4px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.85 });
  }, [center, map, zoom]);
  return null;
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function MapCanvas({
  points,
  center,
  zoom = 11,
  height = "h-[70vh]",
  userLocation,
  heatMode = false,
  pickMode = false,
  onPick,
  focusPointId = null,
}: Props) {
  return (
    <div
      className={`map-touch relative w-full overflow-hidden rounded-3xl border border-mist-200 ${height}`}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <Recenter center={center} zoom={zoom} />

        {heatMode
          ? points.map((point) => (
              <Circle
                key={`heat-${point.id}`}
                center={[point.lat, point.lng]}
                radius={SEVERITY_RADIUS[point.severity] ?? 800}
                pathOptions={{
                  color: SEVERITY_COLOR[point.severity] ?? "#f5a300",
                  weight: 1,
                  fillColor: SEVERITY_COLOR[point.severity] ?? "#f5a300",
                  fillOpacity: 0.38,
                }}
              />
            ))
          : null}

        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={createIcon(
              SEVERITY_COLOR[point.severity] ?? "#f5a300",
              focusPointId === point.id,
            )}
          >
            <Popup>
              <div className="space-y-2">
                <p className="text-base font-extrabold text-leaf-900">
                  {point.pestName}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <SeverityBadge level={point.severity} />
                  <StatusBadge status={point.status} />
                </div>
                <p className="flex items-center gap-1.5 text-sm text-mist-500">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {point.regionName ?? "Lokasi tidak diketahui"}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-mist-500">
                  <User className="h-4 w-4" aria-hidden />
                  {point.reporterName} · {point.createdAtLabel}
                </p>
                {point.distanceLabel ? (
                  <p className="text-sm font-bold text-leaf-700">
                    Jarak: {point.distanceLabel}
                  </p>
                ) : null}
                {point.note ? (
                  <p className="text-sm text-mist-500">{point.note}</p>
                ) : null}
                <Link
                  href={`/wiki/${point.pestId}`}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-leaf-600 px-3 py-2 text-sm font-bold text-white"
                >
                  <Bug className="h-4 w-4" aria-hidden />
                  Panduan Penanganan
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation ? (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <p className="text-sm font-bold text-leaf-900">Lokasi Anda</p>
            </Popup>
          </Marker>
        ) : null}

        {pickMode && onPick ? <ClickCatcher onPick={onPick} /> : null}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-2xl bg-white/95 px-3 py-2 text-xs font-bold text-leaf-800 shadow">
        <span className="mr-3 inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#dc2626]" /> Tinggi
        </span>
        <span className="mr-3 inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#f5a300]" /> Sedang
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#3f9445]" /> Rendah
        </span>
      </div>

      {pickMode ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex items-center gap-2 rounded-2xl bg-leaf-900/90 px-4 py-3 text-sm font-bold text-white shadow-lg">
          <Crosshair className="h-5 w-5" aria-hidden />
          Ketuk peta untuk menandai titik serangan
        </div>
      ) : null}
    </div>
  );
}
