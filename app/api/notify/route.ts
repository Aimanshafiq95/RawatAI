import { NextRequest, NextResponse } from "next/server";
import { cases, type CaseRecord } from "@/lib/session-store";

// POST /api/notify — stores completed case record (no SSE needed — assignment is autonomous)
export async function POST(req: NextRequest) {
  const payload = await req.json();

  if (payload.session_id) {
    const record: CaseRecord = {
      session_id:      payload.session_id,
      patient_name:    payload.patient_name ?? "Anonymous",
      priority:        payload.priority ?? "P3",
      summary:         payload.summary ?? "",
      symptoms:        payload.symptoms ?? "",
      facility_name:   payload.facility_name ?? "",
      doctor_name:     payload.doctor_name ?? "",
      doctor_specialty: payload.doctor_specialty ?? "",
      created_at:      Date.now(),
    };
    cases.set(payload.session_id, record);
  }

  return NextResponse.json({ ok: true });
}
