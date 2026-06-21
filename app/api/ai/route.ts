import { NextResponse } from 'next/server';
import type { AIRequest } from '@/lib/types';

/**
 * Proxy to Anthropic Claude Sonnet streaming API.
 * Expects a JSON body: { prompt: string, context: { ... } }
 */
export async function POST(req: Request) {
  const { prompt, context } = (await req.json()) as AIRequest;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 400 });
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      stream: true,
      system: 'You are AIRGRID AI, environmental intelligence assistant for Delhi Municipal Corporation. Generate authoritative, data-driven environmental reports for senior government officials. Use precise scientific language. Be concise. Always reference the data provided.',
      messages: [{ role: 'user', content: `${prompt}\n${JSON.stringify(context)}` }],
    }),
  });

  if (!anthropicRes.body) {
    return NextResponse.json({ error: 'No response body from Anthropic' }, { status: 502 });
  }

  // Forward the streaming response directly
  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body!.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Anthropic streams newline‑delimited JSON. Relay as‑is.
          controller.enqueue(value);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
