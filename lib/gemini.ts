import { Mistral } from "@mistralai/mistralai";
import { mockAlerts } from "@/app/api/alerts/route";

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
  console.warn("[Mistral] MISTRAL_API_KEY is not set — AI features will be disabled.");
}

export const mistral = apiKey ? new Mistral({ apiKey }) : null;

export const getClient = () => {
  if (!mistral) throw new Error("MISTRAL_API_KEY is not configured in .env.local");
  return mistral;
};

export const MODEL = "mistral-small-latest";

export function getCityContext(): string {
  try {
    return JSON.stringify({ alerts: mockAlerts }, null, 2);
  } catch {
    return "No live city data available.";
  }
}
