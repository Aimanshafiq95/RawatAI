import { NextRequest, NextResponse } from "next/server";
import { cases, auditLog, type AuditEntry } from "@/lib/session-store";

// POST /api/doctor/review/[id] — doctor confirms or overrides AI assessment.
// One endpoint covers both: empty body = confirm, body with overrides = override.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = cases.get(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    doctor_name      = "Unknown Doctor",
    doctor_staff_id  = "",
    override_priority,
    override_department,
    override_doctor,
    override_notes,
  } = body;

  // Determine if any actual override happened (any field provided != AI value)
  const hasOverride =
       (override_priority   && override_priority   !== existing.priority)
    || (override_department && override_department !== existing.doctor_specialty)
    || (override_doctor     && override_doctor     !== existing.doctor_name);

  const now = Date.now();
  const updated = {
    ...existing,
    review_status: "REVIEWED" as const,
    reviewed_by:   doctor_name,
    reviewed_at:   now,
    review_notes:  override_notes ?? existing.review_notes,
    ...(hasOverride ? {
      overridden:          true,
      override_priority:   override_priority   ?? existing.override_priority,
      override_department: override_department ?? existing.override_department,
      override_doctor:     override_doctor     ?? existing.override_doctor,
      override_notes:      override_notes      ?? existing.override_notes,
      overridden_at:       now,
    } : {}),
  };
  cases.set(id, updated);

  // Append to audit log
  const entry: AuditEntry = {
    id:               `aud-${now}-${Math.random().toString(36).slice(2, 8)}`,
    case_session_id:  existing.session_id,
    patient_name:     existing.patient_name,
    doctor_name,
    doctor_staff_id,
    action:           hasOverride ? "OVERRIDDEN" : "CONFIRMED",
    ai_priority:      existing.priority,
    new_priority:     hasOverride ? (override_priority ?? existing.priority) : undefined,
    ai_department:    existing.doctor_specialty,
    new_department:   hasOverride ? (override_department ?? existing.doctor_specialty) : undefined,
    ai_doctor:        existing.doctor_name,
    new_doctor:       hasOverride ? (override_doctor ?? existing.doctor_name) : undefined,
    notes:            override_notes,
    timestamp:        now,
  };
  auditLog.unshift(entry);
  // Cap at 200 entries to keep memory bounded
  if (auditLog.length > 200) auditLog.length = 200;

  return NextResponse.json({ ok: true, case: updated, audit: entry });
}
