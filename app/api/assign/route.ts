import { NextRequest, NextResponse } from "next/server";
import { getRequiredSpecialty, assignDoctor } from "@/lib/doctors";

// POST /api/assign — Assignment Agent
// Given triage result + recommended facility, autonomously assigns the best doctor
export async function POST(req: NextRequest) {
  try {
    const { priority, key_symptoms, requires_icu, lat, lon, facility_state } = await req.json();

    if (!lat || !lon) {
      return NextResponse.json({ error: "Location required" }, { status: 400 });
    }

    const specialty = getRequiredSpecialty(
      priority ?? "P3",
      key_symptoms ?? [],
      requires_icu ?? false
    );

    const doctor = assignDoctor(
      parseFloat(lat),
      parseFloat(lon),
      specialty,
      facility_state ?? undefined
    );

    // Simulate a response time based on priority
    const estimated_response_minutes =
      priority === "P1" ? Math.floor(Math.random() * 3) + 1 :
      priority === "P2" ? Math.floor(Math.random() * 10) + 5 :
      Math.floor(Math.random() * 20) + 10;

    return NextResponse.json({
      doctor,
      specialty,
      estimated_response_minutes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
