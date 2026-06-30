import { NextResponse } from "next/server";
import { getClient, getCityContext, MODEL } from "@/lib/gemini";

export async function GET() {
  try {
    const client = getClient();
    const cityContext = getCityContext();

    const prompt = `You are AIRGRID AI. Based on the current city context, identify the single most critical anomaly.
Return ONLY a valid JSON object with exactly these fields:
- "title": A short alarming title (e.g. "Anomaly Detected: PM2.5 Spike at Anand Vihar")
- "analysis": 1-2 sentences explaining what is happening
- "evidence": 1-2 sentences citing the data evidence

Output ONLY valid JSON. No markdown, no explanation, no code blocks.

City Context:
${cityContext}`;

    const response = await client.chat.complete({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" },
    });

    const text = response.choices?.[0]?.message?.content as string;
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Mistral Anomaly Error:", error);
    return NextResponse.json(
      {
        title: "System Unavailable",
        analysis: "Unable to run anomaly detection at this time.",
        evidence: "API connection failed.",
      },
      { status: 500 }
    );
  }
}
