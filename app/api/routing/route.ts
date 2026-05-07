import { NextRequest, NextResponse } from "next/server";
import { getNearbyFacilities } from "@/lib/routing";
import { capacityOverlay } from "@/lib/session-store";

export async function POST(req: NextRequest) {
  try {
    const { lat, lon, priority, requires_icu, exclude_facility_id } = await req.json();
    if (!lat || !lon) return NextResponse.json({ error: "Location required" }, { status: 400 });

    let results = getNearbyFacilities(
      parseFloat(lat),
      parseFloat(lon),
      priority ?? "P3",
      requires_icu ?? false
    );

    // Apply live capacity overlay — facilities where patients were recently accepted are busier
    results = results.map((f) => {
      const delta = capacityOverlay.get(f.id) ?? 0;
      if (delta === 0) return f;
      const adjustedUtil = Math.min((f.util_nonicu ?? 50) + delta, 100);
      const capacityStatus =
        adjustedUtil >= 90 ? "CRITICAL" :
        adjustedUtil >= 75 ? "BUSY" :
        adjustedUtil >= 60 ? "MODERATE" : "NORMAL";
      return { ...f, util_nonicu: adjustedUtil, capacity_status: capacityStatus };
    });

    // Re-sort after overlay adjustments
    results = results.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

    // Exclude a specific facility (used by redirect action)
    if (exclude_facility_id) {
      results = results.filter((f) => f.id !== exclude_facility_id);
    }

    return NextResponse.json({
      recommended: results[0] ?? null,
      alternatives: results.slice(1),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
