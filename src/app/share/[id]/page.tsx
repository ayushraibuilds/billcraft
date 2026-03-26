import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import type { SavedDocument } from "@/lib/store";
import type { InvoiceOutput } from "@/lib/ai/schema";
import { FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminClient = getAdminClient();

  if (!adminClient) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sharing Not Configured</h2>
          <p className="text-sm text-gray-500 mb-6">
            Supabase Service Role Key is required to authorize public links. Please set SUPABASE_SERVICE_ROLE_KEY in your deployment environment.
          </p>
        </div>
      </div>
    );
  }

  const { data: doc, error } = await adminClient
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !doc) {
    notFound();
  }

  const document = doc as SavedDocument;
  const isInvoice = document.type === "invoice";
  const data = document.output_json as InvoiceOutput;

  return (
    <main className="min-h-screen bg-dark-900 pb-20">
      {/* Read-Only Top Nav */}
      <nav className="border-b border-white/5 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Invosmith</span>
          </div>
          <div className="text-sm font-medium text-white px-3 py-1.5 bg-white/10 rounded-full">
            {document.document_number}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="glass-card bg-white p-8 sm:p-12 mb-8">
           <div className="flex flex-col sm:flex-row justify-between mb-12 border-b border-gray-200 pb-8">
              <div>
                 <h1 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-wide">{isInvoice ? "Invoice" : "Proposal"}</h1>
                 <p className="text-gray-500 font-medium">{document.document_number}</p>
                 <p className="text-gray-400 text-sm mt-1">Date: {formatDate(new Date(document.created_at))}</p>
              </div>
              <div className="mt-6 sm:mt-0 sm:text-right">
                 <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
                 <p className="font-medium text-gray-900">{data.client_name}</p>
                 {data.client_company && <p className="text-gray-600 text-sm">{data.client_company}</p>}
                 {data.client_email && <p className="text-gray-600 text-sm">{data.client_email}</p>}
              </div>
           </div>

           <div className="mb-12">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b-2 border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                       <th className="py-3 font-semibold">Description</th>
                       <th className="py-3 font-semibold text-center">Qty</th>
                       <th className="py-3 font-semibold text-right">Rate</th>
                       <th className="py-3 font-semibold text-right">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm">
                    {data.line_items.map((item, i: number) => (
                       <tr key={i} className="border-b border-gray-100">
                          <td className="py-4 text-gray-900">
                             <div className="font-medium">{item.description}</div>
                             {item.details && <div className="text-gray-500 text-xs mt-1 leading-relaxed">{item.details}</div>}
                          </td>
                          <td className="py-4 text-gray-600 text-center">{item.quantity}</td>
                          <td className="py-4 text-gray-600 text-right">{formatCurrency(item.rate)}</td>
                          <td className="py-4 text-gray-900 font-medium text-right">{formatCurrency(item.amount)}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Totals */}
           <div className="flex justify-end border-t-2 border-gray-200 pt-6">
               <div className="w-full sm:w-1/2 space-y-3">
                   <div className="flex justify-between text-sm text-gray-600">
                       <span>Subtotal</span>
                       <span>{formatCurrency(data.subtotal)}</span>
                   </div>
                   <div className="flex justify-between text-sm text-gray-600">
                       <span>GST ({data.gst_rate}%)</span>
                       <span>{formatCurrency(data.gst_amount)}</span>
                   </div>
                   <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200 mt-3">
                       <span>Total</span>
                       <span>{formatCurrency(data.total)}</span>
                   </div>
                   {isInvoice && (data.advance_paid || 0) > 0 && (
                       <div className="flex justify-between text-sm text-emerald-600 pt-2">
                           <span>Advance Paid</span>
                           <span>-{formatCurrency(data.advance_paid)}</span>
                       </div>
                   )}
                   {isInvoice && (
                       <div className="flex justify-between text-lg font-bold text-amber-700 bg-amber-50 p-4 rounded-xl mt-4">
                           <span>Balance Due</span>
                           <span>{formatCurrency(data.balance_due || data.total)}</span>
                       </div>
                   )}
               </div>
           </div>
        </div>
      </div>
    </main>
  );
}
