import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

interface LineItem {
  description: string;
  details?: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface PDFData {
  document_number: string;
  document_type: "invoice" | "proposal";
  client_name: string;
  client_company?: string;
  payment_terms: string;
  line_items: LineItem[];
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total: number;
  advance_paid?: number;
  balance_due?: number;
  notes?: string;
  // Proposal-specific
  project_title?: string;
  professional_intro?: string;
  scope_description?: string;
  deliverables?: string[];
  validity?: string;
  terms_and_conditions?: string[];
}

interface BusinessInfo {
  business_name?: string;
  address?: string;
  gstin?: string;
  email?: string;
  phone?: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#222" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: "#222" },
  businessName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  smallText: { fontSize: 8, color: "#666", marginBottom: 2 },
  docNumber: { fontSize: 10, fontWeight: "bold", backgroundColor: "#f5f0e0", color: "#854F0B", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 6, textAlign: "right" },
  docType: { fontSize: 20, fontWeight: "bold", textAlign: "right", marginBottom: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 8, textTransform: "uppercase", color: "#888", letterSpacing: 1, marginBottom: 6, fontWeight: "bold" },
  grid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  gridCol: { width: "48%" },
  // Table
  tableHeader: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#222", paddingBottom: 6, marginBottom: 4 },
  tableHeaderCell: { fontSize: 8, textTransform: "uppercase", color: "#888", fontWeight: "bold" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 8 },
  cellDesc: { width: "50%" },
  cellQty: { width: "15%", textAlign: "center" },
  cellRate: { width: "17%", textAlign: "right" },
  cellAmount: { width: "18%", textAlign: "right", fontWeight: "bold" },
  // Totals
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { fontSize: 10, color: "#666" },
  totalValue: { fontSize: 10 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#ddd", marginTop: 4 },
  grandTotalLabel: { fontSize: 12, fontWeight: "bold" },
  grandTotalValue: { fontSize: 12, fontWeight: "bold" },
  balanceDue: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#f5f0e0", borderRadius: 6, marginTop: 6 },
  balanceLabel: { fontSize: 14, fontWeight: "bold", color: "#854F0B" },
  balanceValue: { fontSize: 14, fontWeight: "bold", color: "#854F0B" },
  // Payment
  paymentBox: { marginTop: 16, padding: 12, backgroundColor: "#f8f8f8", borderRadius: 6 },
  paymentTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 6 },
  paymentLine: { fontSize: 9, color: "#444", marginBottom: 2 },
  // Footer
  footer: { textAlign: "center", fontSize: 8, color: "#bbb", marginTop: 30, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#eee" },
  // Proposal
  introText: { fontSize: 10, color: "#444", lineHeight: 1.6, marginBottom: 12 },
  deliverable: { flexDirection: "row", marginBottom: 4 },
  deliverableCheck: { color: "#059669", marginRight: 6, fontSize: 10 },
  deliverableText: { fontSize: 10, color: "#444" },
  notesText: { fontSize: 9, color: "#888", marginTop: 12 },
});

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function InvoicePDF({ data, business }: { data: PDFData; business: BusinessInfo }) {
  const isInvoice = data.document_type === "invoice";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{business.business_name || "Your Business"}</Text>
            {business.address && <Text style={styles.smallText}>{business.address}</Text>}
            {business.gstin && <Text style={styles.smallText}>GSTIN: {business.gstin}</Text>}
            {business.email && <Text style={styles.smallText}>{business.email}</Text>}
          </View>
          <View>
            <Text style={styles.docNumber}>{data.document_number}</Text>
            <Text style={styles.docType}>{isInvoice ? "INVOICE" : "PROPOSAL"}</Text>
            <Text style={[styles.smallText, { textAlign: "right" }]}>Date: {new Date().toLocaleDateString("en-IN")}</Text>
          </View>
        </View>

        {/* Client + Payment Terms */}
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={{ fontWeight: "bold", marginBottom: 2 }}>{data.client_name}</Text>
            {data.client_company && <Text style={{ color: "#666" }}>{data.client_company}</Text>}
          </View>
          <View style={[styles.gridCol, { alignItems: "flex-end" }]}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text>{data.payment_terms}</Text>
          </View>
        </View>

        {/* Proposal fields */}
        {!isInvoice && data.project_title && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project</Text>
            <Text style={{ fontWeight: "bold", fontSize: 12, marginBottom: 6 }}>{data.project_title}</Text>
            {data.professional_intro && <Text style={styles.introText}>{data.professional_intro}</Text>}
          </View>
        )}

        {!isInvoice && data.deliverables && data.deliverables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            {data.deliverables.map((d, i) => (
              <View key={i} style={styles.deliverable}>
                <Text style={styles.deliverableCheck}>✓</Text>
                <Text style={styles.deliverableText}>{d}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.cellQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.cellRate]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.cellAmount]}>Amount</Text>
          </View>
          {data.line_items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.cellDesc}>
                <Text style={{ fontWeight: "bold" }}>{item.description}</Text>
                {item.details && <Text style={{ fontSize: 8, color: "#888", marginTop: 2 }}>{item.details}</Text>}
              </View>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellRate}>{fmt(item.rate)}</Text>
              <Text style={styles.cellAmount}>{fmt(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={{ borderTopWidth: 2, borderTopColor: "#222", paddingTop: 8 }}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(data.subtotal)}</Text>
          </View>
          {data.cgst_amount && data.sgst_amount ? (
            <>
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>CGST ({data.gst_rate / 2}%)</Text>
                <Text style={styles.totalValue}>{fmt(data.cgst_amount)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>SGST ({data.gst_rate / 2}%)</Text>
                <Text style={styles.totalValue}>{fmt(data.sgst_amount)}</Text>
              </View>
            </>
          ) : data.igst_amount ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>IGST ({data.gst_rate}%)</Text>
              <Text style={styles.totalValue}>{fmt(data.igst_amount)}</Text>
            </View>
          ) : (
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>GST ({data.gst_rate}%)</Text>
              <Text style={styles.totalValue}>{fmt(data.gst_amount)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{fmt(data.total)}</Text>
          </View>
          {isInvoice && (data.advance_paid ?? 0) > 0 && (
            <>
              <View style={styles.totalsRow}>
                <Text style={[styles.totalLabel, { color: "#059669" }]}>Advance Paid</Text>
                <Text style={[styles.totalValue, { color: "#059669" }]}>-{fmt(data.advance_paid!)}</Text>
              </View>
              <View style={styles.balanceDue}>
                <Text style={styles.balanceLabel}>Balance Due</Text>
                <Text style={styles.balanceValue}>{fmt(data.balance_due ?? data.total)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Payment info */}
        {business.gstin && (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>Payment Details</Text>
            <Text style={styles.paymentLine}>GSTIN: {business.gstin}</Text>
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <Text style={styles.notesText}>Notes: {data.notes}</Text>
        )}

        {/* Footer */}
        <Text style={styles.footer}>Generated by Invosmith · invosmith.vercel.app</Text>
      </Page>
    </Document>
  );
}

export async function generatePDFBuffer(
  data: PDFData,
  business: BusinessInfo
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <InvoicePDF data={data} business={business} />
  );
  return Buffer.from(buffer);
}

export type { PDFData, BusinessInfo };
