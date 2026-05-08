import { NextRequest, NextResponse } from "next/server";
import { getRequiredSpecialty, assignDoctor } from "@/lib/doctors";
import { cases } from "@/lib/session-store";

// Build a load map: doctor name → number of pending review cases assigned to them.
// Used to load-balance new P1/P2 assignments toward the least-busy doctor.
function buildDoctorLoad(): Map<string, number> {
  const load = new Map<string, number>();
  for (const c of cases.values()) {
    if (c.review_status === "PENDING_REVIEW" || c.review_status === "EMERGENCY_FOLLOWUP") {
      const key = c.override_doctor ?? c.doctor_name;
      load.set(key, (load.get(key) ?? 0) + 1);
    }
  }
  return load;
}

// POST /api/assign — Assignment Agent
// Given triage result + recommended facility, autonomously assigns the best doctor.
// For P1/P2 cases, prefers the least-busy doctor of the matching specialty.
export async function POST(req: NextRequest) {
  try {
    const { priority, key_symptoms, requires_icu, lat, lon, facility_state } = await req.json();

    if (!lat || !lon) {
      return NextResponse.json({ error: "Location required" }, { status: 400 });
    }

    const specialty = getRequiredSpecialty(
      priority ?? "P3",
      key_symptoms ?? [],
      requires_icu ?? false
    );

    // P3 cases skip load balancing — distance-only is fine for routine GP visits.
    const loadMap = priority === "P3" ? undefined : buildDoctorLoad();

    const doctor = assignDoctor(
      parseFloat(lat),
      parseFloat(lon),
      specialty,
      facility_state ?? undefined,
      loadMap,
    );

    // Simulate a response time based on priority
    const estimated_response_minutes =
      priority === "P1" ? Math.floor(Math.random() * 3) + 1 :
      priority === "P2" ? Math.floor(Math.random() * 10) + 5 :
      Math.floor(Math.random() * 20) + 10;

    return NextResponse.json({
      doctor,
      specialty,
      estimated_response_minutes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
