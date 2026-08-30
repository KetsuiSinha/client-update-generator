"use client";

import { useState, useEffect, FormEvent } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

type ModalMode = "signin" | "signup" | "demo";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: ModalMode;
}

export function SignInModal({ isOpen, onClose, initialMode = "signin" }: SignInModalProps) {
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError("");
      setEmail("");
      setPassword("");
      setName("");
      setCompany("");
    }
  }, [isOpen, initialMode]);

  const handleModeChange = (newMode: ModalMode) => {
    setMode(newMode);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "signin") {
        await login(email, password);
      } else if (mode === "signup") {
        await register(email, password, name);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDemo = mode === "demo";
  const isSignUp = mode === "signup";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={cn(
          "relative w-full max-w-md bg-card border border-border rounded-2xl shadow-[0_25px_50px_-12px_rgb(0,0,0,0.25)] overflow-hidden",
          "animate-in fade-in zoom-in-95 duration-200 ease-out"
        )}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-paper-2 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 id="modal-title" className="font-display text-2xl font-semibold text-ink mb-2">
                {isDemo ? "Book a Demo" : isSignUp ? "Create Account" : "Sign In"}
              </h2>
              <p className="text-ink-muted text-sm">
                {isDemo
                  ? "We'll walk you through Pulse and answer any questions. 20 minutes, no pressure."
                  : isSignUp
                  ? "Start your 14-day free trial. No credit card required."
                  : "Welcome back. Sign in to continue to Pulse."}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {(!isDemo || isSignUp) && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    disabled={isLoading}
                  />
                </div>
              )}

              {(isDemo || isSignUp) && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    required={isSignUp || isDemo}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Smith"
                    disabled={isLoading}
                  />
                </div>
              )}

              {(isDemo || isSignUp) && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-ink mb-1.5">
                    Company / Agency
                  </label>
                  <Input
                    id="company"
                    type="text"
                    required={isDemo}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Digital"
                    disabled={isLoading}
                  />
                </div>
              )}

              {isDemo && (
                <div>
                  <label htmlFor="clients" className="block text-sm font-medium text-ink mb-1.5">
                    Number of Active Clients
                  </label>
                  <select
                    id="clients"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all"
                    disabled={isLoading}
                  >
                    <option value="">Select...</option>
                    <option value="1-3">1–3 clients</option>
                    <option value="4-10">4–10 clients</option>
                    <option value="11-25">11–25 clients</option>
                    <option value="25+">25+ clients</option>
                  </select>
                </div>
              )}

              {isSignUp && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
              )}

              {isDemo && (
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-ink mb-1.5">
                    Anything specific you'd like to see? (optional)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-paper text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all resize-none"
                    placeholder="We use Linear + Slack mainly..."
                    disabled={isLoading}
                  />
                </div>
              )}

              <Button type="submit" className="w-full py-3" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : isDemo ? "Book Demo" : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            {/* Switch mode */}
            {!isDemo && (
              <div className="mt-6 text-center">
                <p className="text-sm text-ink-muted">
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                  <button
                    type="button"
                    onClick={() => handleModeChange(isSignUp ? "signin" : "signup")}
                    className="text-terracotta hover:underline font-medium"
                    disabled={isLoading}
                  >
                    {isSignUp ? "Sign in" : "Create account"}
                  </button>
                </p>
              </div>
            )}

            {/* Demo button when in signin/signup */}
            {!isDemo && (
              <div className="mt-4 text-center">
                <Button variant="outline" className="w-full" onClick={() => handleModeChange("demo")} disabled={isLoading}>
                  Book a Demo Instead
                </Button>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-ink-muted">
              By continuing, you agree to our{" "}
              <a href="#terms" className="text-terracotta hover:underline">Terms of Service</a>
              {" and "}
              <a href="#privacy" className="text-terracotta hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}