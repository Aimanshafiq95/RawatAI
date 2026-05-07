import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystem(lang: "en" | "bm") {
  const isBM = lang === "bm";
  return `You are an experienced Malaysian public healthcare emergency triage doctor.
Assess the patient and return ONLY valid JSON — no explanation, no markdown.
${isBM ? "Respond with summary, recommended_action and key_symptoms IN BAHASA MALAYSIA." : ""}

Priority levels — be clinically strict:
- P1 (Emergency): Life-threatening — chest pain, difficulty breathing, stroke signs, severe bleeding,
  unconsciousness, high fever >40°C, fever with stiff neck/rash, convulsions, sepsis signs,
  severe abdominal pain, persistent vomiting >24h, fever in infant under 3 months
- P2 (Urgent): Needs hospital TODAY — fever >38.5°C lasting MORE than 2 days,
  fever >39°C at any duration, moderate injury, suspected fracture, worsening chronic condition
  (e.g. diabetic with high blood sugar, hypertensive with headache), dehydration, persistent cough >1 week
- P3 (Non-urgent): Klinik Kesihatan — fever <38.5°C for ≤2 days with no red flags,
  mild cough/cold, minor rash, routine follow-up

PAIN SCORING (Numeric Rating Scale 0–10) — applied when a pain score is provided:
- 8–10 (severe): minimum P2. If pain location is chest, abdomen, head, or back → P1.
- 4–7  (moderate): P2 minimum for chest, abdominal, cardiac, or trauma-related complaints.
- 1–3  (mild): does not change priority on its own.
- 0    (no pain): no effect.
Treat the pain score as a hard floor — never assign a priority lower than what the pain rule allows.
When the pain score elevates priority, set "pain_severity_factor" to "elevates" and reflect this in reasoning_steps.

RULES:
- Duration matters: ANY fever lasting more than 2 days must be at least P2
- Pre-existing conditions RAISE urgency: hypertension + fever = P2 minimum; diabetes + fever = P2 minimum
- When in doubt between two levels, choose the higher urgency
- estimated_wait_minutes: P1 → 0–10, P2 → 15–30, P3 → 40–60

JSON format (ONLY this, no extra text):
{
  "priority": "P1",
  "summary": "1-2 sentence clinical summary${isBM ? " dalam Bahasa Malaysia" : ""}",
  "predicted_disease": "Most likely diagnosis, e.g. Dengue Fever${isBM ? " dalam Bahasa Malaysia" : ""}",
  "department": "Hospital department e.g. Infectious Disease, Cardiology, General Medicine",
  "key_symptoms": ["symptom1", "symptom2"],
  "requires_icu": false,
  "estimated_wait_minutes": 20,
  "pain_severity_factor": "elevates|neutral",
  "reasoning_steps": ["step1", "step2", "step3"]
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      symptoms,
      history,
      vision_findings,
      session_id,
      lang = "en",
      pain_score,
      pain_location,
    } = body;

    const contextParts: string[] = [`Patient symptoms: ${symptoms}`];
    if (vision_findings)                  contextParts.push(`Image analysis: ${vision_findings}`);
    if (history?.allergies?.length)       contextParts.push(`Allergies: ${history.allergies.join(", ")}`);
    if (history?.chronic_conditions?.length) contextParts.push(`Chronic conditions: ${history.chronic_conditions.join(", ")}`);
    if (history?.current_medications?.length) contextParts.push(`Medications: ${history.current_medications.join(", ")}`);
    if (history?.recent_diagnoses?.length) contextParts.push(`Recent diagnoses: ${history.recent_diagnoses.join(", ")}`);

    if (typeof pain_score === "number" && pain_score > 0) {
      const loc = pain_location ? ` at ${pain_location}` : "";
      contextParts.push(`Pain score (NRS 0–10): ${pain_score}/10${loc}`);
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: buildSystem(lang as "en" | "bm") },
        { role: "user",   content: contextParts.join("\n") },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);
    return NextResponse.json({ ...result, session_id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
