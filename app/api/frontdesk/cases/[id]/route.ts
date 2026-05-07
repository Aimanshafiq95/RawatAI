import { NextRequest, NextResponse } from "next/server";
import { cases, type CheckinStatus } from "@/lib/session-store";

const VALID_STATUSES: CheckinStatus[] = ["PENDING", "ARRIVED", "IN_TREATMENT", "DISCHARGED"];

// PATCH /api/frontdesk/cases/[id] — front desk updates check-in status
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
  const status = body.checkin_status as CheckinStatus | undefined;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid checkin_status" }, { status: 400 });
  }

  const updated = {
    ...existing,
    checkin_status:     status,
    checkin_updated_at: Date.now(),
    checkin_updated_by: body.staff_name ?? existing.checkin_updated_by,
  };

  cases.set(id, updated);
  return NextResponse.json({ ok: true, case: updated });
}
