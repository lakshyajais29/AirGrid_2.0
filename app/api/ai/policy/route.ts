import { NextResponse } from "next/server";
import { getClient, getCityContext, MODEL } from "@/lib/gemini";

export async function GET() {
  try {
    const client = getClient();
    const cityContext = getCityContext();

    const prompt = `You are AIRGRID AI. Based on the current city context, recommend exactly 4 actionable policy interventions.
Return ONLY a valid JSON object with an "actions" array of exactly 4 strings.
Each string must be a crisp bullet point stating WHAT TO DO and WHERE. Bold the key action and location using **double asterisks**.
Example: "**Deploy water sprinklers immediately** at **Anand Vihar** to curb PM10 spike."

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
    console.error("Mistral Policy Error:", error);
    return NextResponse.json(
      { actions: ["AI system unavailable. Proceed with standard GRAP protocols."] },
      { status: 500 }
    );
  }
}
