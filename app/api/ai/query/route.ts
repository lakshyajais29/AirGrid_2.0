import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query } = await req.json();
  const encoder = new TextEncoder();
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Mock response based on query
  const responseText = `Regarding your query: "${query}"\n\n` +
    `Based on the latest data models, the correlation between flight volumes and PM2.5 in Dwarka shows an r-value of 0.65. ` +
    `The recent spike is primarily attributed to a combination of temperature inversion and increased APU (Auxiliary Power Unit) usage at Terminal 3. ` +
    `I recommend prioritizing the electrification of ground support equipment to mitigate this localized impact.`;

  const stream = new ReadableStream({
    async start(controller) {
      const words = responseText.split(' ');
      for (const word of words) {
        controller.enqueue(encoder.encode(word + ' '));
        await delay(30 + Math.random() * 40);
      }
      controller.close();
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
