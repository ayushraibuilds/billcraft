import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";
import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Pricing — BillCraft",
  description: "Simple, freelancer-friendly pricing. Start free, upgrade when BillCraft pays for itself.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-dark-900">
      <Navbar />

      <section className="pt-32 pb-20 section-padding">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Start free. Upgrade only when BillCraft pays for itself — which
              happens after your first invoice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <PricingCard
              name="Free"
              price="₹0"
              period="/forever"
              features={[
                { text: "3 documents/month", included: true },
                { text: "Invoice + Proposal", included: true },
                { text: "PDF download", included: true },
                { text: "Basic templates", included: true },
                { text: "\"Powered by BillCraft\" watermark", included: true },
                { text: "GST invoice mode", included: false },
                { text: "Custom branding", included: false },
                { text: "Email to client", included: false },
              ]}
              ctaText="Start Free"
              ctaHref="/generate"
            />
            <PricingCard
              name="Pro"
              price={199}
              period="/mo"
              popular
              features={[
                { text: "Unlimited documents", included: true },
                { text: "Invoice + Proposal + Contract", included: true },
                { text: "PDF + Email to client", included: true },
                { text: "All niche templates", included: true },
                { text: "No watermark", included: true },
                { text: "GST-compliant invoices", included: true },
                { text: "Custom logo + branding", included: true },
                { text: "Client history + search", included: true },
              ]}
              ctaText="Get Pro — ₹199/mo"
              ctaHref="/generate"
            />
            <PricingCard
              name="Agency"
              price={499}
              period="/mo"
              features={[
                { text: "Everything in Pro", included: true },
                { text: "5 team members", included: true },
                { text: "Payment reminders", included: true },
                { text: "Client portal", included: true },
                { text: "Razorpay payment links", included: true },
                { text: "Revenue analytics", included: true },
                { text: "Custom email domain", included: true },
                { text: "API access", included: true },
              ]}
              ctaText="Contact for Agency"
              ctaHref="mailto:hello@billcraft.in?subject=Agency%20Plan%20Inquiry"
            />
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Is the free tier really free forever?",
                  a: "Yes! You get 3 documents per month, forever. No credit card required.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "UPI, debit/credit cards, and net banking via Razorpay. Cancel anytime.",
                },
                {
                  q: "Are the invoices GST-compliant?",
                  a: "Yes. Pro and Agency plans generate invoices with GSTIN, HSN/SAC codes, and correct CGST/SGST/IGST splits.",
                },
                {
                  q: "Can I switch plans?",
                  a: "Upgrade or downgrade anytime. Changes take effect immediately.",
                },
              ].map((faq, i) => (
                <div key={i} className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-gray-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
