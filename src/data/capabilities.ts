/**
 * Capabilities — from the Tech Stack + Creative Tools sections of Sabya's GitHub
 * README, grouped. `projects` cross-references the verified project indices that
 * actually use the group (derived from each repo's package.json).
 */

export type Capability = {
  key: string;
  title: string;
  items: string[];
  projects: string[];
  note?: string;
};

export const capabilities: Capability[] = [
  {
    key: "systems",
    title: "Systems",
    items: ["Job queues", "Event pipelines", "Idempotency", "Rate limiting", "Backpressure", "Caching"],
    projects: ["01", "02", "03"],
    note: "Background job processing, distributed architectures, database optimisation.",
  },
  {
    key: "backend",
    title: "Backend",
    items: ["Node.js", "Express", "TypeScript", "REST APIs", "JWT auth", "WebSockets"],
    projects: ["01", "02", "03", "05"],
  },
  {
    key: "data",
    title: "Data",
    items: ["PostgreSQL", "Prisma", "MongoDB", "MySQL", "Redis"],
    projects: ["01", "02", "03", "05"],
  },
  {
    key: "frontend",
    title: "Frontend",
    items: ["React", "Next.js", "Tailwind CSS", "HTML", "CSS"],
    projects: ["04", "05"],
  },
  {
    key: "languages",
    title: "Languages",
    items: ["TypeScript", "JavaScript", "Java", "C"],
    projects: ["01", "02", "03", "04", "05"],
    note: "DSA practice in Java — a public repository updated continuously.",
  },
  {
    key: "craft",
    title: "Image",
    items: ["Photography", "Lightroom", "Photoshop", "Premiere Pro", "After Effects", "Figma"],
    projects: [],
    note: "Cinematic video editing, color grading, visual storytelling.",
  },
];

export const tools = ["Git", "Postman", "Figma", "Docker (learning)", "Prometheus"];
