"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  FileText,
  Zap,
  Download,
  Loader2,
  Sparkles,
  RotateCcw,
  Palette,
  Code,
  Briefcase,
  Camera,
  PenTool,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceOutput, ProposalOutput } from "@/lib/ai/schema";
import {
  getSettings,
  saveDocument,
  getNextDocumentNumber,
  getMonthlyUsage,
  type SavedDocument,
  type BusinessSettings,
} from "@/lib/store";

const CATEGORIES = [
  { value: "designer", label: "Designer", icon: Palette },
  { value: "developer", label: "Developer", icon: Code },
  { value: "consultant", label: "Consultant", icon: Briefcase },
  { value: "photographer", label: "Photographer", icon: Camera },
  { value: "writer", label: "Writer", icon: PenTool },
] as const;

const EXAMPLE_INPUTS = {
  designer:
    "Ananya ke liye brand identity banaya — logo, business card, letterhead, social media kit. 3 revision rounds, final files in AI + PNG. Total 35k, 15k advance paid.",
  developer:
    "Rohit ke liye e-commerce website — 5 pages, payment gateway integration, admin panel, responsive design. React + Node.js. 80k total, 50% advance.",
  consultant:
    "Priya ki company ke liye digital strategy consultation — 2 workshops, competitor analysis, 3-month roadmap. 60k for the entire project.",
  photographer:
    "Raj ki wedding photography — pre-wedding shoot + 2 day wedding coverage, 500 edited photos, album design. 1.2 lakh total, 50k booking advance.",
  writer:
    "SaaS startup ke liye content — 10 blog posts (1500 words each), 5 landing page copies, SEO optimization. 45k total, monthly retainer.",
};

const FREE_LIMIT = 3;

export default function GeneratePage() {
  const [inputText, setInputText] = useState("");
  const [documentType, setDocumentType] = useState<"invoice" | "proposal">("invoice");
  const [serviceCategory, setServiceCategory] = useState<string>("developer");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    data: InvoiceOutput | ProposalOutput;
    provider: string;
    document_type: string;
    documentNumber: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    setMonthlyUsage(getMonthlyUsage());
  }, []);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("Please describe your project or service");
      return;
    }

    if (monthlyUsage >= FREE_LIMIT) {
      setError(`Free tier limit reached (${FREE_LIMIT}/month). Upgrade to Pro for unlimited.`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_text: inputText,
          document_type: documentType,
          service_category: serviceCategory,
          business_name: settings?.business_name,
          gstin: settings?.gstin,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Generation failed");

      const docNumber = getNextDocumentNumber(documentType);

      // Determine amount
      const amount =
        "balance_due" in data.data
          ? (data.data as InvoiceOutput).balance_due
          : (data.data as ProposalOutput).total;

      // Save to localStorage
      const savedDoc: SavedDocument = {
        id: crypto.randomUUID(),
        type: documentType,
        service_category: serviceCategory,
        input_text: inputText,
        output_json: data.data,
        client_name:
          data.data.client_name || "Unknown Client",
        client_company: data.data.client_company,
        document_number: docNumber,
        amount,
        status: "draft",
        ai_provider: data.provider,
        created_at: new Date().toISOString(),
      };
      saveDocument(savedDoc);
      setMonthlyUsage((p) => p + 1);

      setResult({
        ...data,
        documentNumber: docNumber,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setInputText("");
  };

  const loadExample = () => {
    setInputText(
      EXAMPLE_INPUTS[serviceCategory as keyof typeof EXAMPLE_INPUTS] ||
        EXAMPLE_INPUTS.developer
    );
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!result) return;
    // Use browser print-to-PDF as a simple, dependency-free approach
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const businessName = settings?.business_name || "Your Business";
    const isInvoice = result.document_type === "invoice";
    const data = result.data;

    const lineItemsHTML = data.line_items
      .map(
        (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:500;">${item.description}</div>
          ${item.details ? `<div style="font-size:12px;color:#888;margin-top:2px;">${item.details}</div>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">₹${item.rate.toLocaleString("en-IN")}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:500;">₹${item.amount.toLocaleString("en-IN")}</td>
      </tr>`
      )
      .join("");

    const invoiceData = data as InvoiceOutput;
    const proposalData = data as ProposalOutput;

    const paymentInfo = settings?.bank_name
      ? `<div style="margin-top:24px;padding:16px;background:#f8f8f8;border-radius:8px;font-size:13px;">
          <div style="font-weight:600;margin-bottom:8px;">Payment Details</div>
          ${settings.bank_name ? `<div>Bank: ${settings.bank_name}</div>` : ""}
          ${settings.bank_account_name ? `<div>A/C Name: ${settings.bank_account_name}</div>` : ""}
          ${settings.bank_account_number ? `<div>A/C No: ${settings.bank_account_number}</div>` : ""}
          ${settings.bank_ifsc ? `<div>IFSC: ${settings.bank_ifsc}</div>` : ""}
          ${settings.upi_id ? `<div>UPI: ${settings.upi_id}</div>` : ""}
        </div>`
      : "";

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${result.documentNumber} — ${businessName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color:#222; padding:40px; max-width:800px; margin:0 auto; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; font-size:12px; text-transform:uppercase; color:#888; padding:8px 0; border-bottom:2px solid #222; }
  th:nth-child(2) { text-align:center; }
  th:nth-child(3), th:nth-child(4) { text-align:right; }
  @media print { body { padding:20px; } }
</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #222;">
    <div>
      ${settings?.logo_base64 ? `<img src="${settings.logo_base64}" alt="Logo" style="height:48px;margin-bottom:8px;">` : ""}
      <div style="font-size:20px;font-weight:700;">${businessName}</div>
      ${settings?.address ? `<div style="font-size:12px;color:#666;margin-top:4px;">${settings.address}</div>` : ""}
      ${settings?.gstin ? `<div style="font-size:12px;color:#666;">GSTIN: ${settings.gstin}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div style="font-size:14px;font-weight:600;background:#f5f0e0;color:#854F0B;display:inline-block;padding:4px 12px;border-radius:20px;margin-bottom:8px;">
        ${result.documentNumber}
      </div>
      <div style="font-size:24px;font-weight:700;margin-top:4px;">${isInvoice ? "INVOICE" : "PROPOSAL"}</div>
      <div style="font-size:12px;color:#888;">Date: ${formatDate(new Date())}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
    <div>
      <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:4px;">Bill To</div>
      <div style="font-weight:600;">${data.client_name}</div>
      ${data.client_company ? `<div style="color:#666;">${data.client_company}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:4px;">Payment Terms</div>
      <div>${isInvoice ? invoiceData.payment_terms : proposalData.payment_terms}</div>
    </div>
  </div>

  ${!isInvoice ? `
  <div style="margin-bottom:24px;padding:16px;background:#fafafa;border-radius:8px;">
    <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:8px;">Project</div>
    <div style="font-weight:600;font-size:16px;margin-bottom:8px;">${proposalData.project_title}</div>
    <div style="font-size:14px;color:#444;line-height:1.6;">${proposalData.professional_intro}</div>
  </div>
  <div style="margin-bottom:24px;">
    <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:8px;">Scope of Work</div>
    <div style="font-size:14px;color:#444;line-height:1.6;">${proposalData.scope_description}</div>
  </div>
  <div style="margin-bottom:24px;">
    <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:8px;">Deliverables</div>
    <ul style="padding-left:20px;color:#444;font-size:14px;line-height:1.8;">
      ${proposalData.deliverables.map((d) => `<li>${d}</li>`).join("")}
    </ul>
  </div>
  ` : ""}

  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>${lineItemsHTML}</tbody>
  </table>

  <div style="margin-top:16px;border-top:2px solid #222;padding-top:12px;">
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
      <span>Subtotal</span><span>₹${data.subtotal.toLocaleString("en-IN")}</span>
    </div>
    ${data.cgst_amount && data.sgst_amount ? `
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
      <span>CGST (${data.gst_rate / 2}%)</span><span>₹${data.cgst_amount.toLocaleString("en-IN")}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
      <span>SGST (${data.gst_rate / 2}%)</span><span>₹${data.sgst_amount.toLocaleString("en-IN")}</span>
    </div>` : data.igst_amount ? `
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
      <span>IGST (${data.gst_rate}%)</span><span>₹${data.igst_amount.toLocaleString("en-IN")}</span>
    </div>` : `
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
      <span>GST (${data.gst_rate}%)</span><span>₹${data.gst_amount.toLocaleString("en-IN")}</span>
    </div>`}
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:16px;font-weight:700;border-top:1px solid #ddd;margin-top:4px;">
      <span>Total</span><span>₹${data.total.toLocaleString("en-IN")}</span>
    </div>
    ${isInvoice && invoiceData.advance_paid > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#059669;">
      <span>Advance Paid</span><span>-₹${invoiceData.advance_paid.toLocaleString("en-IN")}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:18px;font-weight:700;background:#f5f0e0;color:#854F0B;border-radius:8px;margin-top:8px;">
      <span>Balance Due</span><span>₹${invoiceData.balance_due.toLocaleString("en-IN")}</span>
    </div>` : ""}
  </div>

  ${paymentInfo}

  ${isInvoice && invoiceData.notes ? `<div style="margin-top:24px;font-size:13px;color:#888;"><strong>Notes:</strong> ${invoiceData.notes}</div>` : ""}

  ${!isInvoice && proposalData.terms_and_conditions?.length ? `
  <div style="margin-top:24px;font-size:12px;color:#888;">
    <div style="font-weight:600;margin-bottom:4px;">Terms & Conditions</div>
    <ol style="padding-left:16px;line-height:1.8;">
      ${proposalData.terms_and_conditions.map((t) => `<li>${t}</li>`).join("")}
    </ol>
    <div style="margin-top:8px;">This proposal is valid for ${proposalData.validity}.</div>
  </div>` : ""}

  <div style="text-align:center;margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#bbb;">
    Generated by BillCraft · billcraft.vercel.app
  </div>
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for images (logo) to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }, [result, settings]);

  const handleCopyJSON = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const remaining = Math.max(0, FREE_LIMIT - monthlyUsage);

  return (
    <main className="min-h-screen bg-dark-900">
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-10">
        {!result ? (
          /* ── Input Form ── */
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-white mb-3">
                Generate your{" "}
                <span className="gradient-text">
                  {documentType === "invoice" ? "invoice" : "proposal"}
                </span>
              </h1>
              <p className="text-gray-400">
                Describe your project in any language — we&apos;ll handle the
                rest
              </p>
            </div>

            {/* Document Type Toggle */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {(["invoice", "proposal"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDocumentType(type)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-sm font-medium transition-all capitalize",
                    documentType === type
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Service Category */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Service Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setServiceCategory(cat.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all",
                      serviceCategory === cat.value
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
                    )}
                  >
                    <cat.icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Description
                </label>
                <button
                  onClick={loadExample}
                  className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Load example →
                </button>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setError(null);
                }}
                placeholder={`Describe your project here...\n\nExample: "Rohit ke liye website banaya — 3 pages, design + dev, 2 rounds revisions, 45k total, 50% advance already paid"`}
                className="w-full h-44 bg-dark-700 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-600">
                  {inputText.length}/5000 characters
                </span>
                {error && (
                  <span className="text-xs text-red-400">{error}</span>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !inputText.trim()}
              className={cn(
                "w-full py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-2 transition-all",
                isGenerating
                  ? "bg-amber-500/20 text-amber-400 cursor-wait"
                  : "btn-primary"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI is generating your {documentType}...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Generate {documentType === "invoice" ? "Invoice" : "Proposal"}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-600 mt-4">
              {remaining > 0
                ? `${remaining} of ${FREE_LIMIT} free documents remaining this month`
                : "Free tier limit reached — upgrade to Pro for unlimited"}
            </p>

            {!settings?.business_name && (
              <div className="mt-6 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                <p className="text-xs text-amber-400/80">
                  💡 <Link href="/settings" className="underline hover:text-amber-300">Add your business details</Link> so they appear on your invoices
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ── Result Preview ── */
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {result.document_type === "invoice"
                    ? "Invoice Preview"
                    : "Proposal Preview"}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full">
                    {result.documentNumber}
                  </span>
                  <span className="text-xs text-gray-500">
                    via{" "}
                    <span className="text-amber-400 capitalize">
                      {result.provider}
                    </span>{" "}
                    AI
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleReset}
                  className="btn-secondary flex items-center gap-2 text-sm !py-2.5 !px-4"
                >
                  <RotateCcw className="w-4 h-4" />
                  New
                </button>
                <button
                  onClick={handleCopyJSON}
                  className="btn-secondary flex items-center gap-2 text-sm !py-2.5 !px-4"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy JSON"}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="btn-primary flex items-center gap-2 text-sm !py-2.5 !px-4"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>

            {/* Preview Card */}
            <div className="glass-card p-8 max-w-3xl mx-auto">
              {result.document_type === "invoice" ? (
                <InvoicePreview
                  data={result.data as InvoiceOutput}
                  settings={settings}
                  documentNumber={result.documentNumber}
                />
              ) : (
                <ProposalPreview
                  data={result.data as ProposalOutput}
                  settings={settings}
                  documentNumber={result.documentNumber}
                />
              )}
            </div>

            {result.provider === "mock" && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-3xl mx-auto">
                <p className="text-sm text-amber-400 text-center">
                  ⚡ This is demo data. Connect your Gemini or Groq API key in{" "}
                  <code className="bg-amber-500/20 px-1.5 py-0.5 rounded text-xs">
                    .env.local
                  </code>{" "}
                  for real AI-powered generation.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* ── Invoice Preview Component ── */
function InvoicePreview({
  data,
  settings,
  documentNumber,
}: {
  data: InvoiceOutput;
  settings: BusinessSettings | null;
  documentNumber: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/10">
        <div>
          {settings?.logo_base64 && (
            <img src={settings.logo_base64} alt="Logo" className="h-10 mb-2 rounded" />
          )}
          <h3 className="text-xl font-bold text-white mb-0.5">
            {settings?.business_name || "Your Business Name"}
          </h3>
          {settings?.address && (
            <p className="text-xs text-gray-500">{settings.address}</p>
          )}
          {settings?.gstin && (
            <p className="text-xs text-gray-500">GSTIN: {settings.gstin}</p>
          )}
        </div>
        <div className="text-right">
          <span className="inline-block bg-amber-500/15 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-2">
            {documentNumber}
          </span>
          <p className="text-2xl font-bold text-white">INVOICE</p>
          <p className="text-xs text-gray-500">{formatDate(new Date())}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
          <p className="text-sm font-semibold text-white">{data.client_name}</p>
          {data.client_company && <p className="text-sm text-gray-400">{data.client_company}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Payment Terms</p>
          <p className="text-sm text-gray-300">{data.payment_terms}</p>
        </div>
      </div>

      <div className="mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Description</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">Qty</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">Rate</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.line_items.map((item, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-3">
                  <p className="text-sm text-white">{item.description}</p>
                  {item.details && <p className="text-xs text-gray-500 mt-0.5">{item.details}</p>}
                </td>
                <td className="text-right text-sm text-gray-400 py-3">{item.quantity}</td>
                <td className="text-right text-sm text-gray-400 py-3">{formatCurrency(item.rate)}</td>
                <td className="text-right text-sm text-white font-medium py-3">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">{formatCurrency(data.subtotal)}</span></div>
        {data.cgst_amount && data.sgst_amount ? (
          <>
            <div className="flex justify-between text-sm"><span className="text-gray-400">CGST ({data.gst_rate / 2}%)</span><span className="text-white">{formatCurrency(data.cgst_amount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">SGST ({data.gst_rate / 2}%)</span><span className="text-white">{formatCurrency(data.sgst_amount)}</span></div>
          </>
        ) : data.igst_amount ? (
          <div className="flex justify-between text-sm"><span className="text-gray-400">IGST ({data.gst_rate}%)</span><span className="text-white">{formatCurrency(data.igst_amount)}</span></div>
        ) : (
          <div className="flex justify-between text-sm"><span className="text-gray-400">GST ({data.gst_rate}%)</span><span className="text-white">{formatCurrency(data.gst_amount)}</span></div>
        )}
        <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2"><span className="text-white">Total</span><span className="text-white">{formatCurrency(data.total)}</span></div>
        {data.advance_paid > 0 && (
          <div className="flex justify-between text-sm"><span className="text-gray-400">Advance Paid</span><span className="text-emerald-500">-{formatCurrency(data.advance_paid)}</span></div>
        )}
        <div className="flex justify-between text-base font-bold bg-amber-500/10 rounded-xl px-4 py-3 mt-2">
          <span className="text-white">Balance Due</span>
          <span className="text-amber-400">{formatCurrency(data.balance_due)}</span>
        </div>
      </div>

      {/* Payment Info */}
      {settings?.bank_name && (
        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Payment Details</p>
          <div className="text-sm text-gray-400 space-y-1">
            {settings.bank_name && <p>Bank: {settings.bank_name}</p>}
            {settings.bank_account_number && <p>A/C: {settings.bank_account_number}</p>}
            {settings.bank_ifsc && <p>IFSC: {settings.bank_ifsc}</p>}
            {settings.upi_id && <p>UPI: {settings.upi_id}</p>}
          </div>
        </div>
      )}

      {data.notes && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm text-gray-400">{data.notes}</p>
        </div>
      )}
    </div>
  );
}

/* ── Proposal Preview Component ── */
function ProposalPreview({
  data,
  settings,
  documentNumber,
}: {
  data: ProposalOutput;
  settings: BusinessSettings | null;
  documentNumber: string;
}) {
  return (
    <div>
      <div className="text-center mb-8 pb-6 border-b border-white/10">
        {settings?.logo_base64 && (
          <img src={settings.logo_base64} alt="Logo" className="h-10 mx-auto mb-3 rounded" />
        )}
        <span className="inline-block bg-amber-500/15 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-3">
          {documentNumber}
        </span>
        <h3 className="text-xl font-bold text-white mb-2">{data.project_title}</h3>
        <p className="text-sm text-gray-400">
          Prepared for {data.client_name}
          {data.client_company && `, ${data.client_company}`}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          By {settings?.business_name || "Your Business"} · {formatDate(new Date())}
        </p>
      </div>

      <div className="mb-8">
        <p className="text-sm text-gray-300 leading-relaxed">{data.professional_intro}</p>
      </div>

      <div className="mb-8">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Scope of Work</h4>
        <p className="text-sm text-gray-300 leading-relaxed">{data.scope_description}</p>
      </div>

      <div className="mb-8">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Deliverables</h4>
        <div className="space-y-2">
          {data.deliverables.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {data.timeline.length > 0 && (
        <div className="mb-8">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Timeline</h4>
          <div className="space-y-2">
            {data.timeline.map((phase, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/[0.02] rounded-xl px-4 py-3">
                <span className="text-xs font-medium text-amber-400 min-w-[80px]">{phase.duration}</span>
                <div>
                  <p className="text-sm font-medium text-white">{phase.phase}</p>
                  <p className="text-xs text-gray-500">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Investment</h4>
        <div className="space-y-2 mb-4">
          {data.line_items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-300">{item.description}</span>
              <span className="text-white font-medium">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-3 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">{formatCurrency(data.subtotal)}</span></div>
          {data.cgst_amount && data.sgst_amount ? (
            <>
              <div className="flex justify-between text-sm"><span className="text-gray-400">CGST ({data.gst_rate / 2}%)</span><span className="text-white">{formatCurrency(data.cgst_amount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">SGST ({data.gst_rate / 2}%)</span><span className="text-white">{formatCurrency(data.sgst_amount)}</span></div>
            </>
          ) : data.igst_amount ? (
            <div className="flex justify-between text-sm"><span className="text-gray-400">IGST ({data.gst_rate}%)</span><span className="text-white">{formatCurrency(data.igst_amount)}</span></div>
          ) : (
            <div className="flex justify-between text-sm"><span className="text-gray-400">GST ({data.gst_rate}%)</span><span className="text-white">{formatCurrency(data.gst_amount)}</span></div>
          )}
          <div className="flex justify-between text-base font-bold bg-amber-500/10 rounded-xl px-4 py-3 mt-2">
            <span className="text-white">Total Investment</span>
            <span className="text-amber-400">{formatCurrency(data.total)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Payment Terms</h4>
        <p className="text-sm text-gray-300">{data.payment_terms}</p>
      </div>

      {data.terms_and_conditions.length > 0 && (
        <div className="pt-4 border-t border-white/5">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Terms & Conditions</h4>
          <ol className="space-y-1.5 list-decimal list-inside">
            {data.terms_and_conditions.map((term, i) => (
              <li key={i} className="text-xs text-gray-500">{term}</li>
            ))}
          </ol>
          <p className="text-xs text-gray-600 mt-4">This proposal is valid for {data.validity}.</p>
        </div>
      )}
    </div>
  );
}
