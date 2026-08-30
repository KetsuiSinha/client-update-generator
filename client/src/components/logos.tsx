"use client";

import Image from "next/image";

const logos = [
  {
    name: "GitHub",
    src: "https://cdn.simpleicons.org/github/181717",
    alt: "GitHub logo",
  },
  {
    name: "Linear",
    src: "https://cdn.simpleicons.org/linear/5E6AD2",
    alt: "Linear logo",
  },
  {
    name: "Slack",
    src: "https://cdn.simpleicons.org/slack/4A154B",
    alt: "Slack logo",
  },
  {
    name: "Trello",
    src: "https://cdn.simpleicons.org/trello/0052CC",
    alt: "Trello logo",
  },
  {
    name: "Notion",
    src: "https://cdn.simpleicons.org/notion/000000",
    alt: "Notion logo",
  },
  {
    name: "Figma",
    src: "https://cdn.simpleicons.org/figma/F24E1E",
    alt: "Figma logo",
  },
  {
    name: "Vercel",
    src: "https://cdn.simpleicons.org/vercel/000000",
    alt: "Vercel logo",
  },
  {
    name: "Retool",
    src: "https://cdn.simpleicons.org/retool/000000",
    alt: "Retool logo",
  },
  {
    name: "Loom",
    src: "https://cdn.simpleicons.org/loom/E43D12",
    alt: "Loom logo",
  },
  {
    name: "Asana",
    src: "https://cdn.simpleicons.org/asana/FF6B47",
    alt: "Asana logo",
  },
];

export function Logos() {
  return (
    <section className="py-16 border-y border-border" aria-label="Compatible with">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-terracotta uppercase tracking-wider mb-10">
          Compatible with high performing teams
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-10 md:gap-14"
          role="list"
          aria-label="Integration logos"
        >
          {logos.map((company, i) => (
            <div
              key={company.name}
              role="listitem"
              className="flex items-center"
            >
              <Image
                src={company.src}
                alt={company.alt}
                width={48}
                height={48}
                className="opacity-60 hover:opacity-100 transition-opacity duration-200"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}