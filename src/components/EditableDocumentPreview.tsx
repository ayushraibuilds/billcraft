"use client";

import { useState } from "react";
import type { SavedDocument } from "@/lib/store";
import type { InvoiceOutput, ProposalOutput, LineItem } from "@/lib/ai/schema";
import { Check, X, Plus, Trash2 } from "lucide-react";

interface Props {
  document: SavedDocument;
  onSave: (edited: SavedDocument) => void;
  onCancel: () => void;
}

export default function EditableDocumentPreview({ document, onSave, onCancel }: Props) {
  const isInvoice = document.type === "invoice";
  const [data, setData] = useState<InvoiceOutput | ProposalOutput>(
    JSON.parse(JSON.stringify(document.output_json))
  );

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...data.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Automatically recalculate amount if rate or quantity changes
    if (field === "rate" || field === "quantity") {
      newItems[index].amount = newItems[index].rate * newItems[index].quantity;
    }
    
    recalculateTotals(newItems);
  };

  const handeAddLineItem = () => {
    const newItems = [...data.line_items, { description: "", quantity: 1, rate: 0, amount: 0 }];
    recalculateTotals(newItems);
  };

  const handleRemoveLineItem = (index: number) => {
    const newItems = data.line_items.filter((_, i) => i !== index);
    recalculateTotals(newItems);
  };

  const recalculateTotals = (newItems: LineItem[]) => {
    const subtotal = newItems.reduce((acc, item) => acc + item.amount, 0);
    const gst_amount = (subtotal * data.gst_rate) / 100;
    const total = subtotal + gst_amount;
    
    // If we have cgst/sgst/igst in the original, recalculate those too
    let cgst_amount = data.cgst_amount;
    let sgst_amount = data.sgst_amount;
    let igst_amount = data.igst_amount;
    
    if (cgst_amount !== undefined && sgst_amount !== undefined) {
      cgst_amount = gst_amount / 2;
      sgst_amount = gst_amount / 2;
    } else if (igst_amount !== undefined) {
      igst_amount = gst_amount;
    }

    const advance_paid = isInvoice ? (data as InvoiceOutput).advance_paid : 0;
    const balance_due = total - advance_paid;

    setData({
      ...data,
      line_items: newItems,
      subtotal,
      gst_amount,
      cgst_amount,
      sgst_amount,
      igst_amount,
      total,
      ...(isInvoice ? { balance_due } : {}),
    } as unknown as InvoiceOutput | ProposalOutput);
  };

  const handleTextChange = (field: keyof InvoiceOutput | keyof ProposalOutput, value: string) => {
    setData({ ...data, [field]: value } as unknown as InvoiceOutput | ProposalOutput);
  };

  const handleFinalize = () => {
    // Merge the edited data back into the document
    const finalDoc = { ...document, output_json: data, amount: data.total };
    onSave(finalDoc);
  };

  const getSafeDateStr = (raw?: string) => {
    if (!raw) return "";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Review & Edit Generated {isInvoice ? "Invoice" : "Proposal"}</h2>
          <p className="text-sm text-gray-400">Make final adjustments to line items and amounts before saving.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button onClick={onCancel} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button onClick={handleFinalize} className="btn-primary flex items-center gap-1.5 !py-2 !px-4">
            <Check className="w-4 h-4" /> Finalize & Save
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Client Name</label>
            <input 
              value={data.client_name} 
              onChange={(e) => handleTextChange("client_name", e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Payment Terms</label>
            <input 
              value={data.payment_terms} 
              onChange={(e) => handleTextChange("payment_terms", e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
            />
          </div>
          {isInvoice && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Due Date</label>
              <input 
                type="date"
                value={getSafeDateStr((data as InvoiceOutput).due_date)} 
                onChange={(e) => handleTextChange("due_date" as keyof InvoiceOutput, e.target.value)}
                className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
              />
            </div>
          )}
        </div>

        <div>
           <div className="flex items-center justify-between mb-2">
             <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Line Items</label>
             <button onClick={handeAddLineItem} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
               <Plus className="w-3.5 h-3.5" /> Add Item
             </button>
           </div>
           
           <div className="space-y-3">
             {data.line_items.map((item, i) => (
               <div key={i} className="flex gap-3 items-start bg-dark-800/50 p-3 rounded-lg border border-white/5">
                 <div className="flex-1 space-y-2">
                   <input 
                     value={item.description}
                     onChange={(e) => handleLineItemChange(i, "description", e.target.value)}
                     placeholder="Description"
                     className="w-full bg-dark-700/50 border border-transparent hover:border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors"
                   />
                   <input 
                     value={item.details || ""}
                     onChange={(e) => handleLineItemChange(i, "details", e.target.value)}
                     placeholder="Optional details..."
                     className="w-full bg-transparent border border-transparent hover:border-white/10 rounded px-3 py-1 text-xs text-gray-400 focus:outline-none focus:border-amber-500/40 transition-colors"
                   />
                 </div>
                 <div className="w-20">
                   <input 
                     type="number"
                     value={item.quantity}
                     onChange={(e) => handleLineItemChange(i, "quantity", Number(e.target.value))}
                     className="w-full bg-dark-700/50 border border-transparent hover:border-white/10 rounded px-2 py-1.5 text-sm text-center text-white focus:outline-none focus:border-amber-500/40"
                   />
                 </div>
                 <div className="w-28 relative">
                   <span className="absolute left-3 top-1.5 text-gray-500 text-sm">₹</span>
                   <input 
                     type="number"
                     value={item.rate}
                     onChange={(e) => handleLineItemChange(i, "rate", Number(e.target.value))}
                     className="w-full bg-dark-700/50 border border-transparent hover:border-white/10 rounded pl-7 pr-2 py-1.5 text-sm text-right text-white focus:outline-none focus:border-amber-500/40"
                   />
                 </div>
                 <div className="w-28 text-right py-1.5 text-sm font-semibold text-white">
                   ₹{item.amount.toLocaleString("en-IN")}
                 </div>
                 <button 
                   onClick={() => handleRemoveLineItem(i)}
                   className="p-1.5 text-gray-500 hover:text-red-400 transition-colors mt-0.5"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
           </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <div className="w-64 space-y-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>₹{data.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>GST ({data.gst_rate}%)</span>
              <span>₹{data.gst_amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span>₹{data.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Additional Notes</label>
          <textarea
            value={data.notes || ""}
            onChange={(e) => handleTextChange("notes", e.target.value)}
            className="w-full bg-dark-700 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40 min-h-[80px]"
            placeholder="Thank you for your business!"
          />
        </div>

      </div>
    </div>
  );
}
