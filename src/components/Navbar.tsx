"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FileText, Menu, X, Zap, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isAppPage = pathname !== "/" && pathname !== "/pricing";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-shadow">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Bill<span className="gradient-text">Craft</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {isAppPage ? (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  "text-sm transition-colors flex items-center gap-1.5",
                  pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                    ? "text-amber-400"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <Link
                href="/generate"
                className={cn(
                  "text-sm transition-colors",
                  pathname === "/generate"
                    ? "text-amber-400"
                    : "text-gray-400 hover:text-white"
                )}
              >
                Generate
              </Link>
              <Link
                href="/settings"
                className={cn(
                  "text-sm transition-colors flex items-center gap-1.5",
                  pathname === "/settings"
                    ? "text-amber-400"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link
                href="#features"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                How it works
              </Link>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAppPage ? (
            <Link
              href="/dashboard"
              className="btn-secondary flex items-center gap-2 text-sm !py-2 !px-4"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              My Documents
            </Link>
          ) : (
            <Link
              href="/generate"
              className="btn-primary flex items-center gap-2 text-sm !py-2.5 !px-5"
            >
              <Zap className="w-4 h-4" />
              Generate Free
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-400"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl px-6 py-4 space-y-3">
          {isAppPage ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-gray-400 py-1"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link
                href="/generate"
                className="block text-sm text-gray-400 py-1"
                onClick={() => setIsOpen(false)}
              >
                Generate
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 text-sm text-gray-400 py-1"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </>
          ) : (
            <>
              <Link
                href="#features"
                className="block text-sm text-gray-400"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="block text-sm text-gray-400"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-gray-400"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            </>
          )}
          <Link
            href="/generate"
            className="btn-primary block text-center text-sm !py-2.5"
            onClick={() => setIsOpen(false)}
          >
            Generate Free
          </Link>
        </div>
      )}
    </nav>
  );
}
