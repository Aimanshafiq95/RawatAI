import { NextResponse } from "next/server";
import { auditLog } from "@/lib/session-store";

// GET /api/audit — append-only audit log of doctor confirmations + overrides
export async function GET() {
  return NextResponse.json({ entries: auditLog.slice(0, 100) });
}
