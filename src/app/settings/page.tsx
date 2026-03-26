"use client";

import { useState } from "react";
import {
  Save,
  Upload,
  Building2,
  CreditCard,
  User,
  X,
  Download,
  FileUp,
  FileText,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSettings, saveSettings, exportAllData, importAllData, type BusinessSettings, type BillCraftExport } from "@/lib/store";
import { getAuthUserId, syncSettingsToCloud } from "@/lib/supabase/sync";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<BusinessSettings>(() => {
    if (typeof window === "undefined") {
      return {
        full_name: "", business_name: "", email: "", phone: "",
        address: "", gstin: "", state_code: "",
        bank_account_name: "", bank_account_number: "",
        bank_ifsc: "", bank_name: "", upi_id: "",
        logo_base64: "", default_payment_terms: "Due on receipt",
      };
    }
    return getSettings();
  });

  const handleChange = (field: keyof BusinessSettings, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value as never }));
    setSaved(false);
  };

  const handleSave = async () => {
    saveSettings(formData);
    setSaved(true);
    toast("Settings saved", "success");
    setTimeout(() => setSaved(false), 3000);

    // Cloud sync if logged in
    const userId = await getAuthUserId();
    if (userId) {
      await syncSettingsToCloud(userId, formData);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast("Logo must be under 500KB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, logo_base64: base64 }));
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setFormData((prev) => ({ ...prev, logo_base64: "" }));
    setSaved(false);
  };

  return (
    <main className="min-h-screen bg-dark-900">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-sm text-gray-500">
            Your business details appear on every invoice and proposal
          </p>
        </div>

        {/* Personal Info */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Personal Info
            </h2>
          </div>
          <div className="space-y-4">
            <InputField label="Full Name" value={formData.full_name} onChange={(v) => handleChange("full_name", v)} placeholder="Ayush Rai" />
            <InputField label="Email" value={formData.email} onChange={(v) => handleChange("email", v)} placeholder="ayush@example.com" type="email" />
            <InputField label="Phone" value={formData.phone} onChange={(v) => handleChange("phone", v)} placeholder="+91 98765 43210" />
          </div>
        </section>

        {/* Business Details */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Business Details
            </h2>
          </div>
          <div className="space-y-4">
            <InputField label="Business Name" value={formData.business_name} onChange={(v) => handleChange("business_name", v)} placeholder="Ayush Rai Design Studio" />
            <InputField label="Business Address" value={formData.address} onChange={(v) => handleChange("address", v)} placeholder="123, MG Road, Bangalore, Karnataka 560001" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="GSTIN (optional)" value={formData.gstin} onChange={(v) => handleChange("gstin", v)} placeholder="22AAAAA0000A1Z5" />
              <InputField label="State Code" value={formData.state_code} onChange={(v) => handleChange("state_code", v)} placeholder="29" />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Business Logo
              </label>
              {formData.logo_base64 ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.logo_base64}
                    alt="Logo preview"
                    className="h-20 w-auto rounded-xl border border-white/10"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-amber-500/30 transition-colors cursor-pointer">
                  <Upload className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">
                    Click to upload your logo (PNG, JPG — max 500KB)
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              )}
            </div>
          </div>
        </section>

        {/* Document Numbering */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Document Numbering
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Customize the sequence format for all new invoices and proposals. The Sequence Number will auto-increment.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="Document Prefix" 
              value={formData.document_prefix || ""} 
              onChange={(v) => handleChange("document_prefix", v)} 
              placeholder="INV-" 
            />
            <InputField 
              label="Next Sequence Number" 
              value={formData.document_sequence?.toString() || ""} 
              onChange={(v) => handleChange("document_sequence", parseInt(v) || 1)} 
              placeholder="1" 
              type="number" 
            />
          </div>
        </section>

        {/* Document Theme */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Document Theme
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Select a visual aesthetic for your generated PDFs and client emails.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["standard", "modern", "creative", "legal"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleChange("theme", t)}
                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-colors ${
                  formData.theme === t
                    ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-sm shadow-amber-500/20"
                    : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="h-16 w-full rounded bg-[#111] border border-white/10 overflow-hidden flex flex-col mb-1 relative">
                  {t === "standard" && (
                    <div className="p-2 w-full h-full flex flex-col gap-1 items-start bg-white">
                      <div className="w-1/2 h-1 bg-gray-600 rounded-sm"></div>
                      <div className="w-1/3 h-1 bg-gray-400 rounded-sm"></div>
                      <div className="mt-1 w-full h-px bg-gray-300"></div>
                      <div className="mt-auto w-full h-2 bg-gray-200 rounded-sm"></div>
                    </div>
                  )}
                  {t === "modern" && (
                    <div className="w-full h-full flex flex-col gap-1 relative overflow-hidden bg-slate-50">
                      <div className="absolute top-0 right-0 w-8 h-8 rounded-bl-xl bg-indigo-500 opacity-20"></div>
                      <div className="p-2 z-10">
                        <div className="w-1/3 h-2 bg-indigo-500 rounded-full mb-1"></div>
                        <div className="w-1/4 h-1 bg-slate-400 rounded-full"></div>
                        <div className="mt-2 w-full h-2 bg-indigo-100 rounded-lg"></div>
                      </div>
                    </div>
                  )}
                  {t === "creative" && (
                    <div className="p-2 w-full h-full flex flex-col gap-1 items-center bg-[#fdfbf7] justify-center border-4 border-white">
                      <div className="w-4 h-4 rounded-full border border-amber-600/30"></div>
                      <div className="w-1/2 h-0.5 bg-gray-400 mt-1"></div>
                      <div className="w-1/3 h-0.5 bg-gray-300"></div>
                    </div>
                  )}
                  {t === "legal" && (
                    <div className="p-2 w-full h-full flex flex-col gap-1 bg-white border-x-4 border-double border-gray-400">
                      <div className="w-full h-1 border-b-2 border-double border-black"></div>
                      <div className="mt-1 w-full flex justify-between"><div className="w-1/4 h-0.5 bg-gray-400"></div><div className="w-1/4 h-0.5 bg-gray-400"></div></div>
                      <div className="mt-auto w-full h-0.5 bg-black"></div>
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold capitalize tracking-wide">{t}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Bank Details */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Payment Details
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            These appear in the payment section of your invoices
          </p>
          <div className="space-y-4">
            <InputField label="Account Holder Name" value={formData.bank_account_name} onChange={(v) => handleChange("bank_account_name", v)} placeholder="Ayush Rai" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Account Number" value={formData.bank_account_number} onChange={(v) => handleChange("bank_account_number", v)} placeholder="XXXXXXXXXX4821" />
              <InputField label="IFSC Code" value={formData.bank_ifsc} onChange={(v) => handleChange("bank_ifsc", v)} placeholder="HDFC0001234" />
            </div>
            <InputField label="Bank Name" value={formData.bank_name} onChange={(v) => handleChange("bank_name", v)} placeholder="HDFC Bank" />
            <InputField label="UPI ID" value={formData.upi_id} onChange={(v) => handleChange("upi_id", v)} placeholder="ayush@upi" />
            <InputField label="Default Payment Terms" value={formData.default_payment_terms} onChange={(v) => handleChange("default_payment_terms", v)} placeholder="Due on receipt" />
          </div>
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          className={cn(
            "w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
            saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "btn-primary"
          )}
        >
          {saved ? (
            <>✓ Settings Saved</>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>

        {/* ── Data Export/Import ── */}
        <div className="glass-card p-6 mt-6">
          <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            Data Backup
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Export your documents and settings to a JSON file, or import from a backup.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const data = exportAllData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `billcraft-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast("Backup downloaded", "success");
              }}
              className="btn-secondary flex items-center gap-2 text-sm !py-2.5 !px-4"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <label className="btn-secondary flex items-center gap-2 text-sm !py-2.5 !px-4 cursor-pointer">
              <FileUp className="w-4 h-4" />
              Import Data
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target?.result as string) as BillCraftExport;
                      if (data.version !== 1 || !data.settings || !data.documents) {
                        toast("Invalid backup file", "error");
                        return;
                      }
                      const result = importAllData(data);
                      setFormData(getSettings());
                      toast(`Imported ${result.imported} documents (${result.skipped} skipped)`, "success");
                    } catch {
                      toast("Failed to read backup file", "error");
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}

function InputField({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
      />
    </div>
  );
}
