"use client";

import Link from "next/link";

const footerLinks = {
  Product: [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#integrations", label: "Integrations" },
    { href: "#pricing", label: "Pricing" },
    { href: "#changelog", label: "Changelog" },
  ],
  Company: [
    { href: "#about", label: "About" },
    { href: "#blog", label: "Blog" },
    { href: "#careers", label: "Careers" },
    { href: "#press", label: "Press" },
    { href: "#contact", label: "Contact" },
  ],
  Resources: [
    { href: "#docs", label: "Documentation" },
    { href: "#help", label: "Help Center" },
    { href: "#community", label: "Community" },
    { href: "#api", label: "API Reference" },
    { href: "#status", label: "Status" },
  ],
  Legal: [
    { href: "#privacy", label: "Privacy" },
    { href: "#terms", label: "Terms" },
    { href: "#security", label: "Security" },
    { href: "#cookies", label: "Cookies" },
    { href: "#dpa", label: "DPA" },
  ],
};

const socialLinks = [
  { href: "#twitter", label: "Twitter", icon: "twitter" },
  { href: "#github", label: "GitHub", icon: "github" },
  { href: "#linkedin", label: "LinkedIn", icon: "linkedin" },
  { href: "#discord", label: "Discord", icon: "discord" },
];

const socialIcons = {
  twitter: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  ),
  github: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  linkedin: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  discord: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.424.755-.613 1.144a19.276 19.276 0 0 1-1.877-.514.077.077 0 0 0-.112.011l-1.768 1.577a.076.076 0 0 0-.02.107 12.604 12.604 0 0 1 2.323 7.431.077.077 0 0 1-.116.095l-4.636-.927a.077.077 0 0 0-.096.05l-1.542 2.468a.076.076 0 0 0 .024.116c2.891 1.363 5.736 2.977 8.485 4.855a.077.077 0 0 0 .124-.007l2.877-3.3a.077.077 0 0 0 .027-.1v-7.09a.077.077 0 0 0-.077-.077 21.526 21.526 0 0 0-2.478-.911.077.077 0 0 0-.087.07v1.599a.077.077 0 0 1-.145.057l-1.499-.813a.077.077 0 0 0-.102-.008 18.065 18.065 0 0 1-4.172 2.096.077.077 0 0 1-.12-.077l-.765-4.041a.077.077 0 0 1 .086-.113c2.221-1.477 4.278-3.182 6.148-5.127a.076.076 0 0 0 .015-.127l-1.274-3.274a.077.077 0 0 1 .094-.107ZM12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
    </svg>
  ),
};

export function Footer() {
  return (
    <footer className="bg-ink text-paper-2" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-display text-2xl font-medium text-paper mb-6" aria-label="Pulse — Home">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-accent">
                <svg className="h-5 w-5 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 2v20M17 7H7" />
                </svg>
              </span>
              <span>Pulse</span>
            </Link>
            <p className="text-sm text-paper-2/70 leading-relaxed max-w-xs">
              AI-powered client updates for agencies. Connect your tools, calibrate your voice, and stop writing updates manually.
            </p>
          </div>

          <nav aria-label="Product">
            <h3 className="font-medium text-paper mb-4 uppercase tracking-wider text-xs">Product</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.Product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-paper-2/70 hover:text-paper transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="font-medium text-paper mb-4 uppercase tracking-wider text-xs">Company</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.Company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-paper-2/70 hover:text-paper transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources">
            <h3 className="font-medium text-paper mb-4 uppercase tracking-wider text-xs">Resources</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.Resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-paper-2/70 hover:text-paper transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="font-medium text-paper mb-4 uppercase tracking-wider text-xs">Legal</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.Legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-paper-2/70 hover:text-paper transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-paper-3 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-paper-2/50">
              © {new Date().getFullYear()} Pulse. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="text-paper-2/50 hover:text-paper transition-colors"
                  aria-label={social.label}
                >
                  {socialIcons[social.icon as keyof typeof socialIcons]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}