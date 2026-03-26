import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";

export const metadata = {
  title: "Pricing — Invosmith",
  description: "Simple, freelancer-friendly pricing. Start free, upgrade when ready.",
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
              Invosmith is currently in <span className="text-amber-400 font-medium">free beta</span>. All features are available at no cost while we refine the product.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <PricingCard
              name="Free Beta"
              price="₹0"
              period="/forever"
              features={[
                { text: "3 documents/month", included: true },
                { text: "Invoice + Proposal", included: true },
                { text: "PDF download", included: true },
                { text: "GST-compliant (CGST/SGST/IGST)", included: true },
                { text: "AI generation (Gemini + Groq)", included: true },
                { text: "Custom branding + logo", included: true },
                { text: "Dashboard + history", included: true },
                { text: "Email document", included: true },
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
                { text: "All niche templates", included: true },
                { text: "No watermark", included: true },
                { text: "Client records + GSTIN", included: true },
                { text: "Invoice status tracking", included: true },
                { text: "Export/import data", included: true },
                { text: "Priority AI generation", included: true },
                { text: "Email reminders", included: true },
              ]}
              ctaText="Coming Soon"
              disabled
            />
            <PricingCard
              name="Agency"
              price={499}
              period="/mo"
              features={[
                { text: "Everything in Pro", included: true },
                { text: "Recurring invoices", included: true },
                { text: "Revenue analytics", included: true },
                { text: "Razorpay payment links", included: true },
                { text: "Multi-device sync", included: true },
                { text: "Custom email domain", included: true },
                { text: "Bulk document generation", included: true },
                { text: "Priority support", included: true },
              ]}
              ctaText="Coming Soon"
              disabled
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
                  q: "Are the invoices GST-compliant?",
                  a: "Yes. Invoices include GSTIN, HSN/SAC codes, and correct CGST/SGST/IGST splits based on your state code.",
                },
                {
                  q: "Where is my data stored?",
                  a: "All data is stored locally in your browser. You can export/import your data anytime from Settings.",
                },
                {
                  q: "When will Pro/Agency plans launch?",
                  a: "We're finalizing paid plans based on beta feedback. Join the waitlist to get notified when they're ready.",
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
