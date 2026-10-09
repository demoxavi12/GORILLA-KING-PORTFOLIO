/**
 * Identity + copy. Every string here is sourced from:
 *  - the previous portfolio (sachin-portfolio-psi-ivory.vercel.app), or
 *  - Sabya's GitHub profile README (github.com/Mrsachin-Developer), or
 *  - his own engineering notes in the Real-Time-Notification-Engine repo.
 * Do not add copy that cannot be traced to one of those sources.
 */

export const site = {
  name: "Sabya Sachin Mohanta",
  firstName: "Sabya",
  middleName: "Sachin",
  lastName: "Mohanta",
  initials: "SSM",
  role: "Full-stack developer",
  focus: "Backend & system design",
  location: "India",
  timeZone: "Asia/Kolkata",
  timeZoneLabel: "IST",
  url: "https://sachin-portfolio-psi-ivory.vercel.app",
  email: "sabyasachin2005@gmail.com",

  // Previous portfolio hero statement (his copy).
  statement:
    "I turn bold ideas into products that feel fast, effortless, and truly premium — from first click to final launch.",

  // GitHub README: "Where logic meets creativity". Previous site: "Logic meets aesthetics, seamlessly".
  motto: "Logic meets aesthetics",

  // From his Real-Time-Notification-Engine notes ("One-Line Rule").
  manifesto: [
    { lead: "Truth lives in the", key: "Database" },
    { lead: "Work lives in the", key: "Queue" },
    { lead: "Speed lives in", key: "WebSockets" },
  ],
  manifestoSource: "One-line rule — from Sabya's engineering notes, Real-Time Notification Engine, 2026",

  // GitHub README bullets.
  profile: {
    fullStack:
      "Building scalable web applications using React, Next.js, Node.js, Express, TypeScript, PostgreSQL, Prisma, and MongoDB.",
    backend:
      "Passionate about designing reliable systems, distributed architectures, authentication systems, background job processing, caching, and database optimization.",
    competitive:
      "Solving data structures & algorithms problems in Java, continuously improving problem-solving and analytical thinking.",
    learning: ["Advanced backend engineering", "Distributed systems", "Redis", "Docker", "System design"],
    creative:
      "Photography, cinematic video editing, color grading, and visual storytelling using Adobe Creative Suite.",
    goal: "Becoming a strong software engineer who can build products from idea to production.",
  },

  // Previous portfolio "About" (his copy, lightly trimmed — no claims added).
  about: [
    "I am a results-driven software engineer focused on the design and development of high-performance digital systems. My approach combines architectural integrity with a deep focus on user experience — every product should be fast, resilient, and built to scale.",
    "From React interfaces to cloud backends, I like turning technical challenges into streamlined, reliable systems.",
  ],

  contactLead: "Got a question or a project idea?",
  contactSub: "I'd love to hear from you and discuss further.",
  signoff: "You dream it, I code it",

  socials: [
    { label: "GitHub", href: "https://github.com/Mrsachin-Developer", handle: "Mrsachin-Developer" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/sabya-sachin-mohanta-848271269/", handle: "sabya-sachin-mohanta" },
    { label: "Instagram", href: "https://www.instagram.com/sachin.icy/", handle: "sachin.icy" },
  ],
} as const;

export const nav = [
  { index: "01", label: "Work", href: "/#work" },
  { index: "02", label: "Archive", href: "/#archive" },
  { index: "03", label: "About", href: "/#about" },
  { index: "04", label: "Contact", href: "/#contact" },
] as const;
