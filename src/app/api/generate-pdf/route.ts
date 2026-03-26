import { NextRequest, NextResponse } from "next/server";
import { generatePDFBuffer } from "@/lib/pdf-generator";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    const isAuthenticated = !!user;

    const rateLimitResponse = rateLimit(request, {
      windowMs: 60 * 60 * 1000,
      maxRequests: isAuthenticated ? 20 : 5,
      prefix: "pdf_gen",
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { pdf_data, business_info, document_number } = body;

    if (!pdf_data || !business_info) {
      return NextResponse.json(
        { error: "Missing required fields: pdf_data, business_info" },
        { status: 400 }
      );
    }

    const buffer = await generatePDFBuffer(pdf_data, business_info);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Document_${document_number || "Invosmith"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 }
    );
  }
}
