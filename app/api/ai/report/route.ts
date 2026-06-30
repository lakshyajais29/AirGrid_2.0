import { NextResponse } from "next/server";
import { getClient, getCityContext, MODEL } from "@/lib/gemini";

export async function GET() {
  try {
    const client = getClient();
    const cityContext = getCityContext();

    const prompt = `You are AIRGRID AI, the environmental intelligence assistant for the Delhi Municipal Corporation.
Generate an authoritative, data-driven daily situation report for senior government officials.
Structure it strictly in the official Delhi GRAP (Graded Response Action Plan) format.
Make it highly legible using distinct sections and bullet points.

Structure your response exactly as follows (keep it crisp, no rambling):

GRAP STAGE [I/II/III/IV]: [Category]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AQI SUMMARY
• [Crisp bullet point about overall AQI]
• [Crisp bullet point about dominant pollutants]

HOTSPOT IDENTIFICATION
• [Ward Name] - [Pollutant & Value] - [Brief reason]
• [Ward Name] - [Pollutant & Value] - [Brief reason]

METEOROLOGICAL OUTLOOK
• [Brief weather impact on dispersion]

Do not output markdown headers (like ##), just use the exact text format above. Use ALL CAPS for key metrics.

Current city context (active alerts and sensor readings):
${cityContext}`;

    const stream = await client.chat.stream({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const content = chunk.data.choices[0]?.delta?.content;
            if (typeof content === "string") controller.enqueue(encoder.encode(content));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Mistral Report Error:", error);
    return new NextResponse("Error generating report.", { status: 500 });
  }
}
