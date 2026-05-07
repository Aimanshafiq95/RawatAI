import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { image_base64, symptoms } = await req.json();
    if (!image_base64) return NextResponse.json({ findings: null });

    const response = await groq.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a medical image analyst. Analyze this image and return ONLY JSON:
Patient reported: ${symptoms}
{"findings":"what you observe","severity_hint":"mild|moderate|severe","conditions_identified":["condition1"]}`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image_base64}` },
            },
          ],
        },
      ],
      temperature: 0,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { findings: raw, severity_hint: "unknown", conditions_identified: [] };
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ findings: null, error: err.message });
  }
}
