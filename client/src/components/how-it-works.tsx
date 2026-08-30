"use client";

const steps = [
  {
    number: "01",
    title: "Connect your tools",
    description:
      "OAuth into GitHub, Trello, Asana, and Slack. Map each client to their projects, boards, repos, and channels. Takes ~10 minutes per client.",
    icon: "plug",
  },
  {
    number: "02",
    title: "Calibrate tone",
    description:
      "Upload 1–3 past updates per client. Pulse analyzes your structure, vocabulary, and formality level. Or start with our professional default and refine as you go.",
    icon: "tune",
  },
  {
    number: "03",
    title: "Review the draft",
    description:
      "Every Monday (or on demand), Pulse delivers a structured draft: Done · In Progress · Blocked · Next Week. Open in the web editor, tweak inline, approve.",
    icon: "clipboard",
  },
  {
    number: "04",
    title: "Send & learn",
    description:
      "Send via Pulse email, copy to Slack, or push to Notion. Every edit you make trains your client's voice profile. Week three, you'll barely touch the draft.",
    icon: "send",
  },
];

const icons = {
  plug: (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18.434 4.015c-.387-1.576-1.888-2.79-3.513-2.79H9.078c-1.625 0-3.126 1.214-3.513 2.79L3.756 17.09a2.647 2.647 0 0 0 .01 3.824c.342.87 1.075 1.595 2.012 1.595h12.463c.938 0 1.67-.725 2.012-1.595a2.647 2.647 0 0 0 .01-3.824L18.434 4.015Z" />
      <path d="M12 12v8" />
      <path d="M9 16h6" />
      <path d="M12 4v4" />
    </svg>
  ),
  tune: (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v18" />
      <path d="M18 3v18" />
      <path d="M6 3v18" />
      <path d="M18 9h-12" />
      <path d="M18 15h-12" />
    </svg>
  ),
  clipboard: (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M16 4v4" />
      <path d="M8 4v4" />
      <path d="M12 18v-6" />
    </svg>
  ),
  send: (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 22 2" />
    </svg>
  ),
};

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 bg-paper-1" aria-labelledby="how-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="how-heading" className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-balance mb-6">
            From setup to send in four steps
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed">
            No workflow changes. No new habits. Just connect, calibrate, and let Pulse do the synthesis.
          </p>
        </header>

        <div className="relative">
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" aria-hidden="true" />
          <div className="hidden lg:block absolute left-1/2 top-1/2 w-px h-1/2 bg-gradient-to-b from-terracotta to-transparent -translate-x-1/2" aria-hidden="true" />

          <dl className="space-y-12 lg:space-y-16">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`relative flex gap-8 ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}
              >
                <dt className="flex-shrink-0 w-16 lg:w-20 text-right lg:text-left pt-2">
                  <span className="font-display text-4xl lg:text-5xl font-bold text-terracotta">
                    {step.number}
                  </span>
                </dt>
                <dd className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-terracotta-soft text-terracotta flex items-center justify-center">
                      {icons[step.icon as keyof typeof icons]}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-ink-muted leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}