"use client";

import dynamic from "next/dynamic";
import { SkeletonBlock } from "@/components/ui";
import type { MapPoint } from "@/lib/mapTypes";

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full flex-col gap-3 rounded-3xl border border-mist-200 bg-mist-50 p-4">
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="h-full w-full" />
    </div>
  ),
});

export function MapView(props: {
  points: MapPoint[];
  center: [number, number];
  zoom?: number;
  height?: string;
  userLocation?: { lat: number; lng: number } | null;
  heatMode?: boolean;
  pickMode?: boolean;
  onPick?: (lat: number, lng: number) => void;
  focusPointId?: number | null;
}) {
  return <MapCanvas {...props} />;
}
