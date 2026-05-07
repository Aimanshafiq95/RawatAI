import { NextResponse } from "next/server";
import { cases } from "@/lib/session-store";

// GET /api/cases/[id]/status — patient polls this to discover when doctor review completes.
// Returns the subset of fields the patient page needs.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const c = cases.get(id);
  if (!c) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({
    session_id:        c.session_id,
    review_status:     c.review_status,
    reviewed_by:       c.reviewed_by,
    reviewed_at:       c.reviewed_at,
    review_notes:      c.review_notes,
    is_emergency:      c.is_emergency,
    overridden:        c.overridden ?? false,
    // Effective values after override (what the patient should see)
    priority:          c.override_priority   ?? c.priority,
    department:        c.override_department ?? c.doctor_specialty,
    doctor_name:       c.override_doctor     ?? c.doctor_name,
    // Original AI values (for "was X → now Y" comparison)
    ai_priority:       c.priority,
    ai_department:     c.doctor_specialty,
    ai_doctor:         c.doctor_name,
    differentials:     c.differentials,
  });
}
