"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: number | string;
  period: string;
  features: { text: string; included: boolean }[];
  popular?: boolean;
  ctaText?: string;
  ctaHref?: string;
  onCta?: () => void;
  disabled?: boolean;
}

export default function PricingCard({
  name,
  price,
  period,
  features,
  popular,
  ctaText = "Get Started",
  ctaHref,
  onCta,
  disabled,
}: PricingCardProps) {
  const buttonClasses = cn(
    "w-full py-3 rounded-xl text-sm font-semibold transition-all text-center block",
    popular ? "btn-primary" : "btn-secondary"
  );

  return (
    <div
      className={cn(
        "glass-card p-6 flex flex-col relative",
        popular && "border-amber-500/40 glow-amber"
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">
            {typeof price === "number" ? `₹${price}` : price}
          </span>
          <span className="text-sm text-gray-500">{period}</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 text-sm",
                feature.included ? "text-emerald-500" : "text-gray-600"
              )}
            >
              {feature.included ? "✓" : "—"}
            </span>
            <span
              className={cn(
                "text-sm",
                feature.included ? "text-gray-300" : "text-gray-600"
              )}
            >
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      {disabled ? (
        <span className="w-full py-3 rounded-xl text-sm font-semibold text-center block bg-gray-800 text-gray-500 cursor-not-allowed">
          {ctaText}
        </span>
      ) : ctaHref ? (
        <Link href={ctaHref} className={buttonClasses}>
          {ctaText}
        </Link>
      ) : (
        <button onClick={onCta} className={buttonClasses}>
          {ctaText}
        </button>
      )}
    </div>
  );
}
