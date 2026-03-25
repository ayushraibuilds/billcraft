import Link from "next/link";
import { FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Bill<span className="gradient-text">Craft</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              AI-powered invoice and proposal generator built for Indian
              freelancers. Paste your notes, get professional PDFs in 60 seconds.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <div className="space-y-3">
              <Link
                href="#features"
                className="block text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="block text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/generate"
                className="block text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Try Free
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <div className="space-y-3">
              <Link
                href="/privacy"
                className="block text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="block text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} BillCraft. Made with ❤️ for Indian
            freelancers.
          </p>
          <p className="text-xs text-gray-600">
            GST-compliant invoices · Professional proposals · 60 seconds
          </p>
        </div>
      </div>
    </footer>
  );
}
