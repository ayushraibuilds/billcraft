import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy — Invosmith",
  description: "Invosmith privacy policy — how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="pt-32 pb-20 section-padding">
        <div className="mx-auto max-w-3xl prose-invert">
          <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

          <div className="space-y-8 text-sm text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">What We Collect</h2>
              <p>Invosmith collects only the minimum data needed to provide the service:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-400">
                <li>Business details you enter in Settings (name, GSTIN, address, bank info) — stored in your browser only</li>
                <li>Document data you generate (invoices, proposals, client names, amounts) — stored in your browser only</li>
                <li>Your IP address for rate limiting (not stored permanently)</li>
                <li>Recipient email address when you use the &ldquo;Email to client&rdquo; feature</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">How We Store It</h2>
              <p>All data is stored locally in your browser (localStorage). We do not transmit or store your business data on our servers. Your data never leaves your device unless you explicitly use the email feature.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">AI Processing</h2>
              <p>When you generate a document, your project description is sent to our AI provider (Google Gemini or Groq) for processing. We do not retain this data after the response is returned. The AI providers&apos; own privacy policies apply to this processing.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Third-Party Services</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-400">
                <li><strong>Google Gemini / Groq:</strong> AI text generation</li>
                <li><strong>Resend:</strong> Email delivery (when sending invoices to clients)</li>
                <li><strong>Vercel:</strong> Hosting and deployment</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Your Rights</h2>
              <p>You can delete all your data at any time by clearing your browser&apos;s localStorage or using the export/import feature in Settings. For any questions, contact us at <span className="text-amber-400">hello@invosmith.in</span>.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
              <p>Questions? Email us at <span className="text-amber-400">hello@invosmith.in</span></p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
