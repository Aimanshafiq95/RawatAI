import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// Lazy-init so Next.js build-time route collection doesn't require the API key.
let _groq: Groq | undefined;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

export async function POST(req: NextRequest) {
  try {
    const { symptoms, lang = "en", history } = await req.json();
    const isBM = lang === "bm";

    const recentCtx = history?.recent_diagnoses?.length
      ? `Recent diagnoses: ${history.recent_diagnoses.join(", ")}.`
      : "";
    const chronicCtx = history?.chronic_conditions?.length
      ? `Chronic conditions: ${history.chronic_conditions.join(", ")}.`
      : "";

    const system = `You are a clinical triage assistant. Based on the patient's reported symptoms, generate exactly 2 to 3 targeted follow-up questions to clarify severity and urgency.

Rules:
- Maximum 3 questions. Minimum 2.
- Each question must have 3–5 short answer options.
- Questions must be in plain, friendly language${isBM ? " in Bahasa Malaysia" : " in English"}.
- Options must be short (max 6 words each).
- If the patient has recent diagnoses, consider whether this could be a relapse.
- Prioritise questions that distinguish between P1 (emergency), P2 (urgent), P3 (non-urgent).
- Do NOT ask about symptoms already reported — only clarifying details.

${recentCtx} ${chronicCtx}

Respond ONLY with valid JSON, no explanation:
{
  "questions": [
    { "text": "Question text here?", "options": ["Option A", "Option B", "Option C"] }
  ]
}`;

    const response = await getGroq().chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Patient symptoms: ${Array.isArray(symptoms) ? symptoms.join(", ") : symptoms}` },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [];
    return NextResponse.json({ questions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
