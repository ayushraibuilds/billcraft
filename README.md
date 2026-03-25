# BillCraft

AI-powered invoice & proposal generator for Indian freelancers. Paste messy project notes (even in Hinglish) → get a professional, GST-compliant PDF in 60 seconds.

## Features

- **AI Generation** — Gemini → Groq fallback → smart mock parser
- **GST Compliance** — Automatic CGST/SGST/IGST breakdown based on state codes
- **5 Niches** — Designer, Developer, Consultant, Photographer, Writer
- **Invoices + Proposals** — Full scope, deliverables, timeline, payment terms
- **Branded PDFs** — Logo, GSTIN, bank details, UPI — all from Settings
- **Email to Client** — Send documents via Resend
- **Document History** — Search, re-view, re-download, delete
- **Rate Limiting** — 10 req/min/IP on generate endpoint
- **PWA Ready** — Manifest, app icons, Apple meta tags

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Landing page |
| `/generate` | Static | AI document generator |
| `/dashboard` | Static | Document history |
| `/dashboard/[id]` | Dynamic | Document detail + email + delete |
| `/settings` | Static | Business settings |
| `/pricing` | Static | Plans & pricing |
| `/privacy` | Static | Privacy policy |
| `/terms` | Static | Terms of service |
| `/api/generate` | Dynamic | AI generation (rate limited) |
| `/api/send-email` | Dynamic | Email delivery via Resend |

## Quick Start

```bash
git clone https://github.com/ayushraibuilds/billcraft.git
cd billcraft
npm install
cp .env.example .env.local  # Add your API keys
npm run dev
```

## Environment Variables

```env
# AI Providers (at least one required for real generation)
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

# Email (optional — graceful fallback if missing)
RESEND_API_KEY=your_resend_key

# Supabase (optional — app works without it via localStorage)
NEXT_PUBLIC_SUPABASE_URL=placeholder
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **AI**: Google Gemini + Groq (LLaMA)
- **Email**: Resend
- **Storage**: localStorage (Supabase-ready)
- **Validation**: Zod
- **Icons**: Lucide React

## License

MIT
