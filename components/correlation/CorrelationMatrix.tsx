"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";

export function CorrelationMatrix({ data, labels }: { data: number[][], labels: string[] }) {
  // Simple heatmap implementation
  const getColor = (val: number) => {
    // scale from gov-gold to critical-red for high correlation
    // or just use varying opacity of navy. Let's use a standard blue scale.
    // 1.0 = deep blue, 0.0 = white
    const alpha = Math.max(0, val);
    return `rgba(26, 58, 92, ${alpha})`;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pearson Correlation Matrix</CardTitle>
        <ChartExportActions chartId="correlation-heatmap" data={[]} filenamePrefix="correlation_matrix" />
      </CardHeader>
      <CardContent>
        <div id="correlation-heatmap" className="w-full overflow-auto text-sm bg-white p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border"></th>
                {labels.map((l) => (
                  <th key={l} className="p-2 border font-semibold text-slate-700">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={labels[i]}>
                  <th className="p-2 border font-semibold text-slate-700 text-left">{labels[i]}</th>
                  {row.map((val, j) => (
                    <td 
                      key={`${i}-${j}`} 
                      className="p-2 border text-center font-mono"
                      style={{ 
                        backgroundColor: getColor(val),
                        color: val > 0.5 ? 'white' : 'black'
                      }}
                    >
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
