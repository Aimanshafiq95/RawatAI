import { NextRequest, NextResponse } from "next/server";
import { cases, capacityOverlay, type CaseRecord } from "@/lib/session-store";

// Each patient routed to a facility adds this many utilization points to the live overlay.
const CAPACITY_INCREMENT = 10;

// POST /api/notify — stores completed case record and updates live capacity overlay
export async function POST(req: NextRequest) {
  const payload = await req.json();

  if (payload.session_id) {
    const record: CaseRecord = {
      session_id:       payload.session_id,
      patient_name:     payload.patient_name ?? "Anonymous",
      priority:         payload.priority ?? "P3",
      summary:          payload.summary ?? "",
      symptoms:         payload.symptoms ?? "",
      facility_id:      payload.facility_id ?? "",
      facility_name:    payload.facility_name ?? "",
      doctor_name:      payload.doctor_name ?? "",
      doctor_specialty: payload.doctor_specialty ?? "",
      created_at:       Date.now(),
    };
    cases.set(payload.session_id, record);

    // Increment live capacity overlay so subsequent patients see the real load increase
    if (payload.facility_id) {
      const current = capacityOverlay.get(payload.facility_id) ?? 0;
      capacityOverlay.set(payload.facility_id, current + CAPACITY_INCREMENT);
    }
  }

  return NextResponse.json({ ok: true });
}
