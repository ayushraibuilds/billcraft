"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Loader2,
  Trash2,
  Mail,
  X,
  Repeat,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  getDocuments,
  getSettings,
  deleteDocument,
  updateDocument,
  type SavedDocument,
  type BusinessSettings,
} from "@/lib/store";
import { useToast } from "@/components/Toast";
import Navbar from "@/components/Navbar";
import type { InvoiceOutput, ProposalOutput } from "@/lib/ai/schema";
import { getAuthUserId, deleteDocumentFromCloud, updateDocumentStatusInCloud, syncDocumentToCloud } from "@/lib/supabase/sync";

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [doc, setDoc] = useState<SavedDocument | null>(() => {
    if (typeof window === "undefined") return null;
    const docs = getDocuments();
    return docs.find((d) => d.id === id) || null;
  });
  const [settings] = useState<BusinessSettings | null>(() => {
    if (typeof window === "undefined") return null;
    return getSettings();
  });
  const [loading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const handleDownloadPDF = () => {
    if (!doc) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = buildHTML(doc, settings);
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const buildHTML = (doc: SavedDocument, settings: BusinessSettings | null) => {
    const businessName = settings?.business_name || "Your Business";
    const isInvoice = doc.type === "invoice";
    const data = doc.output_json;

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

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${doc.document_number} — ${businessName}</title>
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
      <div style="font-size:14px;font-weight:600;background:#f5f0e0;color:#854F0B;display:inline-block;padding:4px 12px;border-radius:20px;margin-bottom:8px;">${doc.document_number}</div>
      <div style="font-size:24px;font-weight:700;margin-top:4px;">${isInvoice ? "INVOICE" : "PROPOSAL"}</div>
      <div style="font-size:12px;color:#888;">Date: ${formatDate(new Date(doc.created_at))}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
    <div>
      <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:4px;">Bill To</div>
      <div style="font-weight:600;">${data.client_name}</div>
      ${data.client_company ? `<div style="color:#666;font-size:14px;">${data.client_company}</div>` : ""}
      ${data.client_address ? `<div style="color:#666;font-size:13px;margin-top:2px;">${data.client_address}</div>` : ""}
      ${data.client_gstin ? `<div style="color:#666;font-size:13px;margin-top:2px;">GSTIN: ${data.client_gstin}</div>` : ""}
      ${data.client_email ? `<div style="color:#666;font-size:13px;margin-top:2px;">${data.client_email}</div>` : ""}
      ${data.client_phone ? `<div style="color:#666;font-size:13px;margin-top:2px;">${data.client_phone}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:4px;">Payment Terms</div>
      <div>${isInvoice ? invoiceData.payment_terms : proposalData.payment_terms}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>${lineItemsHTML}</tbody>
  </table>

  <div style="margin-top:16px;border-top:2px solid #222;padding-top:12px;">
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;"><span>Subtotal</span><span>₹${data.subtotal.toLocaleString("en-IN")}</span></div>
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;"><span>GST (${data.gst_rate}%)</span><span>₹${data.gst_amount.toLocaleString("en-IN")}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:16px;font-weight:700;border-top:1px solid #ddd;margin-top:4px;"><span>Total</span><span>₹${data.total.toLocaleString("en-IN")}</span></div>
    ${isInvoice && invoiceData.advance_paid > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#059669;"><span>Advance Paid</span><span>-₹${invoiceData.advance_paid.toLocaleString("en-IN")}</span></div>
    <div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:18px;font-weight:700;background:#f5f0e0;color:#854F0B;border-radius:8px;margin-top:8px;"><span>Balance Due</span><span>₹${invoiceData.balance_due.toLocaleString("en-IN")}</span></div>` : ""}
  </div>
  ${paymentInfo}
  <div style="text-align:center;margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#bbb;">Generated by BillCraft · billcraft.vercel.app</div>
</body></html>`;
  };

  const handleStatusChange = async (newStatus: "draft" | "sent" | "paid" | "overdue") => {
    if (!doc) return;
    const updated = { ...doc, status: newStatus };
    setDoc(updated);
    updateDocument(doc.id, { status: newStatus });
    
    const userId = await getAuthUserId();
    if (userId) {
      updateDocumentStatusInCloud(doc.id, newStatus);
    }
  };

  const handleRecurringChange = async (cadence: "none" | "weekly" | "monthly" | "yearly") => {
    if (!doc) return;
    const output_json = { ...doc.output_json } as Record<string, unknown>;
    
    if (cadence === "none") {
      delete output_json.recurring_cadence;
      delete output_json.recurring_next_date;
    } else {
      output_json.recurring_cadence = cadence;
      const nextDate = new Date();
      if (cadence === "weekly") nextDate.setDate(nextDate.getDate() + 7);
      if (cadence === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      if (cadence === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
      output_json.recurring_next_date = nextDate.toISOString();
    }
    
    const updatedDocumentOutput = output_json as unknown as InvoiceOutput | ProposalOutput;
    const updated = { ...doc, output_json: updatedDocumentOutput };
    setDoc(updated);
    updateDocument(doc.id, { output_json: updatedDocumentOutput });
    
    const userId = await getAuthUserId();
    if (userId) {
      syncDocumentToCloud(userId, updated);
    }
    toast(`Recurring schedule updated to ${cadence}`, "success");
  };

  const handleDelete = async () => {
    if (!doc) return;
    deleteDocument(doc.id);
    toast("Document deleted", "success");

    // Cloud sync if logged in
    const userId = await getAuthUserId();
    if (userId) {
      await deleteDocumentFromCloud(doc.id);
    }

    router.push("/dashboard");
  };

  const handleSendEmail = async () => {
    if (!doc || !emailTo) return;
    setEmailSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          subject: `${doc.document_number} — ${doc.type === "invoice" ? "Invoice" : "Proposal"}`,
          document_number: doc.document_number,
          client_name: doc.client_name,
          html_content: buildHTML(doc, settings),
          pdf_data: {
            document_number: doc.document_number,
            document_type: doc.type,
            client_name: doc.output_json.client_name,
            client_company: doc.output_json.client_company,
            payment_terms: "payment_terms" in doc.output_json ? doc.output_json.payment_terms : "",
            line_items: doc.output_json.line_items,
            subtotal: doc.output_json.subtotal,
            gst_rate: doc.output_json.gst_rate,
            gst_amount: doc.output_json.gst_amount,
            cgst_amount: doc.output_json.cgst_amount,
            sgst_amount: doc.output_json.sgst_amount,
            igst_amount: doc.output_json.igst_amount,
            total: doc.output_json.total,
            ...("advance_paid" in doc.output_json ? { advance_paid: doc.output_json.advance_paid, balance_due: doc.output_json.balance_due } : {}),
            ...("notes" in doc.output_json ? { notes: doc.output_json.notes } : {}),
            ...("project_title" in doc.output_json ? {
              project_title: doc.output_json.project_title,
              professional_intro: doc.output_json.professional_intro,
              scope_description: doc.output_json.scope_description,
              deliverables: doc.output_json.deliverables,
              validity: doc.output_json.validity,
              terms_and_conditions: doc.output_json.terms_and_conditions,
            } : {}),
          },
          business_info: {
            business_name: settings?.business_name,
            address: settings?.address,
            gstin: settings?.gstin,
            email: settings?.email,
            phone: settings?.phone,
          },
        }),
      });
      const data = await res.json();
      if (data.demo) {
        toast("Email service not configured — add RESEND_API_KEY", "info");
      } else if (res.ok) {
        toast(`Email sent to ${emailTo}`, "success");
      } else {
        toast(data.error || "Failed to send email", "error");
      }
    } catch {
      toast("Failed to send email", "error");
    }
    setEmailSending(false);
    setShowEmailModal(false);
    setEmailTo("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Document not found</h2>
          <p className="text-sm text-gray-500 mb-6">This document may have been deleted or doesn&apos;t exist.</p>
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const data = doc.output_json;
  const isInvoice = doc.type === "invoice";

  return (
    <main className="min-h-screen bg-dark-900">
      <Navbar />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="glass-card p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Delete document?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently remove {doc.document_number} from your history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1 text-sm !py-2.5">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold py-2.5 hover:bg-red-500/30 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="glass-card p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Email to client</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="client@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/30 mb-4"
            />
            <button
              onClick={handleSendEmail}
              disabled={!emailTo || emailSending}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm !py-2.5 disabled:opacity-50"
            >
              {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {emailSending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6 pt-24 pb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {isInvoice ? "Invoice" : "Proposal"} — {doc.client_name}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full">
                {doc.document_number}
              </span>
              <span className="text-xs text-gray-500">{formatDate(new Date(doc.created_at))}</span>
              <span className="text-xs text-gray-600 capitalize">{doc.service_category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={doc.status}
              onChange={(e) => handleStatusChange(e.target.value as "draft" | "sent" | "paid" | "overdue")}
              className={cn(
                "text-sm py-2.5 px-3 rounded-xl border focus:outline-none appearance-none cursor-pointer font-medium transition-colors",
                doc.status === "draft" ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
                doc.status === "sent" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                doc.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                "bg-red-500/10 text-red-400 border-red-500/20"
              )}
            >
              <option value="draft">Status: Draft</option>
              <option value="sent">Status: Sent</option>
              <option value="paid">Status: Paid</option>
              <option value="overdue">Status: Overdue</option>
            </select>
            <button
              onClick={handleDownloadPDF}
              className="btn-primary flex items-center gap-2 text-sm !py-2.5 !px-4"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="btn-secondary flex items-center gap-2 text-sm !py-2.5 !px-4"
            >
              <Mail className="w-4 h-4" /> Email
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="glass-card p-8 max-w-3xl mx-auto">
          {/* Header */}
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
              {settings?.address && <p className="text-xs text-gray-500">{settings.address}</p>}
              {settings?.gstin && <p className="text-xs text-gray-500">GSTIN: {settings.gstin}</p>}
            </div>
            <div className="text-right">
              <span className="inline-block bg-amber-500/15 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-2">
                {doc.document_number}
              </span>
              <p className="text-2xl font-bold text-white">{isInvoice ? "INVOICE" : "PROPOSAL"}</p>
              <p className="text-xs text-gray-500">{formatDate(new Date(doc.created_at))}</p>
            </div>
          </div>

          {/* Client info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
              <p className="text-sm font-semibold text-white">{data.client_name}</p>
              {data.client_company && <p className="text-sm text-gray-400">{data.client_company}</p>}
              {data.client_address && <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{data.client_address}</p>}
              {data.client_gstin && <p className="text-sm text-gray-400 font-mono mt-1">GSTIN: {data.client_gstin}</p>}
              {data.client_email && <p className="text-sm text-gray-400 mt-1">{data.client_email}</p>}
              {data.client_phone && <p className="text-sm text-gray-400 mt-1">{data.client_phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Payment Terms</p>
              <p className="text-sm text-gray-300">
                {isInvoice ? (data as InvoiceOutput).payment_terms : (data as ProposalOutput).payment_terms}
              </p>
            </div>
          </div>

          {/* Proposal-specific */}
          {!isInvoice && (
            <>
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Project</h4>
                <p className="text-base font-semibold text-white mb-2">{(data as ProposalOutput).project_title}</p>
                <p className="text-sm text-gray-300 leading-relaxed">{(data as ProposalOutput).professional_intro}</p>
              </div>
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Deliverables</h4>
                <div className="space-y-2">
                  {(data as ProposalOutput).deliverables.map((d, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Line items */}
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

          {/* Totals */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">{formatCurrency(data.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">GST ({data.gst_rate}%)</span><span className="text-white">{formatCurrency(data.gst_amount)}</span></div>
            <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2"><span className="text-white">Total</span><span className="text-white">{formatCurrency(data.total)}</span></div>
            {isInvoice && (data as InvoiceOutput).advance_paid > 0 && (
              <div className="flex justify-between text-sm"><span className="text-gray-400">Advance Paid</span><span className="text-emerald-500">-{formatCurrency((data as InvoiceOutput).advance_paid)}</span></div>
            )}
            {isInvoice && (
              <div className="flex justify-between text-base font-bold bg-amber-500/10 rounded-xl px-4 py-3 mt-2">
                <span className="text-white">Balance Due</span>
                <span className="text-amber-400">{formatCurrency((data as InvoiceOutput).balance_due)}</span>
              </div>
            )}
          </div>

          {/* Payment Details */}
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
        </div>

        {/* Automation Panel */}
        <div className="glass-card p-6 mt-8 max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
              <h4 className="text-white font-medium mb-1 flex items-center gap-2"><Repeat className="w-4 h-4 text-amber-500" /> Recurring Invoice</h4>
              <p className="text-sm text-gray-500">Automatically remind you to generate this invoice on a schedule.</p>
           </div>
           <select
              value={((doc.output_json as Record<string, unknown>).recurring_cadence as string) || "none"}
              onChange={(e) => handleRecurringChange(e.target.value as "none" | "weekly" | "monthly" | "yearly")}
              className="bg-dark-700 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/30"
           >
              <option value="none">Does not repeat</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
           </select>
        </div>
      </div>
    </main>
  );
}
