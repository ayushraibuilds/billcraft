"use client";

import { useState } from "react";
import { X, CheckCircle2, Zap, Shield, Sparkles, Loader2 } from "lucide-react";
import { loadRazorpay } from "@/lib/razorpay";
import { getAuthUserId } from "@/lib/supabase/sync";
import { useToast } from "@/components/Toast";
import { getSettings, saveSettings } from "@/lib/store";
import { useRouter } from "next/navigation";

// Extended window interface for Razorpay
declare global {
  interface Window {
    Razorpay: {
      new (options: Record<string, unknown>): {
        on: (event: string, handler: (response: Record<string, unknown>) => void) => void;
        open: () => void;
      };
    };
  }
}

export default function UpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // 1. Check if user is logged in
      const userId = await getAuthUserId();
      if (!userId) {
        toast("Please sign in or create an account to upgrade to Pro", "error");
        // Redirect to login with a callback redirect
        router.push("/login?redirect=/generate");
        return;
      }

      // 2. Load Razorpay
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast("Razorpay SDK failed to load. Are you online?", "error");
        setLoading(false);
        return;
      }

      // 3. Create Subscription on Backend
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create subscription setup");
      }

      // 4. Open Razorpay Checkout Window
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: "Invosmith Pro",
        description: "Unlimited AI Invoicing & Proposals",
        handler: async function (response: Record<string, unknown>) {
          toast("Payment successful! Welcome to Pro! 🚀", "success");
          
          // Optimistically update local settings until webhook syncs
          const currentSettings = getSettings();
          saveSettings({ ...currentSettings, plan: "pro" });
          
          // Optionally notify backend immediately or rely purely on webhook
          await fetch("/api/razorpay/verify-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        prefill: {
          email: data.userEmail || "",
        },
        theme: {
          color: "#f59e0b",
        },
      });

      rzp.on("payment.failed", function (response: Record<string, unknown>) {
        const errDesc = (response.error as Record<string, string>)?.description || "Payment failed";
        toast(errDesc, "error");
      });

      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 slide-in-from-bottom-2">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 sm:p-10 text-center relative overflow-hidden flex-1">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[200px] bg-amber-500/20 blur-[100px] pointer-events-none" />

          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative z-10">
            You&apos;ve reached your free limit.
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl mb-10 max-w-sm mx-auto relative z-10 leading-relaxed">
            Upgrade to <span className="text-amber-400 font-semibold">Pro</span> to unlock unlimited document generation and premium features.
          </p>

          <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-6 text-left relative z-10 mb-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
              <div>
                <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Monthly Plan</div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold tracking-tight text-white">₹199</span>
                  <span className="text-gray-500 font-medium mb-1">/mo</span>
                </div>
              </div>
              <div className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Best Value
              </div>
            </div>

            <ul className="space-y-4">
              {[
                { icon: Zap, label: "Unlimited Invoices & Proposals" },
                { icon: Sparkles, label: "Unlock Modern, Creative & Legal Themes" },
                { icon: Shield, label: "Remove 'Powered by Invosmith' Watermark" },
                { icon: CheckCircle2, label: "Cross-device Cloud Sync automatically" },
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-gray-300 font-medium">{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full btn-primary !py-4 text-base font-semibold shadow-xl shadow-amber-500/20 relative z-10 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up secure checkout...
              </>
            ) : (
              "Upgrade to Pro Now"
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-5 relative z-10 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 opacity-70" /> Secured with bank-grade 256-bit encryption by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
