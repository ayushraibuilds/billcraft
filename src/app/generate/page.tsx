"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Zap,
  Download,
  Loader2,
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
import type { InvoiceOutput, ProposalOutput, DocumentOutput } from "@/lib/ai/schema";
import {
  getSettings,
  saveDocument,
  getNextDocumentNumber,
  getMonthlyUsage,
  getClients,
  type SavedDocument,
  type BusinessSettings,
  type Client,
} from "@/lib/store";
import { getAuthUserId, syncDocumentToCloud } from "@/lib/supabase/sync";
import { INDIAN_STATES } from "@/lib/constants";
import EditableDocumentPreview from "@/components/EditableDocumentPreview";
import { buildHTML } from "@/lib/html-template";
import { useRouter } from "next/navigation";
import UpgradeModal from "@/components/UpgradeModal";

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
    isDemo?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [clientStateCode, setClientStateCode] = useState("");
  const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("new");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    setSettings(getSettings());
    setMonthlyUsage(getMonthlyUsage());
    setClients(getClients());
  }, []);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("Please describe your project or service");
      return;
    }

    if (monthlyUsage >= FREE_LIMIT && settings?.plan !== "pro" && settings?.plan !== "agency") {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      let effectiveStateCode = clientStateCode;
      let selectedClient: Client | undefined;
      
      if (selectedClientId !== "new") {
        selectedClient = clients.find(c => c.id === selectedClientId);
        if (selectedClient && selectedClient.state_code) {
          effectiveStateCode = selectedClient.state_code;
        }
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_text: inputText,
          document_type: documentType,
          service_category: serviceCategory,
          business_name: settings?.business_name,
          gstin: settings?.gstin,
          state_code: settings?.state_code,
          client_state_code: effectiveStateCode,
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

      // Merge selected client details into generated JSON if selected
      const parsedData = data.data as DocumentOutput;
      if (selectedClient) {
        parsedData.client_name = selectedClient.name;
        parsedData.client_company = selectedClient.company || "";
        parsedData.client_email = selectedClient.email || "";
        parsedData.client_phone = selectedClient.phone || "";
        parsedData.client_address = selectedClient.address || "";
        parsedData.client_gstin = selectedClient.gstin || "";
        parsedData.client_state_code = selectedClient.state_code || "";
      }

      const savedDoc: SavedDocument = {
        id: crypto.randomUUID(),
        type: documentType,
        service_category: serviceCategory,
        input_text: inputText,
        output_json: parsedData,
        client_name: parsedData.client_name || "Unknown Client",
        client_company: parsedData.client_company,
        document_number: docNumber,
        amount,
        status: "draft",
        ai_provider: data.provider,
        created_at: new Date().toISOString(),
      };

      // Enter revision workflow (don't save to DB yet)
      setPreviewDoc(savedDoc);

      setResult({
        ...data,
        data: parsedData,
        documentNumber: docNumber,
        isDemo: data.provider === "mock",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalizeSave = async (editedDoc: SavedDocument) => {
    saveDocument(editedDoc);
    setMonthlyUsage((p) => p + 1);

    // Build the finalized result state
    setResult({
      data: editedDoc.output_json,
      provider: editedDoc.ai_provider,
      document_type: documentType,
      documentNumber: editedDoc.document_number,
      isDemo: result?.isDemo,
    });
    setPreviewDoc(null);

    // Cloud sync wrapper
    const userId = await getAuthUserId();
    if (userId) {
      syncDocumentToCloud(userId, editedDoc);
    }
    
    // Auto-navigate to detail view after short delay to show success UI
    setTimeout(() => {
      router.push(`/dashboard/${editedDoc.id}`);
    }, 1500);
  };

  const handleReset = () => {
    setResult(null);
    setPreviewDoc(null);
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

    const html = buildHTML(
      result.data,
      result.document_type as "invoice" | "proposal",
      result.documentNumber,
      new Date().toISOString(),
      settings
    );

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
    <main className="min-h-screen bg-dark-900 relative selection:bg-amber-500/30">
      {/* Cinematic Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full opacity-60" />

      <Navbar />
      
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />

      <div className="mx-auto max-w-5xl px-6 pt-24 pb-10 relative z-10">
        {previewDoc ? (
           <EditableDocumentPreview 
             document={previewDoc} 
             onSave={handleFinalizeSave} 
             onCancel={() => { setPreviewDoc(null); setResult(null); }} 
           />
        ) : !result ? (
          /* ── Input Form ── */
          <div className="max-w-4xl mx-auto glass-card p-8 sm:p-12 mb-16 relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                Craft your{" "}
                <span className="gradient-text">
                  {documentType === "invoice" ? "invoice" : "proposal"}
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
                Describe your project using loose notes or keywords — we&apos;ll automatically structure, calculate, and format it.
              </p>
            </div>

            {/* Document Type Toggle */}
            <div className="flex items-center justify-center mb-10">
              <div className="bg-dark-900/50 p-1.5 rounded-2xl border border-white/5 inline-flex backdrop-blur-sm relative">
                {(["invoice", "proposal"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDocumentType(type)}
                    className={cn(
                      "px-8 py-3 rounded-xl text-sm font-semibold transition-all capitalize relative z-10",
                      documentType === type
                        ? "bg-amber-500 text-dark-900 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Category */}
            <div className="mb-8">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Service Category
              </label>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setServiceCategory(cat.value)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                      serviceCategory === cat.value
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] scale-[1.02]"
                        : "bg-dark-900/50 text-gray-400 border border-white/5 hover:bg-white/5 hover:text-gray-200"
                    )}
                  >
                    <cat.icon className="w-4 h-4 opacity-80" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Client Selection */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group relative">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Select Client
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-dark-900/80 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:bg-dark-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="new" className="bg-dark-900">-- New / One-off Client --</option>
                  {clients.map(c => (
                    <option key={c.id} className="bg-dark-900" value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</option>
                  ))}
                </select>
                <div className="absolute right-4 bottom-3.5 pointer-events-none opacity-50">▼</div>
              </div>

              {selectedClientId === "new" && (
                <div className="group animate-in fade-in slide-in-from-top-2 duration-300 relative">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Client&apos;s State <span className="normal-case text-gray-600 font-normal tracking-normal">(for GST calculation)</span>
                  </label>
                  <select
                    value={clientStateCode}
                    onChange={(e) => setClientStateCode(e.target.value)}
                    className="w-full bg-dark-900/80 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:bg-dark-900 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-dark-900">Same state as mine (intra-state)</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} className="bg-dark-900" value={s.code}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 bottom-3.5 pointer-events-none opacity-50">▼</div>
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5" />
                  Project Description
                </label>
                <button
                  onClick={loadExample}
                  className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1 group"
                >
                  Load prompt <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setError(null);
                }}
                placeholder={`Describe your project loosely...\n\nExample: "${EXAMPLE_INPUTS[serviceCategory as keyof typeof EXAMPLE_INPUTS] || EXAMPLE_INPUTS.developer}"`}
                className="w-full h-48 bg-dark-900/50 border border-white/5 rounded-2xl px-6 py-5 text-[15px] leading-relaxed text-white placeholder-gray-600/70 resize-none hover:border-white/10 transition-all"
              />
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-[11px] font-medium text-gray-600 uppercase tracking-wider">
                  {inputText.length} / 5000 characters
                </span>
                {error && (
                  <span className="text-xs font-medium text-red-400 flex items-center gap-1.5 animate-in slide-in-from-right-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    {error}
                  </span>
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

              {/* Demo mode banner */}
              {result.isDemo && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-300 mt-4">
                  ⚡ <strong>Demo Mode</strong> — This is sample data. Add your Gemini or Groq API key in <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs">.env.local</code> for real AI generation.
                </div>
              )}
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
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.logo_base64} alt="Logo" className="h-10 rounded" />
            </div>
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
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.logo_base64} alt="Logo" className="h-10 mx-auto rounded" />
          </div>
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
