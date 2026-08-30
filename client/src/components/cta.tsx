"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CTA() {
  return (
    <section className="py-24 lg:py-32 bg-ink relative overflow-hidden" aria-labelledby="cta-heading">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" aria-hidden="true" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="cta-heading" className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-paper leading-tight text-balance mb-6">
          Ready to stop writing
          <br />
          <span className="text-terracotta">and start sending?</span>
        </h2>
        <p className="text-paper/70 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Join 50+ agencies saving 10+ hours a week on client communication.
          Book a 20-minute demo and see Pulse draft your next update live.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" variant="default" className="w-full sm:w-auto bg-paper hover:bg-paper/90 text-ink">
            <Link href="#demo">Book a Demo</Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto border-paper/30 hover:border-paper text-paper hover:bg-paper/10">
            <Link href="#features">Explore Features</Link>
          </Button>
        </div>

<p className="mt-8 text-sm text-paper/50">
          No credit card · 14-day trial · Cancel anytime
        </p>
      </div>
    </section>
  );
}