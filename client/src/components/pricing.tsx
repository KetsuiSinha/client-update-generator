"use client";

const plans = [
  {
    name: "Starter",
    price: 15,
    description: "For solo freelancers managing a few clients",
    features: [
      "Up to 3 active clients",
      "GitHub + Slack integration",
      "Weekly AI-generated drafts",
      "Tone calibration (1 example/client)",
      "Email & clipboard export",
      "Basic relevance filtering",
      "14-day history",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    price: 30,
    description: "For growing agencies with 10+ clients",
    features: [
      "Up to 10 active clients",
      "All 4 integrations (GitHub, Linear, Slack, Trello)",
      "Daily or weekly drafts",
      "Advanced tone learning (3 examples/client)",
      "Custom draft templates",
      "Priority relevance filtering",
      "Unlimited history",
      "Slack & Notion push",
      "Team workspace (3 seats)",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Agency",
    price: null,
    description: "For established agencies at scale",
    features: [
      "Unlimited clients",
      "All integrations + custom webhooks",
      "On-demand + scheduled drafts",
      "Full voice profiles per client",
      "Custom AI prompts & rules",
      "ML relevance model (your data)",
      "SSO & audit logs",
      "Dedicated success manager",
      "Custom SLA & billing",
      "Unlimited team seats",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section className="py-24 lg:py-32" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="pricing-heading" className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-balance mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed">
            All plans include a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`relative rounded-2xl border transition-all ${
                plan.popular
                  ? "border-terracotta bg-paper-1 shadow-xl ring-2 ring-terracotta/20"
                  : "border-border bg-paper-1 hover:border-terracotta/30 hover:shadow-lg"
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta text-terracotta-foreground text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 space-y-6">
                <header>
                  <h3 className="font-display text-2xl font-semibold text-ink">{plan.name}</h3>
                  <p className="mt-2 text-ink-muted">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    {plan.price !== null ? (
                      <>
                        <span className="font-display text-5xl font-bold text-ink">${plan.price}</span>
                        <span className="text-ink-muted">/month</span>
                      </>
                    ) : (
                      <span className="font-display text-5xl font-bold text-ink">Custom</span>
                    )}
                  </div>
                </header>

                <ul className="space-y-4" role="list">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg
                        className="flex-shrink-0 mt-0.5 h-5 w-5 text-terracotta"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-ink-soft text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                    plan.popular
                      ? "bg-terracotta text-terracotta-foreground hover:bg-terracotta-strong"
                      : "bg-paper-2 text-ink border border-border hover:bg-paper-3"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-ink-muted mb-4">
            Need something custom?{" "}
            <a href="#contact" className="text-terracotta hover:underline font-medium">
              Let&apos;s talk about Enterprise
            </a>
          </p>
          <p className="text-sm text-ink-muted">
            All prices in USD. Annual billing available at 20% discount.
          </p>
        </div>
      </div>
    </section>
  );
}