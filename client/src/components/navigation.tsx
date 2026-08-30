"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignInModal } from "@/components/sign-in-modal";

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
];

export function Navigation() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"signin" | "signup" | "demo">("signin");

  const openModal = (mode: "signin" | "signup" | "demo") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-xl font-medium text-ink"
            aria-label="Pulse — Home"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-accent">
              <svg
                className="h-5 w-5 text-accent-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 2v20M17 7H7" />
              </svg>
            </span>
            <span className="hidden sm:block">Pulse</span>
          </Link>

          <div className="hidden md:flex md:items-center md:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            <Button variant="ghost" size="sm" onClick={() => openModal("signin")}>
              Sign In
            </Button>
            <Button size="lg" onClick={() => openModal("demo")}>
              Book Demo
            </Button>
          </div>
        </div>
      </nav>

      <SignInModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
      />
    </>
  );
}