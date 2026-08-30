"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SignInModal } from "@/components/sign-in-modal";

export function Hero() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <header
      className="relative pt-32 pb-20 md:pt-48 md:pb-32 lg:pt-56 lg:pb-40 overflow-hidden"
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Copy */}
        <div className="max-w-3xl">
          <p className="mb-6 text-sm font-medium text-terracotta uppercase tracking-wider">
            AI-Powered Client Updates
          </p>
          <h1 className="font-display text-display font-bold text-ink leading-tight tracking-tight">
            Stop writing updates.
            <br />
            <span style={{ color: '#C1613D' }} className="italic">Start sending them.</span>
          </h1>
          <p className="mt-6 text-lg text-ink-soft max-w-xl leading-relaxed">
            Pulse connects to GitHub, Trello, Slack, and Asana — watches what actually
            happened — and drafts a client-ready update in your voice. You review,
            tweak, send. Minutes, not hours.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => setDemoModalOpen(true)}>
              Book a Demo
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#features">See How It Works</Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-ink-muted">
            <span className="font-medium">No credit card required</span> — 14-day free
            trial
          </p>

          {/* Trust signals */}
          <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-ink-muted">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>SOC 2 Type II certified</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Dashboard Mockup below copy */}
        <div className="mt-16 relative" aria-hidden="true">
          <DashboardMockup />
        </div>
      </div>

      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent-soft blur-3xl opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent-soft blur-3xl opacity-20" />
      </div>

      <SignInModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        initialMode="demo"
      />
    </header>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="relative bg-card border border-border rounded-xl shadow-[0_25px_50px_-12px_rgb(0,0,0,0.15)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-paper-1 border-b border-border">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          <div className="ml-4 flex-1 text-center text-sm text-ink-muted font-mono">
            pulse.app &nbsp;•&nbsp; Acme Platform &nbsp;•&nbsp; Weekly Digest
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-muted font-mono">
            <span className="px-2 py-1 rounded bg-accent-soft text-accent">Jul 14–18</span>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-3">
            <ClientUpdateCard />
            <div className="md:col-span-2 space-y-4">
              <ActivityFeed />
              <IntegrationsStatus />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-ink">This Week's Draft</h3>
              <Badge variant="default">Ready to Review</Badge>
            </div>
            <DraftPreview />
          </div>
        </div>
      </div>

      <ClippedCorner />
    </div>
  );
}

function ClientUpdateCard() {
  return (
    <div className="bg-paper-1 border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-accent uppercase tracking-wider">
            Acme Corp
          </p>
          <h3 className="font-display text-lg font-semibold text-ink mt-1">
            Weekly Update — Jul 14–18
          </h3>
        </div>
        <div className="w-12 h-12 rounded-lg bg-accent-soft flex items-center justify-center">
          <svg className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
      </div>

      <div className="space-y-3">
        <DraftSection title="Done" color="text-emerald-600" items={["Shipped dark mode toggle", "Fixed checkout layout bug", "Updated API docs v2.3"]} />
        <DraftSection title="In Progress" color="text-amber-600" items={["Client onboarding flow (80%)", "Rate limiting middleware"]} />
        <DraftSection title="Blocked" color="text-red-600" items={["Waiting on design assets for landing page"]} />
        <DraftSection title="Next Week" color="text-blue-600" items={["Launch onboarding flow", "Q3 planning session"]} />
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-between text-sm">
        <span className="text-ink-muted">Last edited 2h ago</span>
        <button className="text-accent hover:underline font-medium">Approve & Send</button>
      </div>
    </div>
  );
}

function DraftSection({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent/60 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityFeed() {
  const activities = [
    { type: "github", text: "Fixed checkout page layout bug", time: "2h ago", repo: "acme/platform" },
    { type: "pr", text: "Merged PR #247: Dark mode toggle", time: "5h ago", repo: "acme/platform" },
    { type: "linear", text: "Completed: Client onboarding flow", time: "Yesterday", repo: "ENG-142" },
    { type: "slack", text: "Scope clarification with Sarah", time: "Yesterday", repo: "#acme-platform" },
    { type: "github", text: "Deployed v2.3.1 to production", time: "2 days ago", repo: "acme/platform" },
    { type: "github", text: "Code review: API rate limiting", time: "2 days ago", repo: "acme/platform" },
  ];

  return (
    <div className="bg-paper-1 border border-border rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-lg font-semibold text-ink">Activity Feed</h3>
        <span className="text-xs text-ink-muted font-mono">6 events</span>
      </div>
      <ul className="space-y-2.5" role="list">
        {activities.map((activity, i) => (
          <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-paper border border-border/50 transition-colors hover:border-accent/30 hover:bg-paper-1">
            <ActivityIcon type={activity.type} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink">{activity.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-ink-muted font-mono">{activity.repo}</span>
                <span className="text-xs text-ink-muted">{activity.time}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IntegrationsStatus() {
  const integrations = [
    { name: "GitHub", status: "connected", lastSync: "2m ago", icon: "github", count: 12 },
    { name: "Linear", status: "connected", lastSync: "5m ago", icon: "linear", count: 8 },
    { name: "Slack", status: "connected", lastSync: "1m ago", icon: "slack", count: 23 },
    { name: "Trello", status: "pending", lastSync: "—", icon: "trello", count: 0 },
  ];

  return (
    <div className="bg-paper-1 border border-border rounded-lg p-5 space-y-3">
      <h3 className="font-display text-lg font-semibold text-ink">Integrations</h3>
      <ul className="space-y-3" role="list">
        {integrations.map((int, i) => (
          <li key={int.name} className="flex items-center justify-between p-3 rounded-lg bg-paper border border-border/50">
            <div className="flex items-center gap-3">
              <IntegrationIcon type={int.icon} status={int.status} />
              <div>
                <p className="text-sm font-medium text-ink">{int.name}</p>
                <p className="text-xs text-ink-muted">{int.count} new events {int.status === "connected" ? `• ${int.lastSync}` : "• not connected"}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              int.status === "connected"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              {int.status === "connected" ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Pending
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IntegrationIcon({ type, status }: { type: string; status: string }) {
  const icons: Record<string, React.ReactNode> = {
    github: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
    linear: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21 12.65c0 2.22-1.8 4.02-4.02 4.02H6.98c-2.22 0-4.02-1.8-4.02-4.02V11.35c0-2.22 1.8-4.02 4.02-4.02h10c2.22 0 4.02 1.8 4.02 4.02v1.3zM7 11h10v2H7z" />
      </svg>
    ),
    slack: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.424.755-.613 1.144a19.276 19.276 0 0 1-1.877-.514.077.077 0 0 0-.112.011l-1.768 1.577a.076.076 0 0 0-.02.107 12.604 12.604 0 0 1 2.323 7.431.077.077 0 0 1-.116.095l-4.636-.927a.077.077 0 0 0-.096.05l-1.542 2.468a.076.076 0 0 0 .024.116c2.891 1.363 5.736 2.977 8.485 4.855a.077.077 0 0 0 .124-.007l2.877-3.3a.077.077 0 0 0 .027-.1v-7.09a.077.077 0 0 0-.077-.077 21.526 21.526 0 0 0-2.478-.911.077.077 0 0 0-.087.07v1.599a.077.077 0 0 1-.145.057l-1.499-.813a.077.077 0 0 0-.102-.008 18.065 18.065 0 0 1-4.172 2.096.077.077 0 0 1-.12-.077l-.765-4.041a.077.077 0 0 1 .086-.113c2.221-1.477 4.278-3.182 6.148-5.127a.076.076 0 0 0 .015-.127l-1.274-3.274a.077.077 0 0 1 .094-.107ZM12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
      </svg>
    ),
    trello: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 14H6V8h12v10zm0-12H6V6h12v2z" />
      </svg>
    ),
  };

  const bgColor = status === "connected" ? "bg-accent-soft" : "bg-amber-100/50 dark:bg-amber-900/20";
  const iconColor = status === "connected" ? "text-accent" : "text-amber-600 dark:text-amber-400";

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgColor} ${iconColor}`}>
      {icons[type] || icons.github}
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    github: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
    pr: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <path d="M11 18H8a2 2 0 0 1-2-2V9" />
      </svg>
    ),
    linear: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    ),
    slack: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  };

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent flex-shrink-0">
      {icons[type] || icons.github}
    </div>
  );
}

function DraftPreview() {
  return (
    <div className="bg-paper-1 border border-border rounded-lg p-5 space-y-3 font-body text-sm text-ink-soft leading-relaxed">
      <p className="font-medium text-ink">Hi Sarah,</p>
      <p>Here's what happened this week on the Acme Platform project:</p>
      <div className="space-y-2 pl-4 border-l-2 border-accent/30">
        <p><strong className="text-emerald-600">✓ Done:</strong> Shipped dark mode toggle, fixed checkout layout bug, updated API docs to v2.3.</p>
        <p><strong className="text-amber-600">◐ In Progress:</strong> Client onboarding flow (80% — integrating Stripe webhook), rate limiting middleware.</p>
        <p><strong className="text-red-600">⊘ Blocked:</strong> Waiting on design assets for new landing page (requested Monday).</p>
      </div>
      <p>Next week we're launching the onboarding flow and kicking off Q3 planning. Let me know if you'd like to sync.</p>
      <p className="pt-2 border-t border-border">— Jordan</p>
    </div>
  );
}

function Badge({ variant = "default", children }: { variant?: "default" | "secondary" | "outline"; children: React.ReactNode }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const variants = {
    default: "bg-accent text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border bg-transparent",
  };
  return <span className={cn(base, variants[variant])}>{children}</span>;
}

function ClippedCorner() {
  return (
    <div
      className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-tl from-accent/10 to-transparent clip-path-polygon"
      style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      aria-hidden="true"
    />
  );
}