"use client";

const features = [
  {
    title: "Multi-tool ingestion",
    description:
      "Connect GitHub, Linear, Trello, and Slack in minutes. Pulse pulls commits, PRs, card moves, checklists, and messages — scoped to each client's projects. No manual copy-paste, no missed updates.",
    details: [
      "OAuth in 2 clicks per tool",
      "Auto-sync every 15 minutes",
      "Project/board/repo mapping per client",
      "Private repos & channels supported",
    ],
  },
  {
    title: "Relevance filtering",
    description:
      "Not every commit deserves a client update. Our classifier learns what matters per client — feature ships over typo fixes, shipped tickets over internal discussion. You approve the signal; noise stays out.",
    details: [
      "Per-client weighting rules",
      "Auto-hides WIP / fixup commits",
      "Groups related activity (PR + commits)",
      "Manual override always available",
    ],
  },
  {
    title: "Tone personalization",
    description:
      "Upload 1–3 past updates per client. Pulse builds a voice profile from your edits — formality, structure, vocabulary, sign-off style — and applies it to every future draft. Week three, you barely edit.",
    details: [
      "Learns from every edit you make",
      "Separate profile per client",
      "Preserves your 'we're on track' rhythm",
      "Exports style guide for team consistency",
    ],
  },
  {
    title: "Structured drafts",
    description:
      "Every update follows the same framework: Done · In Progress · Blocked · Next Week. Clients know exactly where to look. You just review, tweak, send. Consistency builds trust.",
    details: [
      "Four-section template (customizable)",
      "Auto-populated from filtered activity",
      "Inline editing with diff view",
      "Version history per draft",
    ],
  },
  {
    title: "Feedback loop",
    description:
      "Every edit you make trains the model. The more you use it, the less you edit. Agencies report 80% time savings by week three. Your voice profile compounds — it's an asset that appreciates.",
    details: [
      "Edit diffs captured automatically",
      "Weekly accuracy score per client",
      "Model retrains nightly",
      "Team-wide voice sharing",
    ],
  },
  {
    title: "Send anywhere",
    description:
      "One draft, every channel. Send via Pulse email, push to Slack/Notion/Linear, or copy to clipboard. No reformatting for each client's preferred tool. Your update reaches them where they already work.",
    details: [
      "Email with branded template",
      "Slack message (blocks formatted)",
      "Notion page append",
      "Linear/Asana comment",
      "Markdown / HTML / plain text export",
    ],
  },
];

export function Features() {
  return (
    <section className="py-24 lg:py-32" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="features-heading" className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-balance mb-6">
            Built for how agencies actually work
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed">
            Six capabilities that turn weekly update chaos into a 15-minute review.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group relative p-8 bg-paper-1 border border-border rounded-2xl transition-all hover:border-terracotta/30 hover:shadow-xl hover:bg-paper"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-soft text-terracotta">
                <FeatureIcon name={feature.title} />
              </div>
              <div className="mb-6 space-y-4">
                <h3 className="font-display text-xl font-semibold text-ink">{feature.title}</h3>
                <p className="text-ink-soft leading-relaxed">{feature.description}</p>
              </div>

              <ul className="space-y-3 border-t border-border/50 pt-6" role="list">
                {feature.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-soft">
                    <svg
                      className="flex-shrink-0 mt-0.5 h-4 w-4 text-terracotta/70 group-hover:text-terracotta transition-colors"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {detail}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    "Multi-tool ingestion": (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="3" width="16" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="11" width="16" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="19" width="16" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18 6v3M18 14v3M18 22v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    "Relevance filtering": (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    "Tone personalization": (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    "Structured drafts": (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" />
        <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" />
        <line x1="9" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    "Feedback loop": (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 3v5h5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1 6.74-2.74L21 16" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 21v-5h-5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    "Send anywhere": (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="22 2 15 22 11 13 22 2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  };

  return icons[name] || icons["Multi-tool ingestion"];
}