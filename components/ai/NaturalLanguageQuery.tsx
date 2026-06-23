"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function NaturalLanguageQuery() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsStreaming(true);
    setResponse("");

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setResponse((prev) => prev + decoder.decode(value));
      }
    } catch (error) {
      console.error("Query failed", error);
      setResponse("An error occurred while consulting the intelligence module.");
    } finally {
      setIsStreaming(false);
      setQuery("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Officer Query Terminal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AIRGRID AI (e.g. 'Why did PM2.5 rise yesterday?')"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[var(--navy)] focus:ring-1 focus:ring-[var(--navy)]"
            disabled={isStreaming}
          />
          <Button type="submit" disabled={isStreaming || !query.trim()} className="w-24">
            {isStreaming ? "Thinking..." : <><Search className="w-4 h-4 mr-1"/> Ask</>}
          </Button>
        </form>

        {response && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
            <p className="text-sm whitespace-pre-wrap font-sans text-slate-800">
              {response}
              {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-[var(--navy)] animate-pulse" />}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
