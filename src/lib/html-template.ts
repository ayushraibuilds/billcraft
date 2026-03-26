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
<html><head><meta charset="utf-8"><title>${documentNumber} — ${businessName}</title>
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
        ${documentNumber}
      </div>
      <div style="font-size:24px;font-weight:700;margin-top:4px;">${isInvoice ? "INVOICE" : "PROPOSAL"}</div>
      <div style="font-size:12px;color:#888;">Date: ${formatDate(new Date(createdAt))}</div>
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
      ${isInvoice && invoiceData.due_date ? `<div style="font-size:11px;text-transform:uppercase;color:#888;margin-top:12px;margin-bottom:4px;">Due Date</div><div>${formatDate(new Date(invoiceData.due_date))}</div>` : ""}
    </div>
  </div>

  ${!isInvoice ? `
  <div style="margin-bottom:24px;padding:16px;background:#fafafa;border-radius:8px;">
    <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:8px;">Project</div>
    <div style="font-weight:600;font-size:16px;margin-bottom:8px;">${proposalData.project_title}</div>
    <div style="font-size:14px;color:#444;line-height:1.6;">${proposalData.professional_intro.replace(/\n/g, '<br/>')}</div>
  </div>
  <div style="margin-bottom:24px;">
    <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:8px;">Scope of Work</div>
    <div style="font-size:14px;color:#444;line-height:1.6;">${proposalData.scope_description.replace(/\n/g, '<br/>')}</div>
  </div>
  <div style="margin-bottom:24px;">
    <div style="font-size:11px;text-transform:uppercase;color:#888;margin-bottom:8px;">Deliverables</div>
    <ul style="padding-left:20px;color:#444;font-size:14px;line-height:1.8;">
      ${proposalData.deliverables.map((d) => `<li>${d}</li>`).join("")}
    </ul>
  </div>
  ` : ""}

  <table style="margin-bottom:32px;">
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
    <div style="width:300px;background:#f9fafb;padding:24px;border-radius:8px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#666;">
        <span>Subtotal</span>
        <span>₹${data.subtotal.toLocaleString("en-IN")}</span>
      </div>
      ${
        data.cgst_amount || data.sgst_amount
          ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#666;">
        <span>CGST</span>
        <span>₹${(data.cgst_amount || 0).toLocaleString("en-IN")}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#666;">
        <span>SGST</span>
        <span>₹${(data.sgst_amount || 0).toLocaleString("en-IN")}</span>
      </div>`
          : ""
      }
      ${
        data.igst_amount
          ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#666;">
        <span>IGST</span>
        <span>₹${data.igst_amount.toLocaleString("en-IN")}</span>
      </div>`
          : ""
      }
      ${
        isInvoice && invoiceData.advance_paid && invoiceData.advance_paid > 0
          ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;color:#059669;">
        <span>Advance Paid</span>
        <span>- ₹${invoiceData.advance_paid.toLocaleString("en-IN")}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid #ddd;font-size:18px;font-weight:700;">
        <span>Balance Due</span>
        <span>₹${invoiceData.balance_due.toLocaleString("en-IN")}</span>
      </div>`
          : `
      <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid #ddd;font-size:18px;font-weight:700;">
        <span>Total</span>
        <span>₹${data.total.toLocaleString("en-IN")}</span>
      </div>`
      }
    </div>
  </div>

  ${paymentInfo}

  ${
    isInvoice && invoiceData.notes
      ? `
  <div style="margin-top:40px;color:#666;font-size:13px;">
    <strong>Notes:</strong><br>
    ${invoiceData.notes.replace(/\n/g, '<br/>')}
  </div>`
      : ""
  }
  
  ${!isInvoice && proposalData.terms_and_conditions?.length ? `
  <div style="margin-top:40px;font-size:13px;color:#666;">
    <strong style="margin-bottom:8px;display:block;">Terms & Conditions</strong>
    <ol style="padding-left:16px;line-height:1.8;">
      ${proposalData.terms_and_conditions.map((t) => `<li>${t}</li>`).join("")}
    </ol>
    <div style="margin-top:8px;">This proposal is valid for ${proposalData.validity}.</div>
  </div>` : ""}

  <div style="margin-top:40px;text-align:center;font-size:12px;color:#bbb;">
    Generated by BillCraft · billcraft.vercel.app
  </div>
</body></html>`;
}
