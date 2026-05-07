import { NextRequest, NextResponse } from "next/server";
import { findUser } from "@/lib/demo-users";

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json();
  const user = findUser(phone, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const { password: _, ...safeUser } = user as any;
  return NextResponse.json({ user: safeUser });
}
