import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://billcraft.vercel.app"),
  title: "BillCraft — AI Invoice & Proposal Generator for Indian Freelancers",
  description:
    "Paste your messy project notes → get a professional, GST-compliant invoice or proposal PDF in 60 seconds. Free for 3 documents/month.",
  keywords: [
    "invoice generator",
    "proposal generator",
    "freelancer invoice",
    "GST invoice",
    "AI invoice",
    "Indian freelancer",
    "billing tool",
  ],
  openGraph: {
    title: "BillCraft — AI Invoice & Proposal Generator",
    description:
      "Turn messy project notes into professional invoices and proposals in 60 seconds.",
    type: "website",
    url: "https://billcraft.vercel.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BillCraft — AI Invoice & Proposal Generator for Indian Freelancers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BillCraft — AI Invoice & Proposal Generator",
    description:
      "Messy notes → Professional PDFs in 60 seconds. Free for Indian freelancers.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
