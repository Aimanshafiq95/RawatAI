import { NextRequest, NextResponse } from "next/server";
import { findStaff } from "@/lib/demo-users";

export async function POST(req: NextRequest) {
  const { staffId, password } = await req.json();
  const staff = findStaff(staffId, password);
  if (!staff) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const { password: _, ...safe } = staff;
  return NextResponse.json({ staff: safe });
}
