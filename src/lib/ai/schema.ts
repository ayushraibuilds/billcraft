import { z } from "zod";

// ── Line Item ──
export const lineItemSchema = z.object({
  description: z.string().describe("Professional description of the service"),
  details: z.string().optional().describe("Additional details or specifications"),
  quantity: z.number().default(1),
  rate: z.number().describe("Rate per unit in INR"),
  amount: z.number().describe("Total amount for this line item in INR"),
});

// ── Invoice Output ──
export const invoiceOutputSchema = z.object({
  client_name: z.string().describe("Client's full name"),
  client_company: z.string().optional().describe("Client's company name"),
  client_email: z.string().optional().describe("Client's email if mentioned"),
  client_phone: z.string().optional().describe("Client's phone if mentioned"),
  client_address: z.string().optional().describe("Client's address if mentioned"),
  client_gstin: z.string().optional().describe("Client's GSTIN if mentioned"),
  client_state_code: z.string().optional().describe("Client's state code for GST if mentioned"),
  services: z.array(z.string()).describe("List of high-level services provided"),
  line_items: z.array(lineItemSchema).describe("Detailed line items with amounts"),
  subtotal: z.number().describe("Subtotal before tax in INR"),
  gst_rate: z.number().describe("GST rate as percentage (e.g., 18)"),
  gst_amount: z.number().describe("Total GST amount in INR"),
  cgst_amount: z.number().optional().describe("CGST amount (intra-state)"),
  sgst_amount: z.number().optional().describe("SGST amount (intra-state)"),
  igst_amount: z.number().optional().describe("IGST amount (inter-state)"),
  total: z.number().describe("Total amount including tax in INR"),
  advance_paid: z.number().default(0).describe("Advance already paid in INR"),
  balance_due: z.number().describe("Remaining balance due in INR"),
  payment_terms: z.string().describe("Payment terms (e.g., 'Due on receipt', 'Net 15')"),
  due_date: z.string().optional().describe("Payment due date"),
  notes: z.string().optional().describe("Additional notes for the client"),
  recurring_cadence: z.enum(["weekly", "monthly", "yearly"]).optional(),
  recurring_next_date: z.string().optional(),
});

// ── Proposal Output ──
export const proposalOutputSchema = z.object({
  client_name: z.string().describe("Client's full name"),
  client_company: z.string().optional().describe("Client's company name"),
  client_email: z.string().optional().describe("Client's email if mentioned"),
  client_phone: z.string().optional().describe("Client's phone if mentioned"),
  client_address: z.string().optional().describe("Client's address if mentioned"),
  client_gstin: z.string().optional().describe("Client's GSTIN if mentioned"),
  client_state_code: z.string().optional().describe("Client's state code for GST if mentioned"),
  project_title: z.string().describe("Professional title for the project"),
  professional_intro: z.string().describe("2-3 sentence professional introduction paragraph"),
  scope_description: z.string().describe("Detailed scope of work paragraph"),
  notes: z.string().optional().describe("Additional notes for the client"),
  deliverables: z.array(z.string()).describe("List of specific deliverables"),
  timeline: z.array(
    z.object({
      phase: z.string(),
      duration: z.string(),
      description: z.string(),
    })
  ).describe("Project timeline with phases"),
  line_items: z.array(lineItemSchema).describe("Detailed pricing breakdown"),
  subtotal: z.number().describe("Subtotal in INR"),
  gst_rate: z.number().describe("GST rate as percentage"),
  gst_amount: z.number().describe("Total GST amount in INR"),
  cgst_amount: z.number().optional().describe("CGST amount (intra-state)"),
  sgst_amount: z.number().optional().describe("SGST amount (intra-state)"),
  igst_amount: z.number().optional().describe("IGST amount (inter-state)"),
  total: z.number().describe("Total project cost in INR"),
  payment_terms: z.string().describe("Payment structure (e.g., '50% advance, 50% on delivery')"),
  payment_schedule: z.array(
    z.object({
      milestone: z.string(),
      percentage: z.number(),
      amount: z.number(),
    })
  ).optional().describe("Payment milestone schedule"),
  validity: z.string().default("15 days").describe("Proposal validity period"),
  terms_and_conditions: z.array(z.string()).describe("Key terms and conditions"),
  recurring_cadence: z.enum(["weekly", "monthly", "yearly"]).optional(),
  recurring_next_date: z.string().optional(),
});

// ── Input Schema ──
export const generateInputSchema = z.object({
  input_text: z
    .string()
    .min(10, "Please provide more details about the project")
    .max(5000, "Input is too long"),
  document_type: z.enum(["invoice", "proposal"]),
  service_category: z.enum([
    "designer",
    "developer",
    "consultant",
    "photographer",
    "writer",
  ]),
});

// ── Types ──
export type LineItem = z.infer<typeof lineItemSchema>;
export type InvoiceOutput = z.infer<typeof invoiceOutputSchema>;
export type ProposalOutput = z.infer<typeof proposalOutputSchema>;
export type GenerateInput = z.infer<typeof generateInputSchema>;
export type DocumentOutput = InvoiceOutput | ProposalOutput;
