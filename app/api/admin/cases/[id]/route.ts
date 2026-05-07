import { NextRequest, NextResponse } from "next/server";
import { cases } from "@/lib/session-store";

// PATCH /api/admin/cases/[id] — doctor overrides AI triage decision
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = cases.get(id);

  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const body = await req.json();

  const updated = {
    ...existing,
    overridden:          true,
    override_department: body.override_department ?? existing.override_department,
    override_doctor:     body.override_doctor     ?? existing.override_doctor,
    override_priority:   body.override_priority   ?? existing.override_priority,
    override_notes:      body.override_notes      ?? existing.override_notes,
    overridden_at:       Date.now(),
  };

  cases.set(id, updated);
  return NextResponse.json({ ok: true, case: updated });
}
