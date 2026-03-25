import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";
import Link from "next/link";
import {
  Zap,
  FileText,
  IndianRupee,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Palette,
  Code,
  Briefcase,
  Camera,
  PenTool,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 section-padding overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">
              AI-powered · GST compliant · Free to start
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Messy notes to{" "}
            <span className="gradient-text">professional invoices</span>
            <br />
            in 60 seconds
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop spending hours formatting invoices and proposals. Paste your
            project description — even in Hinglish — and get a polished,
            GST-compliant PDF ready to send to your client.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/generate"
              className="btn-primary flex items-center gap-2 text-base"
            >
              <Zap className="w-5 h-5" />
              Generate Your First Invoice — Free
            </Link>
            <Link
              href="#how-it-works"
              className="btn-secondary flex items-center gap-2 text-base"
            >
              See how it works
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Demo Card */}
          <div className="glass-card p-6 max-w-2xl mx-auto glow-amber">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-xs text-gray-500 ml-2">BillCraft</span>
            </div>
            <div className="bg-dark-700 rounded-xl p-4 mb-3">
              <p className="text-sm text-gray-500 mb-2 text-left">Your input:</p>
              <p className="text-sm text-gray-300 text-left italic">
                &ldquo;Rohit ke liye website banaya — 3 pages, design + dev, 2 rounds
                of revisions, 45k total, 50% advance already paid&rdquo;
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-amber-400 my-3">
              <Sparkles className="w-4 h-4 animate-float" />
              <span className="text-xs font-medium">AI generates in ~10 seconds</span>
              <Sparkles className="w-4 h-4 animate-float" />
            </div>
            <div className="bg-dark-700 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-3 text-left">Generated invoice:</p>
              <div className="flex justify-between items-start mb-3">
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Your Design Studio</p>
                  <p className="text-xs text-gray-500">Web Design & Development</p>
                </div>
                <span className="text-xs font-medium bg-amber-500/15 text-amber-400 px-3 py-1 rounded-full">
                  INV-2026-047
                </span>
              </div>
              <div className="border-t border-white/5 pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Website Design & Development (3 pages, 2 revisions)</span>
                  <span className="text-white">₹45,000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Advance Received (50%)</span>
                  <span className="text-emerald-500">-₹22,500</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between text-sm font-semibold">
                  <span className="text-white">Balance Due</span>
                  <span className="text-amber-400">₹22,500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="scroll-mt-20 section-padding bg-dark-800/50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Three steps. No templates to fill. No formatting to fix.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Dump your notes",
                desc: "Paste a messy description of the project, services, and amounts. Works in English, Hindi, or Hinglish.",
                icon: PenTool,
              },
              {
                step: "02",
                title: "AI structures it",
                desc: "Our AI understands your niche, extracts details, calculates GST, and writes professional line items.",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "Download & send",
                desc: "Get a polished PDF invoice or proposal. Download it or email directly to your client.",
                icon: FileText,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="glass-card glass-card-hover p-6 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs font-bold text-amber-500/60 tracking-widest">
                  STEP {item.step}
                </span>
                <h3 className="text-lg font-semibold text-white mt-2 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="scroll-mt-20 section-padding">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">
              Built for <span className="gradient-text">Indian freelancers</span>
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Not another generic invoice tool. Every feature is designed for how
              Indian freelancers actually work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: IndianRupee,
                title: "GST-Compliant Invoices",
                desc: "Automatic CGST/SGST or IGST calculation, GSTIN fields, HSN/SAC codes — get it right every time.",
              },
              {
                icon: Sparkles,
                title: "AI-Powered Generation",
                desc: "Understands Hinglish input, professional terminology, and calculates everything from your messy notes.",
              },
              {
                icon: Shield,
                title: "Niche Templates",
                desc: "Designer, developer, consultant, photographer, writer — each with industry-specific language and structures.",
              },
              {
                icon: FileText,
                title: "Invoices & Proposals",
                desc: "Generate both. Proposals include scope, deliverables, timeline, and payment terms — client-ready.",
              },
              {
                icon: Clock,
                title: "60-Second Turnaround",
                desc: "What used to take 30-90 minutes now takes under a minute. Your time is worth more than formatting.",
              },
              {
                icon: Zap,
                title: "Document History",
                desc: "Every invoice and proposal is auto-saved. Search, re-view, and re-download from your dashboard anytime.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card glass-card-hover p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Service categories */}
          <div className="mt-14 text-center">
            <p className="text-sm text-gray-500 mb-6">
              Optimized templates for every freelancer niche
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Palette, label: "Designers" },
                { icon: Code, label: "Developers" },
                { icon: Briefcase, label: "Consultants" },
                { icon: Camera, label: "Photographers" },
                { icon: PenTool, label: "Writers" },
              ].map((cat) => (
                <div
                  key={cat.label}
                  className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-full px-5 py-2"
                >
                  <cat.icon className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-gray-300">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="scroll-mt-20 section-padding bg-dark-800/50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">
              Simple, freelancer-friendly pricing
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              BillCraft is currently in <span className="text-amber-400 font-medium">free beta</span>. All features are available at no cost while we refine the product.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingCard
              name="Free Beta"
              price="₹0"
              period="/forever"
              popular
              features={[
                { text: "3 documents/month", included: true },
                { text: "Invoice + Proposal", included: true },
                { text: "GST-compliant (CGST/SGST/IGST)", included: true },
                { text: "PDF download", included: true },
                { text: "Email to client", included: true },
                { text: "Custom logo + branding", included: true },
                { text: "Export/Import data backup", included: true },
                { text: "AI-powered generation", included: true },
              ]}
              ctaText="Start Free"
              ctaHref="/generate"
            />
            <PricingCard
              name="Pro"
              price={199}
              period="/mo"
              features={[
                { text: "Unlimited documents", included: true },
                { text: "Cloud sync across devices", included: true },
                { text: "Client directory", included: true },
                { text: "Recurring invoices", included: true },
                { text: "Invoice status tracking", included: true },
                { text: "Priority AI models", included: true },
                { text: "No watermark", included: true },
                { text: "PDF attachments in email", included: true },
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
                { text: "5 team members", included: true },
                { text: "Payment reminders", included: true },
                { text: "Client portal", included: true },
                { text: "Razorpay payment links", included: true },
                { text: "Revenue analytics", included: true },
                { text: "Custom email domain", included: true },
                { text: "API access", included: true },
              ]}
              ctaText="Coming Soon"
              disabled
            />
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="section-padding">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">
              Why BillCraft?
            </h2>
            <p className="text-gray-400 text-sm">
              Compare with the alternatives Indian freelancers actually use
            </p>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-500/10">
                  <th className="text-left text-amber-400 font-semibold px-5 py-3">Tool</th>
                  <th className="text-center text-amber-400 font-semibold px-4 py-3">Price</th>
                  <th className="text-center text-amber-400 font-semibold px-4 py-3 hidden sm:table-cell">AI Generation</th>
                  <th className="text-center text-amber-400 font-semibold px-4 py-3 hidden sm:table-cell">India GST</th>
                  <th className="text-center text-amber-400 font-semibold px-4 py-3">Proposals</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "BillCraft", price: "Free Beta", ai: true, gst: true, proposals: true, highlight: true },
                  { name: "Zoho Invoice", price: "₹750/mo", ai: false, gst: true, proposals: false },
                  { name: "FreshBooks", price: "₹2,000/mo", ai: false, gst: false, proposals: true },
                  { name: "Invoice Ninja", price: "Free/₹800", ai: false, gst: false, proposals: true },
                  { name: "Bonsai", price: "₹2,500/mo", ai: false, gst: false, proposals: true },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-white/5 ${row.highlight ? "bg-amber-500/5" : i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                  >
                    <td className={`px-5 py-3 ${row.highlight ? "text-white font-semibold" : "text-gray-400"}`}>
                      {row.name}
                    </td>
                    <td className={`px-4 py-3 text-center ${row.highlight ? "text-emerald-500 font-semibold" : "text-gray-400"}`}>
                      {row.price}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {row.ai ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-gray-600">✕</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {row.gst ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-gray-600">✕</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.proposals ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-gray-600">✕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="section-padding bg-dark-800/50">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Your next invoice is 60 seconds away
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            No signup required for your first 3 invoices. Just paste your notes
            and click generate.
          </p>
          <Link
            href="/generate"
            className="btn-primary inline-flex items-center gap-2 text-base"
          >
            <Zap className="w-5 h-5" />
            Generate Your First Invoice — Free
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
