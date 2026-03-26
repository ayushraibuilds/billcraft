import { formatDate } from "@/lib/utils";
import type { BusinessSettings } from "@/lib/store";
import type { InvoiceOutput, ProposalOutput } from "@/lib/ai/schema";

export function buildHTML(
  data: InvoiceOutput | ProposalOutput,
  documentType: "invoice" | "proposal",
  documentNumber: string,
  createdAt: string,
  settings: BusinessSettings | null
): string {
  const businessName = settings?.business_name || "Your Business";
  const isInvoice = documentType === "invoice";
  const theme = settings?.theme || "standard";

  const themeStyles = {
    standard: `
      body { font-family: 'Segoe UI', system-ui, sans-serif; color: #222; background: #fff; }
      .page-wrap { padding: 40px; max-width: 800px; margin: 0 auto; }
      .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #222; }
      .header-right { text-align: right; }
      .accent-bg { font-size: 14px; font-weight: 600; background: #f5f0e0; color: #854F0B; display: inline-block; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px; }
      th { border-bottom: 2px solid #222; color: #888; text-transform: uppercase; font-size: 12px; padding: 8px 0; text-align: left; }
      td { padding: 10px 0; border-bottom: 1px solid #eee; }
      .payment-panel { background: #f8f8f8; border-radius: 8px; }
      .totals-panel { background: #f9fafb; border-radius: 8px; }
      .total-row { border-top: 1px solid #ddd; }
      @media print { body { background: transparent; } .page-wrap { padding: 20px; box-shadow: none; } }
    `,
    modern: `
      body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; background: #f8fafc; }
      .page-wrap { padding: 48px; max-width: 800px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
      .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 0px; border-bottom: none; }
      .header-right { text-align: right; }
      .accent-bg { font-size: 14px; font-weight: 600; background: #e0e7ff; color: #4338ca; display: inline-block; padding: 4px 12px; border-radius: 6px; margin-bottom: 8px; }
      th { border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase; padding: 12px 0; text-align: left; }
      td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
      .payment-panel { background: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0; }
      .totals-panel { background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
      .total-row { border-top: 2px solid #e2e8f0; }
      @media print { body { background: transparent; } .page-wrap { padding: 20px; margin: 0; box-shadow: none; border-radius: 0; } }
    `,
    creative: `
      body { font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif; color: #2c2921; background: #fdfbf7; }
      .page-wrap { padding: 48px; max-width: 800px; margin: 20px auto; border: 8px solid #fff; outline: 1px solid #e0d9c8; background: #fdfbf7; }
      .doc-header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px dashed #e0d9c8; }
      .header-right { text-align: center; margin-top: 24px; }
      .accent-bg { font-size: 15px; font-weight: 400; background: transparent; color: #c09665; border: 1px solid #c09665; display: inline-block; padding: 4px 16px; margin-bottom: 12px; letter-spacing: 1px; }
      th { border-bottom: 1px solid #e0d9c8; color: #c09665; font-weight: normal; font-size: 11px; text-transform: uppercase; padding: 8px 0; text-align: left; letter-spacing: 1px; }
      td { padding: 12px 0; border-bottom: 1px dashed #eee; }
      .payment-panel { border: 1px solid #e0d9c8; padding: 16px; }
      .totals-panel { border: 1px solid #e0d9c8; padding: 24px; background: transparent; }
      .total-row { border-top: 1px solid #c09665; }
      @media print { .page-wrap { margin: 0; outline: none; border: none; padding: 20px; } }
    `,
    legal: `
      body { font-family: 'Times New Roman', Times, serif; color: #000; background: #fff; line-height: 1.6; }
      .page-wrap { padding: 40px 40px 40px 60px; max-width: 800px; margin: 0 auto; border-left: 4px double #000; min-height: 100vh; }
      .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 4px double #000; }
      .header-right { text-align: right; }
      .accent-bg { font-size: 16px; font-weight: bold; background: transparent; color: #000; display: inline-block; margin-bottom: 8px; }
      th { border-bottom: 2px solid #000; color: #000; font-weight: bold; font-size: 12px; text-transform: uppercase; padding: 8px 0; text-align: left; }
      td { padding: 8px 0; border-bottom: 1px solid #ccc; }
      .payment-panel { border: 1px solid #000; padding: 16px; }
      .totals-panel { border: 2px solid #000; padding: 24px; background: transparent; }
      .total-row { border-top: 2px solid #000; font-weight: bold; }
      @media print { .page-wrap { padding: 20px; border-left: none; } }
    `
  };

  const lineItemsHTML = data.line_items
    .map(
      (item) => `
    <tr>
      <td>
        <div style="font-weight:600;">${item.description}</div>
        ${item.details ? `<div style="font-size:12px;opacity:0.7;margin-top:2px;">${item.details}</div>` : ""}
      </td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">₹${item.rate.toLocaleString("en-IN")}</td>
      <td style="text-align:right;font-weight:600;">₹${item.amount.toLocaleString("en-IN")}</td>
    </tr>`
    )
    .join("");

  const invoiceData = data as InvoiceOutput;
  const proposalData = data as ProposalOutput;

  const paymentInfo = settings?.bank_name
    ? `<div class="payment-panel" style="margin-top:24px;font-size:13px;">
        <div style="font-weight:bold;margin-bottom:8px;text-transform:uppercase;font-size:11px;letter-spacing:1px;">Payment Details</div>
        ${settings.bank_name ? `<div>Bank: ${settings.bank_name}</div>` : ""}
        ${settings.bank_account_name ? `<div>A/C Name: ${settings.bank_account_name}</div>` : ""}
        ${settings.bank_account_number ? `<div>A/C No: ${settings.bank_account_number}</div>` : ""}
        ${settings.bank_ifsc ? `<div>IFSC: ${settings.bank_ifsc}</div>` : ""}
        ${settings.upi_id ? `<div>UPI: ${settings.upi_id}</div>` : ""}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${documentNumber} — ${businessName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  table { width:100%; border-collapse:collapse; }
  th:nth-child(2) { text-align:center; }
  th:nth-child(3), th:nth-child(4) { text-align:right; }
  ${themeStyles[theme]}
</style></head><body>
<div class="page-wrap">
  <div class="doc-header">
    <div>
      ${settings?.logo_base64 ? `<img src="${settings.logo_base64}" alt="Logo" style="height:48px;margin-bottom:12px;">` : ""}
      <div style="font-size:24px;font-weight:bold;">${businessName}</div>
      ${settings?.address ? `<div style="font-size:13px;opacity:0.8;margin-top:4px;">${settings.address}</div>` : ""}
      ${settings?.gstin ? `<div style="font-size:13px;opacity:0.8;">GSTIN: ${settings.gstin}</div>` : ""}
    </div>
    <div class="header-right">
      <div class="accent-bg">${documentNumber}</div>
      <div style="font-size:28px;font-weight:bold;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">${isInvoice ? "Invoice" : "Proposal"}</div>
      <div style="font-size:13px;opacity:0.7;margin-top:4px;">Date: ${formatDate(new Date(createdAt))}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px;">
    <div>
      <div style="font-size:11px;text-transform:uppercase;opacity:0.6;margin-bottom:4px;letter-spacing:1px;font-weight:bold;">Bill To</div>
      <div style="font-weight:bold;font-size:16px;">${data.client_name}</div>
      ${data.client_company ? `<div style="font-size:14px;opacity:0.9;">${data.client_company}</div>` : ""}
      ${data.client_address ? `<div style="font-size:13px;opacity:0.8;margin-top:2px;">${data.client_address}</div>` : ""}
      ${data.client_gstin ? `<div style="font-size:13px;opacity:0.8;margin-top:2px;">GSTIN: ${data.client_gstin}</div>` : ""}
      ${data.client_email ? `<div style="font-size:13px;opacity:0.8;margin-top:2px;">${data.client_email}</div>` : ""}
      ${data.client_phone ? `<div style="font-size:13px;opacity:0.8;margin-top:2px;">${data.client_phone}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;text-transform:uppercase;opacity:0.6;margin-bottom:4px;letter-spacing:1px;font-weight:bold;">Payment Terms</div>
      <div style="font-weight:500;">${isInvoice ? invoiceData.payment_terms : proposalData.payment_terms}</div>
      ${isInvoice && invoiceData.due_date ? `<div style="font-size:11px;text-transform:uppercase;opacity:0.6;margin-top:16px;margin-bottom:4px;letter-spacing:1px;font-weight:bold;">Due Date</div><div style="font-weight:500;">${formatDate(new Date(invoiceData.due_date))}</div>` : ""}
    </div>
  </div>

  ${!isInvoice ? `
  <div style="margin-bottom:32px;padding:24px;background:rgba(0,0,0,0.02);border-radius:8px;">
    <div style="font-size:11px;text-transform:uppercase;opacity:0.6;margin-bottom:8px;font-weight:bold;letter-spacing:1px;">Project</div>
    <div style="font-weight:bold;font-size:18px;margin-bottom:12px;">${proposalData.project_title}</div>
    <div style="font-size:14px;line-height:1.7;opacity:0.9;">${proposalData.professional_intro.replace(/\n/g, '<br/>')}</div>
  </div>
  <div style="margin-bottom:32px;">
    <div style="font-size:11px;text-transform:uppercase;opacity:0.6;margin-bottom:12px;font-weight:bold;letter-spacing:1px;">Scope of Work</div>
    <div style="font-size:14px;line-height:1.7;opacity:0.9;">${proposalData.scope_description.replace(/\n/g, '<br/>')}</div>
  </div>
  <div style="margin-bottom:40px;">
    <div style="font-size:11px;text-transform:uppercase;opacity:0.6;margin-bottom:12px;font-weight:bold;letter-spacing:1px;">Deliverables</div>
    <ul style="padding-left:24px;font-size:14px;line-height:1.8;opacity:0.9;">
      ${proposalData.deliverables.map((d) => `<li>${d}</li>`).join("")}
    </ul>
  </div>
  ` : ""}

  <table style="margin-bottom:40px;">
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHTML}
    </tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;">
    <div class="totals-panel" style="width:320px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;opacity:0.8;">
        <span>Subtotal</span>
        <span>₹${data.subtotal.toLocaleString("en-IN")}</span>
      </div>
      ${data.cgst_amount || data.sgst_amount ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;opacity:0.8;">
        <span>CGST</span>
        <span>₹${(data.cgst_amount || 0).toLocaleString("en-IN")}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;opacity:0.8;">
        <span>SGST</span>
        <span>₹${(data.sgst_amount || 0).toLocaleString("en-IN")}</span>
      </div>` : ""}
      ${data.igst_amount ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;opacity:0.8;">
        <span>IGST</span>
        <span>₹${data.igst_amount.toLocaleString("en-IN")}</span>
      </div>` : ""}
      ${isInvoice && invoiceData.advance_paid && invoiceData.advance_paid > 0 ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:14px;color:#059669;font-weight:bold;">
        <span>Advance Paid</span>
        <span>- ₹${invoiceData.advance_paid.toLocaleString("en-IN")}</span>
      </div>
      <div class="total-row" style="display:flex;justify-content:space-between;padding-top:16px;font-size:20px;font-weight:bold;">
        <span>Balance Due</span>
        <span>₹${invoiceData.balance_due.toLocaleString("en-IN")}</span>
      </div>` : `
      <div class="total-row" style="display:flex;justify-content:space-between;padding-top:16px;font-size:20px;font-weight:bold;">
        <span>Total</span>
        <span>₹${data.total.toLocaleString("en-IN")}</span>
      </div>`}
    </div>
  </div>

  ${paymentInfo}

  ${isInvoice && invoiceData.notes ? `
  <div style="margin-top:48px;font-size:13px;opacity:0.8;line-height:1.6;">
    <strong style="display:block;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Notes</strong>
    ${invoiceData.notes.replace(/\n/g, '<br/>')}
  </div>` : ""}
  
  ${!isInvoice && proposalData.terms_and_conditions?.length ? `
  <div style="margin-top:48px;font-size:13px;opacity:0.8;line-height:1.6;">
    <strong style="display:block;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Terms & Conditions</strong>
    <ol style="padding-left:16px;">
      ${proposalData.terms_and_conditions.map((t) => `<li>${t}</li>`).join("")}
    </ol>
    <div style="margin-top:12px;font-style:italic;">This proposal is valid for ${proposalData.validity}.</div>
  </div>` : ""}

  <div style="margin-top:64px;text-align:center;font-size:11px;opacity:0.5;letter-spacing:1px;">
    Generated by BillCraft · billcraft.vercel.app
  </div>
</div>
</body></html>`;
}
