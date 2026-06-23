import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zoneId, name } = body;
    
    // Mock generating a PDF report
    console.log(`Generating report for ${name} (${zoneId})`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Report generated successfully.",
      downloadUrl: `/data/dummy_report_${zoneId}.pdf` 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}
