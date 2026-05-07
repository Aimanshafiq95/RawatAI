import { NextRequest, NextResponse } from "next/server";
import { findStaff } from "@/lib/demo-users";

// Legacy alias — redirects to the unified /api/staff/auth shape.
// Keeps any old client code working while we transition.
export async function POST(req: NextRequest) {
  const { staffId, password } = await req.json();
  const staff = findStaff(staffId, password);
  if (!staff || staff.role !== "ADMIN") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const { password: _, ...safe } = staff;
  return NextResponse.json({ admin: safe, staff: safe });
}
