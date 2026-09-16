export type MapPoint = {
  id: number;
  lat: number;
  lng: number;
  pestId: number;
  pestName: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "VERIFIED" | "REJECTED";
  note: string;
  photoUrl: string;
  reporterName: string;
  regionName: string | null;
  createdAtLabel: string;
  distanceLabel?: string;
};

export const SEVERITY_COLOR: Record<string, string> = {
  LOW: "#3f9445",
  MEDIUM: "#f5a300",
  HIGH: "#dc2626",
};

export const SEVERITY_RADIUS: Record<string, number> = {
  LOW: 450,
  MEDIUM: 900,
  HIGH: 1800,
};
