"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, TerminalSquare } from "lucide-react";

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
    <Card className="shadow-sm border-slate-200 overflow-hidden rounded-xl flex flex-col flex-1">
      <CardHeader className="flex flex-row items-center gap-3 bg-white border-b border-slate-100 py-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <TerminalSquare className="w-5 h-5 text-indigo-600" />
        </div>
        <CardTitle className="text-lg font-semibold text-slate-800">Officer Query Terminal</CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-white space-y-4 flex flex-col flex-1">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI (e.g. 'Why did PM2.5 rise today?')"
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            disabled={isStreaming}
          />
          <Button type="submit" disabled={isStreaming || !query.trim()} className="w-24 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
            {isStreaming ? "Thinking..." : <><Search className="w-4 h-4 mr-1"/> Ask</>}
          </Button>
        </form>

        {response && (
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg mt-4 flex-1">
            <p className="text-sm whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
              {response}
              {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-indigo-600 animate-pulse" />}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

