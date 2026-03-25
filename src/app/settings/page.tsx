"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Save,
  Upload,
  Building2,
  CreditCard,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSettings, saveSettings, type BusinessSettings } from "@/lib/store";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<BusinessSettings>({
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
  });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getSettings();
    setFormData(stored);
  }, []);

  const handleChange = (field: keyof BusinessSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      alert("Logo must be under 500KB");
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
      <nav className="border-b border-white/5 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Bill<span className="gradient-text">Craft</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-10">
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
