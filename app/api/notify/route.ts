import { NextRequest, NextResponse } from "next/server";
import { cases, capacityOverlay, type CaseRecord } from "@/lib/session-store";

// Each patient routed to a facility adds this many utilization points to the live overlay.
const CAPACITY_INCREMENT = 10;

// POST /api/notify — stores completed case record and updates live capacity overlay
export async function POST(req: NextRequest) {
  const payload = await req.json();

  if (payload.session_id) {
    const priority = payload.priority ?? "P3";
    // P1 → emergency: bypass review, patient sees Call-999 UI
    // P2 → human-in-the-loop: pause for doctor review before patient sees final
    // P3 → routine: auto-approved
    const isEmergency  = priority === "P1";
    const reviewStatus = priority === "P2" ? "PENDING_REVIEW" : "AUTO_APPROVED";

    const record: CaseRecord = {
      session_id:         payload.session_id,
      patient_name:       payload.patient_name ?? "Anonymous",
      priority,
      summary:            payload.summary ?? "",
      symptoms:           payload.symptoms ?? "",
      facility_id:        payload.facility_id ?? "",
      facility_name:      payload.facility_name ?? "",
      doctor_name:        payload.doctor_name ?? "",
      doctor_specialty:   payload.doctor_specialty ?? "",
      created_at:         Date.now(),
      checkin_status:     "PENDING",
      checkin_updated_at: Date.now(),
      review_status:      reviewStatus,
      is_emergency:       isEmergency,
      differentials:      Array.isArray(payload.differentials) ? payload.differentials : undefined,
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
