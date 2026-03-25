import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/ai/generate";
import { generateInputSchema } from "@/lib/ai/schema";
import { calculateGST } from "@/lib/gst";
import { rateLimit } from "@/lib/rate-limit";
import type { InvoiceOutput } from "@/lib/ai/schema";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests/minute per IP
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();

    // Validate input
    const parseResult = generateInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Generate document via AI
    const { data, provider } = await generateDocument(
      input,
      body.business_name,
      body.gstin
    );

    // Post-process: Apply proper GST calculation using real state codes
    const sellerStateCode = (body.state_code as string | undefined) || "";
    const clientStateCode = (body.client_state_code as string | undefined) || "";

    // Determine inter-state: only if both state codes are provided and differ
    const isInterState =
      sellerStateCode.length >= 2 &&
      clientStateCode.length >= 2 &&
      sellerStateCode.substring(0, 2) !== clientStateCode.substring(0, 2);

    const gstBreakdown = calculateGST(data.subtotal, isInterState);

    // Override AI's GST with accurate calculation
    const correctedData = {
      ...data,
      gst_rate: gstBreakdown.gstRate,
      gst_amount: gstBreakdown.totalGst,
      cgst_amount: gstBreakdown.cgst,
      sgst_amount: gstBreakdown.sgst,
      igst_amount: gstBreakdown.igst,
      total: gstBreakdown.grandTotal,
    };

    // For invoices, recalculate balance_due
    if (input.document_type === "invoice") {
      const invoiceData = correctedData as InvoiceOutput;
      (correctedData as InvoiceOutput).balance_due =
        gstBreakdown.grandTotal - (invoiceData.advance_paid || 0);
    }

    return NextResponse.json({
      success: true,
      data: correctedData,
      provider,
      document_type: input.document_type,
      service_category: input.service_category,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate document. Please try again." },
      { status: 500 }
    );
  }
}
