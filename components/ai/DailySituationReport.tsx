"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Plane } from "lucide-react";

export function DailySituationReport() {
  const [report, setReport]       = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const hasFetched = useRef(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchReport() {
      try {
        const response = await fetch("/api/ai/report");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/plain")) throw new Error("Not plain text");

        if (!response.body) throw new Error("No body");
        const reader  = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          setReport(prev => prev + decoder.decode(value));
        }
      } catch (e) {
        setReport("Failed to generate report. Please try again later.");
      } finally {
        setIsStreaming(false);
      }
    }

    fetchReport();
  }, []);

  const handleDownloadPDF = async () => {
    if (isDownloading || isStreaming || !report || !printRef.current) return;
    setIsDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const el = printRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 794,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let yOffset = 0;

      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, imgW, imgH);
        yOffset += pageH;
      }

      pdf.save("AirGrid_GRAP_Report.pdf");
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Hidden printable template */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
        <div 
          ref={printRef} 
          style={{ 
            width: "794px", 
            minHeight: "1123px", 
            background: "#ffffff", 
            padding: 0,
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#1C2B3A",
            position: "relative"
          }}
        >
          {/* Header */}
          <div style={{ background: "#0D1B2A", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(15,139,141,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plane size={18} color="white" />
              </div>
              <div style={{ color: "white", fontWeight: 700, fontSize: "16px", letterSpacing: "0.06em" }}>
                AIRGRID OS
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontFamily: "monospace" }}>
              AI INTELLIGENCE REPORT
            </div>
          </div>
          
          {/* Title Area */}
          <div style={{ padding: "40px 40px 20px" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.2em", color: "#0F8B8D", textTransform: "uppercase", marginBottom: "8px" }}>
              Delhi Municipal Corporation
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0D1B2A", margin: "0 0 16px", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
              GRAP Report
            </h1>
            <div style={{ display: "flex", gap: "24px", fontSize: "12px", color: "#4A5568", fontFamily: "monospace", borderBottom: "2px solid #E2E8F0", paddingBottom: "20px" }}>
              <div><strong>DATE:</strong> {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div><strong>TIME:</strong> {new Date().toLocaleTimeString('en-IN')}</div>
              <div><strong>SYSTEM:</strong> AirGrid AI Engine</div>
            </div>
          </div>

          {/* Content Body */}
          <div style={{ padding: "0 40px 40px", fontSize: "13px", lineHeight: 1.8, color: "#2D3748" }}>
            {report.split('\n').map((line, idx) => {
              if (line.includes('% %')) return null;
              
              const trimmed = line.trim();
              if (!trimmed) return <div key={idx} style={{ height: "12px" }}></div>;
              
              const isHeading = trimmed.length > 2 && trimmed === trimmed.toUpperCase();
              
              if (isHeading) {
                return (
                  <div key={idx} style={{ fontWeight: 800, color: "#0D1B2A", fontSize: "15px", marginTop: "24px", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                    {trimmed}
                  </div>
                );
              }
              
              if (trimmed.startsWith('-')) {
                return (
                  <div key={idx} style={{ marginLeft: "16px", marginBottom: "6px", display: "flex", gap: "8px" }}>
                     <span style={{ color: "#0F8B8D", fontWeight: "bold" }}>•</span>
                     <span>{trimmed.substring(1).trim()}</span>
                  </div>
                );
              }
              
              return <div key={idx} style={{ marginBottom: "8px" }}>{trimmed}</div>;
            })}
          </div>

          {/* Footer */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#F8FAFF", borderTop: "1px solid #E2E8F0", padding: "16px 40px", fontSize: "10px", color: "#8A9BB0", display: "flex", justifyContent: "space-between", fontFamily: "monospace" }}>
            <span>CONFIDENTIAL — FOR OFFICIAL USE ONLY</span>
            <span>Generated automatically by Google Gemini</span>
          </div>
        </div>
      </div>
    <Card className="shadow-sm border-slate-200 overflow-hidden rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-slate-100 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
            <FileText className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <CardTitle className="text-lg font-semibold text-slate-800">Situation Report</CardTitle>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isStreaming || isDownloading || !report}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? "Downloading..." : "Download PDF"}
        </button>
      </CardHeader>
      <CardContent className="p-6 bg-white">
        <div className="prose prose-slate prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
          {report || (isStreaming ? "Gathering intelligence..." : "")}
          {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-[var(--accent)] animate-pulse" />}
        </div>
      </CardContent>
    </Card>
    </>
  );
}

