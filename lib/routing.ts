import facilitiesData from "./facilities.json";

export interface Facility {
  id: string;
  name: string;
  state: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  lat: number;
  lon: number;
  util_nonicu: number | null;
  util_icu: number | null;
  capacity_status: "NORMAL" | "MODERATE" | "BUSY" | "CRITICAL" | "UNKNOWN";
  facility_type: "hospital" | "clinic";
  distance_km?: number;
  score?: number;
  estimated_wait?: number;
}

const facilities = facilitiesData as Facility[];

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateWait(util: number | null, priority?: string): number {
  const base =
    priority === "P1" ? 5 :
    priority === "P2" ? 20 :
    45;
  if (util === null) return base;
  // Scale wait by occupancy on top of priority baseline
  const occupancyFactor =
    util < 60 ? 1.0 :
    util < 75 ? 1.3 :
    util < 90 ? 1.8 :
    2.5;
  return Math.round(base * occupancyFactor);
}

export function getNearbyFacilities(
  lat: number,
  lon: number,
  priority: "P1" | "P2" | "P3",
  requiresIcu = false,
): Facility[] {
  const radius = priority === "P1" ? 9999 : priority === "P2" ? 50 : 20;
  const type = priority === "P3" ? "clinic" : "hospital";

  return facilities
    .filter((f) => f.facility_type === type)
    .map((f) => {
      const dist = haversine(lat, lon, f.lat, f.lon);
      const util = f.util_nonicu ?? 50;
      const normDist = Math.min(dist / Math.max(radius, 1), 1);
      const normUtil = util / 100;
      const score = normDist * 0.4 + normUtil * 0.6;
      return { ...f, distance_km: Math.round(dist * 10) / 10, score, estimated_wait: estimateWait(f.util_nonicu, priority) };
    })
    .filter((f) => {
      if (f.distance_km! > radius) return false;
      if (requiresIcu && f.util_icu !== null && f.util_icu >= 80) return false;
      if (priority !== "P1" && f.capacity_status === "CRITICAL") return false;
      return true;
    })
    .sort((a, b) => a.score! - b.score!)
    .slice(0, 5);
}
