import type { InvoiceOutput, ProposalOutput } from "@/lib/ai/schema";

// ── Types ──
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  state_code: string;
  created_at: string;
}
export interface BusinessSettings {
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  state_code: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_name: string;
  upi_id: string;
  logo_base64: string;
  default_payment_terms: string;
  document_prefix?: string;
  document_sequence?: number;
}

export interface SavedDocument {
  id: string;
  type: "invoice" | "proposal";
  service_category: string;
  input_text: string;
  output_json: InvoiceOutput | ProposalOutput;
  client_name: string;
  client_company?: string;
  document_number: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  ai_provider: string;
  created_at: string;
}

// ── Keys ──
const SETTINGS_KEY = "billcraft_settings";
const DOCUMENTS_KEY = "billcraft_documents";
const CLIENTS_KEY = "billcraft_clients";
const DOC_COUNTER_KEY = "billcraft_doc_counter";

// ── Settings ──
export function getSettings(): BusinessSettings {
  if (typeof window === "undefined") return getDefaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return getDefaultSettings();
    return { ...getDefaultSettings(), ...JSON.parse(raw) };
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings: Partial<BusinessSettings>): void {
  if (typeof window === "undefined") return;
  const current = getSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

function getDefaultSettings(): BusinessSettings {
  return {
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    address: "",
    gstin: "",
    state_code: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_name: "",
    upi_id: "",
    logo_base64: "",
    default_payment_terms: "Due on receipt",
    document_prefix: "INV-",
    document_sequence: 1,
  };
}

// ── Documents ──
export function getDocuments(): SavedDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DOCUMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDocument(doc: SavedDocument): void {
  if (typeof window === "undefined") return;
  const docs = getDocuments();
  docs.unshift(doc); // newest first
  // Keep max 100 documents in localStorage
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs.slice(0, 100)));
}

export function updateDocument(
  id: string,
  updates: Partial<SavedDocument>
): void {
  if (typeof window === "undefined") return;
  const docs = getDocuments();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx !== -1) {
    docs[idx] = { ...docs[idx], ...updates };
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
  }
}

export function deleteDocument(id: string): boolean {
  if (typeof window === "undefined") return false;
  const docs = getDocuments();
  const filtered = docs.filter((d) => d.id !== id);
  if (filtered.length === docs.length) return false; // not found
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(filtered));
  return true;
}

// ── Clients ──
export function getClients(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveClient(client: Client): void {
  if (typeof window === "undefined") return;
  const clients = getClients();
  const existingIdx = clients.findIndex((c) => c.id === client.id);
  if (existingIdx !== -1) {
    clients[existingIdx] = client;
  } else {
    clients.unshift(client); // newest first
  }
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

export function deleteClient(id: string): boolean {
  if (typeof window === "undefined") return false;
  const clients = getClients();
  const filtered = clients.filter((c) => c.id !== id);
  if (filtered.length === clients.length) return false;
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(filtered));
  return true;
}

// ── Document Counter ──
export function getNextDocumentNumber(type: "invoice" | "proposal"): string {
  if (typeof window === "undefined") return type === "invoice" ? "INV-0001" : "PROP-0001";
  try {
    const settings = getSettings();
    if (settings.document_prefix && settings.document_sequence !== undefined) {
      const generated = `${settings.document_prefix}${String(settings.document_sequence).padStart(4, "0")}`;
      saveSettings({ document_sequence: settings.document_sequence + 1 });
      return generated;
    }

    const raw = localStorage.getItem(DOC_COUNTER_KEY);
    const counters = raw ? JSON.parse(raw) : { invoice: 0, proposal: 0 };
    counters[type] = (counters[type] || 0) + 1;
    localStorage.setItem(DOC_COUNTER_KEY, JSON.stringify(counters));
    const prefix = type === "invoice" ? "INV" : "PROP";
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${String(counters[type]).padStart(3, "0")}`;
  } catch {
    return type === "invoice" ? "INV-0001" : "PROP-0001";
  }
}

// ── Usage Tracking ──
export function getMonthlyUsage(): number {
  if (typeof window === "undefined") return 0;
  try {
    const docs = getDocuments();
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return docs.filter((d) => d.created_at.startsWith(thisMonth)).length;
  } catch {
    return 0;
  }
}

// ── Export / Import ──
export interface BillCraftExport {
  version: 1;
  exported_at: string;
  settings: BusinessSettings;
  documents: SavedDocument[];
  clients: Client[];
  doc_counters: { invoice: number; proposal: number };
}

export function exportAllData(): BillCraftExport {
  const settings = getSettings();
  const documents = getDocuments();
  let docCounters = { invoice: 0, proposal: 0 };
  try {
    const raw = localStorage.getItem(DOC_COUNTER_KEY);
    if (raw) docCounters = JSON.parse(raw);
  } catch { /* empty */ }

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    settings,
    documents,
    clients: getClients(),
    doc_counters: docCounters,
  };
}

export function importAllData(data: BillCraftExport): { imported: number; skipped: number } {
  // Import settings (overwrite)
  saveSettings(data.settings);

  // Import documents (merge, skip duplicates by ID)
  const existing = getDocuments();
  const existingIds = new Set(existing.map((d) => d.id));
  let imported = 0;
  let skipped = 0;

  for (const doc of data.documents) {
    if (existingIds.has(doc.id)) {
      skipped++;
    } else {
      existing.push(doc);
      imported++;
    }
  }

  // Sort newest first
  existing.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(existing.slice(0, 200)));

  // Import doc counters (take max of existing and imported)
  try {
    const raw = localStorage.getItem(DOC_COUNTER_KEY);
    const current = raw ? JSON.parse(raw) : { invoice: 0, proposal: 0 };
    const merged = {
      invoice: Math.max(current.invoice || 0, data.doc_counters?.invoice || 0),
      proposal: Math.max(current.proposal || 0, data.doc_counters?.proposal || 0),
    };
    localStorage.setItem(DOC_COUNTER_KEY, JSON.stringify(merged));
  } catch { /* empty */ }

  // Import clients
  if (data.clients && Array.isArray(data.clients)) {
    const existingClients = getClients();
    const existingClientIds = new Set(existingClients.map((c) => c.id));
    for (const client of data.clients) {
      if (!existingClientIds.has(client.id)) {
        existingClients.push(client);
      }
    }
    existingClients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(existingClients));
  }

  return { imported, skipped };
}

