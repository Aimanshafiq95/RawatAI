import { NextResponse } from "next/server";
import { cases, capacityOverlay, surgeEvents } from "@/lib/session-store";

// Names for pre-seeded facilities that may not have case records yet
const SEED_NAMES: Record<string, string> = {
  "7a5f5dbb-337d-4605-b1c4-4d2e8fbc520b": "Hospital Kuala Lumpur",
  "27dda5ae-2447-4fa8-ac40-94c864c9953a": "Hospital Kajang",
  "89c7fa53-3f77-4251-89ad-022f56d4e68e": "Institut Perubatan Respiratori",
};

const SURGE_THRESHOLD = 85;

export async function GET() {
  const allCases = Array.from(cases.values()).sort((a, b) => b.created_at - a.created_at);

  // Build facility name lookup from live case records
  const facilityNames: Record<string, string> = { ...SEED_NAMES };
  for (const c of allCases) {
    if (c.facility_id && c.facility_name) facilityNames[c.facility_id] = c.facility_name;
  }

  // Build capacity snapshot
  const capacitySnapshot = Array.from(capacityOverlay.entries()).map(([id, delta]) => {
    const name        = facilityNames[id] ?? "Unknown Facility";
    const seedUtil    = id === "7a5f5dbb-337d-4605-b1c4-4d2e8fbc520b" ? 71.71
                      : id === "27dda5ae-2447-4fa8-ac40-94c864c9953a" ? 77.78
                      : id === "89c7fa53-3f77-4251-89ad-022f56d4e68e" ? 60
                      : 50;
    const adjustedUtil = Math.min(seedUtil + delta, 100);
    const status       = adjustedUtil >= 90 ? "CRITICAL"
                       : adjustedUtil >= SURGE_THRESHOLD ? "SURGE"
                       : adjustedUtil >= 70 ? "ELEVATED"
                       : "NORMAL";
    return { id, name, delta, adjusted_util: Math.round(adjustedUtil), status };
  }).sort((a, b) => b.adjusted_util - a.adjusted_util);

  return NextResponse.json({
    cases:             allCases,
    surge_events:      surgeEvents.slice(0, 20),
    capacity_snapshot: capacitySnapshot,
    stats: {
      total:  allCases.length,
      p1:     allCases.filter(c => c.priority === "P1").length,
      p2:     allCases.filter(c => c.priority === "P2").length,
      p3:     allCases.filter(c => c.priority === "P3").length,
      surges: surgeEvents.length,
    },
  });
}
