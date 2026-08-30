"use client";

const testimonials = [
  {
    quote:
      "We manage 23 clients across design, dev, and strategy. Before Pulse, Monday mornings were a 3-hour scramble. Now it's 20 minutes of review. The tone matching is scary good — clients have asked if I hired a writer.",
    author: "Marcus Chen",
    role: "Founder, Chen & Co",
    clients: "23",
    avatar: "MC",
  },
  {
    quote:
      "The GitHub integration alone paid for the year. We ship 40+ commits a week per project. Pulse filters the noise — clients see features, not 'fixed typo in README'. Our retention rate jumped 15% in Q1.",
    author: "Sarah Mitchell",
    role: "Technical Director, DevLabs",
    clients: "18",
    avatar: "SM",
  },
  {
    quote:
      "I was skeptical about AI writing client-facing updates. Uploaded three past emails per client, and the first draft needed two word changes. By week three, zero edits. It learned my 'we're on track, here's what's next' rhythm perfectly.",
    author: "James Rodriguez",
    role: "Solo Consultant",
    clients: "7",
    avatar: "JR",
  },
  {
    quote:
      "The blocked section changed how we communicate. Before, clients found out about delays in the next meeting. Now they see it in the weekly update with context. Trust goes up when you're proactive about problems.",
    author: "Priya Sharma",
    role: "PM Lead, Apex Digital",
    clients: "31",
    avatar: "PS",
  },
];

export function Testimonials() {
  return (
    <section
      className="py-24 lg:py-32 bg-paper-1"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="text-center max-w-3xl mx-auto mb-16">
          <h2
            id="testimonials-heading"
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-balance mb-6"
          >
            Agencies don't hire us. They <span className="text-ink">keep</span> us.
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed">
            The only metric that matters: zero churn since launch.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.author}
              className="bg-card border border-border rounded-xl p-6 space-y-4 transition-all hover:border-accent/50 hover:shadow-lg"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-soft flex items-center justify-center text-accent font-display font-medium text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-ink">{testimonial.author}</p>
                  <p className="text-sm text-ink-muted">{testimonial.role}</p>
                </div>
              </div>

              <blockquote className="text-ink-soft leading-relaxed text-base">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm text-ink-muted">
                  {testimonial.clients} active clients
                </span>
                <span className="text-xs font-medium text-accent bg-accent-soft px-2 py-1 rounded-full">
                  Verified
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}