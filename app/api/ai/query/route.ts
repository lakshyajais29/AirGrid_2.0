import { NextResponse } from "next/server";
import { getClient, getCityContext, MODEL } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const client = getClient();
    const cityContext = getCityContext();

    const prompt = `You are AIRGRID AI, the environmental intelligence assistant for the Delhi Municipal Corporation.
Answer the officer's query clearly and concisely based on the current data.
Use professional, authoritative language. Plain text only — no markdown headers or bold.

Current city context (active alerts and sensor readings):
${cityContext}

Officer Query: "${query}"`;

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
    console.error("Mistral Query Error:", error);
    return new NextResponse("Error answering query.", { status: 500 });
  }
}
