import { NextRequest, NextResponse } from "next/server";
import { cases, capacityOverlay, type CaseRecord } from "@/lib/session-store";

// Each patient routed to a facility adds this many utilization points to the live overlay.
const CAPACITY_INCREMENT = 10;

// POST /api/notify — stores completed case record and updates live capacity overlay
export async function POST(req: NextRequest) {
  const payload = await req.json();

  if (payload.session_id) {
    const priority = payload.priority ?? "P3";
    // P1 → patient still routed immediately to ambulance/ER (Call-999 UI),
    //      but doctor gets an EMERGENCY_FOLLOWUP queue to optionally review/override.
    // P2 → mandatory human-in-the-loop: patient waits for doctor review.
    // P3 → routine: auto-approved.
    const isEmergency  = priority === "P1";
    const reviewStatus =
        priority === "P1" ? "EMERGENCY_FOLLOWUP"
      : priority === "P2" ? "PENDING_REVIEW"
      :                     "AUTO_APPROVED";

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
      pain_score:         typeof payload.pain_score === "number" ? payload.pain_score : undefined,
      pain_location:      typeof payload.pain_location === "string" ? payload.pain_location : undefined,
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
