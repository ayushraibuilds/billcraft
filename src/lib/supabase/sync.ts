import { createClient } from "@/lib/supabase/client";
import type { SavedDocument, BusinessSettings, Client } from "@/lib/store";

/**
 * Get authenticated user ID (client-side).
 * Returns null if not logged in or Supabase is not configured.
 */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Sync settings to Supabase profiles table.
 */
export async function syncSettingsToCloud(
  userId: string,
  settings: BusinessSettings
): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: settings.full_name,
    business_name: settings.business_name,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    gstin: settings.gstin,
    state_code: settings.state_code,
    bank_account_name: settings.bank_account_name,
    bank_account_number: settings.bank_account_number,
    bank_ifsc: settings.bank_ifsc,
    bank_name: settings.bank_name,
    upi_id: settings.upi_id,
    default_payment_terms: settings.default_payment_terms,
    document_prefix: settings.document_prefix,
    document_sequence: settings.document_sequence,
    theme: settings.theme,
    // Note: logo_base64 is NOT stored in Supabase (too large, use Storage bucket later)
  });

  if (error) {
    console.error("Sync settings error:", error.message);
  }
}

/**
 * Fetch settings from Supabase profiles table.
 */
export async function fetchCloudSettings(
  userId: string
): Promise<Partial<BusinessSettings> | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    full_name: data.full_name || "",
    business_name: data.business_name || "",
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
    gstin: data.gstin || "",
    state_code: data.state_code || "",
    bank_account_name: data.bank_account_name || "",
    bank_account_number: data.bank_account_number || "",
    bank_ifsc: data.bank_ifsc || "",
    bank_name: data.bank_name || "",
    upi_id: data.upi_id || "",
    default_payment_terms: data.default_payment_terms || "Due on receipt",
    document_prefix: data.document_prefix || "INV-",
    document_sequence: data.document_sequence || 1,
    theme: data.theme || "standard",
  };
}

/**
 * Sync a single document to Supabase documents table.
 */
export async function syncDocumentToCloud(
  userId: string,
  doc: SavedDocument
): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase.from("documents").upsert({
    id: doc.id,
    user_id: userId,
    type: doc.type,
    service_category: doc.service_category,
    input_text: doc.input_text,
    output_json: doc.output_json,
    client_name: doc.client_name,
    client_company: doc.client_company || null,
    document_number: doc.document_number,
    amount: doc.amount,
    status: doc.status,
    ai_provider: doc.ai_provider,
    created_at: doc.created_at,
  });

  if (error) {
    console.error("Sync document error:", error.message);
  }
}

/**
 * Fetch all documents from Supabase for the logged-in user.
 */
export async function fetchCloudDocuments(
  userId: string
): Promise<SavedDocument[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    type: row.type as "invoice" | "proposal",
    service_category: row.service_category,
    input_text: row.input_text,
    output_json: row.output_json,
    client_name: row.client_name,
    client_company: row.client_company || undefined,
    document_number: row.document_number,
    amount: Number(row.amount),
    status: row.status as SavedDocument["status"],
    ai_provider: row.ai_provider,
    created_at: row.created_at,
  }));
}

/**
 * Delete a document from Supabase.
 */
export async function deleteDocumentFromCloud(docId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase.from("documents").delete().eq("id", docId);
  if (error) {
    console.error("Delete cloud document error:", error.message);
  }
}

/**
 * Update document status in Supabase.
 */
export async function updateDocumentStatusInCloud(
  docId: string,
  status: SavedDocument["status"]
): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("documents")
    .update({ status })
    .eq("id", docId);

  if (error) {
    console.error("Update cloud doc status error:", error.message);
  }
}

/**
 * Merge local documents with cloud documents.
 * Returns the merged list (newest first), and syncs any local-only docs to the cloud.
 */
export async function mergeLocalAndCloud(
  userId: string,
  localDocs: SavedDocument[]
): Promise<SavedDocument[]> {
  const cloudDocs = await fetchCloudDocuments(userId);
  const cloudIds = new Set(cloudDocs.map((d) => d.id));

  // Upload any local-only docs to Supabase
  const localOnlyDocs = localDocs.filter((d) => !cloudIds.has(d.id));
  for (const doc of localOnlyDocs) {
    await syncDocumentToCloud(userId, doc);
  }

  // Merge: combine cloud + local-only
  const merged = [...cloudDocs, ...localOnlyDocs];

  // Sort newest first
  merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return merged;
}

// ── Clients Sync ──

/**
 * Sync a single client to Supabase clients table.
 */
export async function syncClientToCloud(
  userId: string,
  client: Client
): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase.from("clients").upsert({
    id: client.id,
    user_id: userId,
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: client.address,
    gstin: client.gstin,
    state_code: client.state_code,
    created_at: client.created_at,
  });

  if (error) {
    console.error("Sync client error:", error.message);
  }
}

/**
 * Fetch all clients from Supabase for the logged-in user.
 */
export async function fetchCloudClients(userId: string): Promise<Client[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    company: row.company || "",
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
    gstin: row.gstin || "",
    state_code: row.state_code || "",
    created_at: row.created_at,
  }));
}

/**
 * Delete a client from Supabase.
 */
export async function deleteClientFromCloud(clientId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) {
    console.error("Delete cloud client error:", error.message);
  }
}

/**
 * Merge local clients with cloud clients.
 * Returns merged list (newest first), and syncs local-only to cloud.
 */
export async function mergeLocalAndCloudClients(
  userId: string,
  localClients: Client[]
): Promise<Client[]> {
  const cloudClients = await fetchCloudClients(userId);
  const cloudIds = new Set(cloudClients.map((c) => c.id));

  // Upload any local-only clients to Supabase
  const localOnly = localClients.filter((c) => !cloudIds.has(c.id));
  for (const client of localOnly) {
    await syncClientToCloud(userId, client);
  }

  const merged = [...cloudClients, ...localOnly];
  merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return merged;
}
