"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Zap,
  Plus,
  Search,
  TrendingUp,
  IndianRupee,
  BarChart3,
  Cloud,
  Repeat,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  getDocuments,
  getMonthlyUsage,
  saveDocument,
  updateDocument,
  type SavedDocument,
} from "@/lib/store";
import { getAuthUserId, mergeLocalAndCloud, syncDocumentToCloud } from "@/lib/supabase/sync";
import { useToast } from "@/components/Toast";
import type { InvoiceOutput, ProposalOutput } from "@/lib/ai/schema";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400",
  sent: "bg-blue-500/15 text-blue-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  overdue: "bg-red-500/15 text-red-400",
};

export default function DashboardPage() {
  const [documents, setDocuments] = useState<SavedDocument[]>(() => {
    if (typeof window === "undefined") return [];
    return getDocuments();
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "sent" | "paid" | "overdue">("all");
  const [monthlyUsage] = useState(() => {
    if (typeof window === "undefined") return 0;
    return getMonthlyUsage();
  });
  const [syncing, setSyncing] = useState(false);
  const [generatingRecurring, setGeneratingRecurring] = useState(false);
  const { toast } = useToast();

  const syncCloud = useCallback(async () => {
    const userId = await getAuthUserId();
    if (!userId) return;

    setSyncing(true);
    try {
      const merged = await mergeLocalAndCloud(userId, getDocuments());
      setDocuments(merged);
      // Also persist merged list to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("billcraft_documents", JSON.stringify(merged.slice(0, 200)));
      }
    } catch (e) {
      console.error("Cloud sync error:", e);
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncCloud();
  }, [syncCloud]);

  const dueRecurring = documents.filter((doc) => {
    const data = doc.output_json as Record<string, unknown>;
    if (!data.recurring_cadence || !data.recurring_next_date) return false;
    return new Date(data.recurring_next_date as string) <= new Date();
  });

  const handleGenerateDueRecurring = async () => {
    setGeneratingRecurring(true);
    const userId = await getAuthUserId();
    const newDocs: SavedDocument[] = [];
    
    for (const oldDoc of dueRecurring) {
      const data = oldDoc.output_json as Record<string, unknown>;
      const cadence = data.recurring_cadence as "weekly" | "monthly" | "yearly";
      
      const nextDate = new Date();
      if (cadence === "weekly") nextDate.setDate(nextDate.getDate() + 7);
      if (cadence === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      if (cadence === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      const newId = crypto.randomUUID();
      const newDocNumber = `INV-${Date.now().toString().slice(-6)}`;
      const newOutputJson = { ...data, recurring_next_date: nextDate.toISOString() } as unknown as InvoiceOutput | ProposalOutput;
      
      const newDoc: SavedDocument = {
        ...oldDoc,
        id: newId,
        document_number: newDocNumber,
        created_at: new Date().toISOString(),
        status: "draft",
        output_json: newOutputJson
      };
      
      const oldDocUpdatedData = { ...data };
      delete oldDocUpdatedData.recurring_cadence;
      delete oldDocUpdatedData.recurring_next_date;
      const cleanOldOutput = oldDocUpdatedData as unknown as InvoiceOutput | ProposalOutput;
      
      updateDocument(oldDoc.id, { output_json: cleanOldOutput });
      saveDocument(newDoc);
      newDocs.push(newDoc);
      
      if (userId) {
         syncDocumentToCloud(userId, newDoc);
         syncDocumentToCloud(userId, { ...oldDoc, output_json: cleanOldOutput });
      }
    }
    
    setDocuments(getDocuments());
    setGeneratingRecurring(false);
    toast(`Generated ${newDocs.length} recurring documents`, "success");
  };

  const filtered = documents.filter((doc) => {
    const matchesSearch = doc.client_name.toLowerCase().includes(search.toLowerCase()) || doc.document_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBilled = documents.reduce((sum, d) => sum + d.amount, 0);
  const paidCount = documents.filter((d) => d.status === "paid").length;

  return (
    <main className="min-h-screen bg-dark-900">
      {/* Header */}
      <nav className="border-b border-white/5 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Bill<span className="gradient-text">Craft</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/generate"
              className="btn-primary flex items-center gap-2 text-sm !py-2.5 !px-4"
            >
              <Plus className="w-4 h-4" />
              New Document
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Your documents and billing overview
            {syncing && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                <Cloud className="w-3.5 h-3.5 animate-pulse" />
                Syncing...
              </span>
            )}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "This Month",
              value: String(monthlyUsage),
              icon: FileText,
              sub: "of 3 free",
            },
            {
              label: "Total Billed",
              value: formatCurrency(totalBilled),
              icon: IndianRupee,
              sub: `${documents.length} documents`,
            },
            {
              label: "Paid",
              value: String(paidCount),
              icon: TrendingUp,
              sub: documents.length
                ? `${Math.round((paidCount / documents.length) * 100)}% rate`
                : "no documents yet",
            },
            {
              label: "Invoices vs Proposals",
              value: `${documents.filter((d) => d.type === "invoice").length} / ${documents.filter((d) => d.type === "proposal").length}`,
              icon: BarChart3,
              sub: "invoice / proposal",
            },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-gray-500">{stat.label}</span>
                <stat.icon className="w-4 h-4 text-amber-500/60" />
              </div>
              <p className="text-2xl font-bold text-white mb-0.5">
                {stat.value}
              </p>
              <span className="text-xs text-gray-600">{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* Documents */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500/60" />
            Recent Documents
          </h2>
          <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {/* Filter Tabs */}
            <div className="flex bg-white/5 rounded-xl p-1 shrink-0">
              {["all", "draft", "sent", "paid", "overdue"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as "all" | "draft" | "sent" | "paid" | "overdue")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                    statusFilter === status 
                      ? "bg-amber-500 text-dark-900" 
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 w-48 focus:outline-none focus:border-amber-500/30 transition-all focus:w-56"
              />
            </div>
          </div>
        </div>

        {/* Recurring Alert */}
        {dueRecurring.length > 0 && (
          <div className="mb-6 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card">
            <div>
              <h3 className="text-amber-400 font-semibold flex items-center gap-2 mb-1">
                <Repeat className="w-5 h-5" /> {dueRecurring.length} Recurring {dueRecurring.length === 1 ? "Invoice" : "Invoices"} Due
              </h3>
              <p className="text-sm text-amber-500/80">These documents are scheduled to be generated today.</p>
            </div>
            <button 
              onClick={handleGenerateDueRecurring} 
              disabled={generatingRecurring}
              className="btn-primary flex items-center justify-center gap-2 text-sm whitespace-nowrap min-w-[160px]"
            >
              {generatingRecurring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} 
              {generatingRecurring ? "Generating..." : "Generate All Now"}
            </button>
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((doc) => (
              <Link
                key={doc.id}
                href={`/dashboard/${doc.id}`}
                className="glass-card glass-card-hover p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 block"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-white">
                        {doc.client_name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {doc.document_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 capitalize">
                        {doc.type}
                      </span>
                      <span className="text-xs text-gray-700">·</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(new Date(doc.created_at))}
                      </span>
                      <span className="text-xs text-gray-700">·</span>
                      <span className="text-xs text-gray-600 capitalize">
                        {doc.service_category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(doc.amount)}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[doc.status]}`}
                  >
                    {doc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : documents.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-amber-400/60" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No documents yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Generate your first invoice or proposal to see it here
            </p>
            <Link
              href="/generate"
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Zap className="w-4 h-4" />
              Generate Your First Document
            </Link>
          </div>
        ) : (
          /* No search results */
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              No documents match &ldquo;{search}&rdquo;
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
