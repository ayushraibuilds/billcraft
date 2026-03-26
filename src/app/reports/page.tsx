"use client";

import { useState, useMemo } from "react";
import { getDocuments, type SavedDocument } from "@/lib/store";
import type { InvoiceOutput } from "@/lib/ai/schema";
import Navbar from "@/components/Navbar";
import { BarChart3, Download, TrendingUp, Receipt, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [documents] = useState<SavedDocument[]>(() => {
    if (typeof window === "undefined") return [];
    return getDocuments();
  });

  // Filter only invoices that are not drafts
  const validInvoices = useMemo(() => {
    return documents.filter((d) => d.type === "invoice" && d.status !== "draft");
  }, [documents]);

  const monthlyStats = useMemo(() => {
    const stats: Record<string, {
      monthKey: string;
      label: string;
      count: number;
      revenue: number;
      cgst: number;
      sgst: number;
      igst: number;
      subtotal: number;
      invoices: SavedDocument[];
    }> = {};

    validInvoices.forEach((inv) => {
      const date = new Date(inv.created_at);
      const year = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${monthStr}`;
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!stats[key]) {
        stats[key] = {
          monthKey: key,
          label,
          count: 0,
          revenue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          subtotal: 0,
          invoices: [],
        };
      }

      const data = inv.output_json as InvoiceOutput;
      
      stats[key].count += 1;
      stats[key].revenue += data.total || 0;
      stats[key].subtotal += data.subtotal || 0;
      stats[key].cgst += data.cgst_amount || 0;
      stats[key].sgst += data.sgst_amount || 0;
      stats[key].igst += data.igst_amount || 0;
      stats[key].invoices.push(inv);
    });

    // Sort descending by monthKey
    return Object.values(stats).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [validInvoices]);

  const downloadCSV = (monthKey: string, invoices: SavedDocument[]) => {
    const headers = ["Date", "Invoice No", "Client", "Client GSTIN", "Subtotal", "CGST", "SGST", "IGST", "Total"];
    
    const rows = invoices.map(inv => {
      const data = inv.output_json as InvoiceOutput;
      const date = new Date(inv.created_at).toISOString().split('T')[0];
      return [
        date,
        inv.document_number,
        `"${data.client_name}"`,
        data.client_gstin || "",
        data.subtotal || 0,
        data.cgst_amount || 0,
        data.sgst_amount || 0,
        data.igst_amount || 0,
        data.total || 0
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `GST_Report_${monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const totalAllTimeRevenue = validInvoices.reduce((sum, inv) => sum + ((inv.output_json as InvoiceOutput).total || 0), 0);
  const totalAllTimeGST = validInvoices.reduce((sum, inv) => {
    const d = inv.output_json as InvoiceOutput;
    return sum + (d.cgst_amount || 0) + (d.sgst_amount || 0) + (d.igst_amount || 0);
  }, 0);

  return (
    <main className="min-h-screen bg-dark-900 pb-20">
      <Navbar />
      
      <div className="mx-auto max-w-5xl px-6 pt-24">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            Financial Reports
          </h1>
          <p className="text-sm text-gray-500">
            Track your revenue and generate monthly GST summaries for your CA.
          </p>
        </div>

        {/* Top level metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2 text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <div className="text-xs font-semibold uppercase tracking-wider">All-Time Revenue</div>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(totalAllTimeRevenue)}
            </div>
          </div>
          <div className="glass-card p-6 border-amber-500/10">
            <div className="flex items-center gap-3 mb-2 text-amber-400/80">
              <Receipt className="w-4 h-4" />
              <div className="text-xs font-semibold uppercase tracking-wider">Total GST Collected</div>
            </div>
            <div className="text-3xl font-bold text-amber-400">
              {formatCurrency(totalAllTimeGST)}
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2 text-gray-400">
              <Building2 className="w-4 h-4" />
              <div className="text-xs font-semibold uppercase tracking-wider">Invoices Issued</div>
            </div>
            <div className="text-3xl font-bold text-white">
              {validInvoices.length}
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-white">Monthly Breakdown</h2>
          </div>
          
          {monthlyStats.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No finalized invoices found. Send or mark invoices as paid to see analytics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-dark-800/50 text-gray-400 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Month</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-center">Invoices</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Revenue</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">CGST</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">SGST</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">IGST</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {monthlyStats.map((stat) => (
                    <tr key={stat.monthKey} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{stat.label}</td>
                      <td className="px-6 py-4 text-gray-400 text-center">{stat.count}</td>
                      <td className="px-6 py-4 text-white font-medium text-right">{formatCurrency(stat.revenue)}</td>
                      <td className="px-6 py-4 text-gray-400 text-right">{stat.cgst > 0 ? formatCurrency(stat.cgst) : "-"}</td>
                      <td className="px-6 py-4 text-gray-400 text-right">{stat.sgst > 0 ? formatCurrency(stat.sgst) : "-"}</td>
                      <td className="px-6 py-4 text-gray-400 text-right">{stat.igst > 0 ? formatCurrency(stat.igst) : "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => downloadCSV(stat.monthKey, stat.invoices)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors text-xs font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          CSV
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
