/**
 * Projects — verified against source code in github.com/Mrsachin-Developer.
 * None of these repositories publish metrics, users, clients, or team members,
 * so none are stated. Numbers below are configuration values read from code
 * (e.g. a 30s lease TTL), never measured results.
 */

export type SystemStep = {
  label: string;
  note: string;
  /** Visually marks a failure / alternate path (rendered in the signal colour). */
  alt?: boolean;
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  /** Short display title used for oversized typography. */
  display: string[];
  year: string;
  type: string;
  repo: string;
  repoUrl: string;
  language: string;
  stack: string[];
  summary: string;
  overview: string;
  problem: string;
  approach: string[];
  system: { caption: string; steps: SystemStep[] };
  inCode: { label: string; value: string }[];
  status: string;
};

export const projects: Project[] = [
  {
    slug: "distributed-job-queue",
    index: "01",
    title: "Distributed Job Queue",
    display: ["Distributed", "Job Queue"],
    year: "2026",
    type: "Backend · Distributed systems",
    repo: "Distributed_Job_Queue_System",
    repoUrl: "https://github.com/Mrsachin-Developer/Distributed_Job_Queue_System",
    language: "TypeScript",
    stack: ["TypeScript", "Node.js", "Express", "Redis", "PostgreSQL", "Prisma", "Prometheus"],
    summary:
      "A priority job queue split into API, worker, recovery, and alert services — with partitioned queues, leased ownership, retries, a dead-letter state, and Prometheus metrics.",
    overview:
      "Jobs enter through an Express API, are persisted in PostgreSQL, and are pushed onto Redis lists partitioned by priority. Independent worker processes claim partitions, process jobs, and record every state transition back to the database.",
    problem:
      "Background work has to survive crashes, overload, and duplicate delivery. A job written to the database but never pushed to Redis — or picked up by a worker that dies mid-flight — must not be silently lost.",
    approach: [
      "Three priority tiers, each split into four partitions, give twelve Redis queues. Workers poll them through a weighted schedule (HIGH 5 : MEDIUM 2 : LOW 1) and back off from queues that keep coming up empty.",
      "Partition ownership is a lease: a worker claims a queue with Redis SET NX and a 30-second TTL, renews it while alive, and releases it on shutdown — so two workers never drain the same partition.",
      "A recovery scanner sweeps the database in batches of 50: QUEUED jobs older than ten seconds are re-enqueued, and jobs stuck in PROCESSING are retried until maxRetries, then moved to DLQ. Duplicates are accepted and handled by worker idempotency.",
      "The API protects itself: a Redis token bucket (written as a Lua script) rate-limits callers, and a backpressure middleware returns 429 with Retry-After once more than 8,000 jobs are waiting.",
    ],
    system: {
      caption: "Job lifecycle — from schema enum JobStatus",
      steps: [
        { label: "Queued", note: "persisted · pushed to partition" },
        { label: "Processing", note: "leased worker · attempts++" },
        { label: "Completed", note: "completedAt recorded" },
        { label: "DLQ", note: "attempts ≥ maxRetries", alt: true },
      ],
    },
    inCode: [
      { label: "Queues", value: "3 priorities × 4 partitions" },
      { label: "Scheduling", value: "Weighted 5 : 2 : 1" },
      { label: "Lease TTL", value: "30 s (Redis NX)" },
      { label: "Stuck threshold", value: "10 s · batch 50" },
      { label: "Backpressure", value: "429 above 8,000 queued" },
      { label: "Rate limit", value: "Token bucket in Lua" },
      { label: "Observability", value: "prom-client + Prometheus" },
      { label: "Tooling", value: "Load generator + benchmark report" },
    ],
    status: "Active repository — services, migrations, and a benchmark harness are in place.",
  },
  {
    slug: "wallet-payments-api",
    index: "02",
    title: "Wallet & Payments API",
    display: ["Wallet &", "Payments"],
    year: "2026",
    type: "Backend · Payments",
    repo: "PAYTM",
    repoUrl: "https://github.com/Mrsachin-Developer/PAYTM",
    language: "TypeScript",
    stack: ["TypeScript", "Express", "PostgreSQL", "Prisma", "Redis", "Zod", "JWT", "Pino"],
    summary:
      "A layered wallet backend — users, wallets, bank accounts, and transactions — where money only moves inside database transactions and every write is guarded by an idempotency key.",
    overview:
      "The service is organised as routes → controllers → services → repositories, with Zod validation at the edge and Prisma on PostgreSQL underneath. Users hold one wallet, any number of bank accounts, and a ledger of DEPOSIT, WITHDRAW, and TRANSFER transactions.",
    problem:
      "Payments are the place where a retried request, a double click, or two concurrent transfers can quietly create or destroy money.",
    approach: [
      "Every mutating request must carry an Idempotency-Key header. The middleware claims it in Redis with SET NX for five minutes: a repeat while the first is in flight gets 409, a repeat after success replays the cached response.",
      "Transfers run inside prisma.$transaction. The sender's balance is decremented only if it is still sufficient — a conditional update that touches zero rows when funds are short — and the receiver is credited in the same transaction.",
      "Per-user rate limiting (five requests per sixty seconds in Redis), a backpressure middleware, Helmet, structured Pino logging, and a central error handler wrap the API.",
    ],
    system: {
      caption: "Transfer path — middleware order and TransactionStatus enum",
      steps: [
        { label: "Request", note: "JWT · Zod validation" },
        { label: "Idempotent", note: "Redis SET NX · 300 s" },
        { label: "Transfer", note: "prisma.$transaction" },
        { label: "Success", note: "ledger row written" },
        { label: "Failed", note: "insufficient · rolled back", alt: true },
      ],
    },
    inCode: [
      { label: "Models", value: "User · Wallet · BankAccount · Transaction" },
      { label: "Types", value: "Deposit · Withdraw · Transfer" },
      { label: "Idempotency", value: "Redis NX, 300 s window" },
      { label: "Rate limit", value: "5 requests / 60 s / user" },
      { label: "Atomicity", value: "Conditional debit in one transaction" },
      { label: "Hardening", value: "Helmet · cookie auth · bcrypt" },
    ],
    status: "Active repository — six migrations from user model to transaction ledger.",
  },
  {
    slug: "real-time-notification-engine",
    index: "03",
    title: "Real-Time Notification Engine",
    display: ["Real-Time", "Notifications"],
    year: "2026",
    type: "Backend · Event-driven",
    repo: "Real-Time-Notification-Engine",
    repoUrl: "https://github.com/Mrsachin-Developer/Real-Time-Notification-Engine",
    language: "JavaScript",
    stack: ["Node.js", "Express", "MongoDB", "Mongoose", "WebSocket (ws)", "JWT"],
    summary:
      "A poll app rebuilt as an event-driven system: actions emit events, a worker turns them into stored notifications, and a WebSocket server pushes them to whoever is online.",
    overview:
      "Instead of Client → API → Database → Response, the poll backend now runs Action → Event → Queue → Worker → Database → WebSocket → User. Online users receive live notifications; offline users find them saved when they return.",
    problem:
      "Notifications coupled directly to request handlers make the API slower and fragile — one failed push should not fail the vote that caused it.",
    approach: [
      "Controllers only emit events. A producer/consumer queue (in-memory, with Redis noted as the next step) decouples the request from the work.",
      "A notification worker consumes events, writes them to MongoDB, and hands them to the WebSocket server for live delivery.",
      "A scheduler closes expired polls and emits a POLL CLOSED event through the same pipeline — scheduled work and user actions share one path.",
    ],
    system: {
      caption: "Event pipeline — as written in the project notes",
      steps: [
        { label: "Action", note: "vote · create · close" },
        { label: "Event", note: "pushEvent()" },
        { label: "Queue", note: "producer / consumer" },
        { label: "Worker", note: "notification.worker" },
        { label: "Database", note: "notification.model" },
        { label: "Socket", note: "ws server → user" },
      ],
    },
    inCode: [
      { label: "Rule", value: "Truth in DB · work in queue · speed in sockets" },
      { label: "Transport", value: "ws WebSocket server" },
      { label: "Scheduler", value: "Poll expiry → POLL CLOSED event" },
      { label: "Models", value: "User · Poll · Option · Notification" },
    ],
    status: "Repository with design notes — documented as a personal system-design reference.",
  },
  {
    slug: "farm-biosecurity-portal",
    index: "04",
    title: "Farm Biosecurity Portal",
    display: ["Biosecurity", "Portal"],
    year: "2025",
    type: "Frontend · Multi-role dashboard",
    repo: "SIH",
    repoUrl: "https://github.com/Mrsachin-Developer/SIH",
    language: "JavaScript",
    stack: ["React", "Vite", "Tailwind CSS", "MUI", "MUI X Charts", "Recharts", "Leaflet"],
    summary:
      "A client application with three separate journeys — farmer, veterinarian, and admin — around incident reporting, risk assessment, outbreak alerts, and map-based heatmaps.",
    overview:
      "The React client defines dedicated route trees for each role. Farmers report incidents, take a risk survey, read alerts, and follow training guides; vets manage cases, appointments, and farm details; admins review users, alerts, compliance reports, and an analytics heatmap.",
    problem:
      "The same outbreak looks different to each person involved — a farmer needs an immediate action, a vet needs a case, an administrator needs a pattern across regions.",
    approach: [
      "Three role-specific route trees (farmer, vet, admin), each with its own login, dashboard, alerts, and profile screens.",
      "Incident reporting is broken into focused sections — incident type, details, immediate actions, consent, and report status.",
      "Spatial views use Leaflet heatmaps for both vets and admins; trends use MUI X Charts and Recharts.",
    ],
    system: {
      caption: "Report flow — across the role-based routes",
      steps: [
        { label: "Farmer", note: "incident report · survey" },
        { label: "Risk", note: "risk result · alerts" },
        { label: "Vet", note: "cases · appointments" },
        { label: "Admin", note: "heatmap · compliance" },
      ],
    },
    inCode: [
      { label: "Roles", value: "Farmer · Vet · Admin" },
      { label: "Routes", value: "30+ client routes" },
      { label: "Maps", value: "Leaflet heatmaps" },
      { label: "Charts", value: "MUI X Charts · Recharts" },
    ],
    status: "Client application — no backend in this repository.",
  },
  {
    slug: "medipro",
    index: "05",
    title: "Medipro",
    display: ["Medipro"],
    year: "2025",
    type: "Full-stack · Healthcare access",
    repo: "Medipro",
    repoUrl: "https://github.com/Mrsachin-Developer/Medipro",
    language: "JavaScript",
    stack: ["React", "Vite", "Tailwind CSS", "Leaflet", "Node.js", "Express", "MongoDB", "Cheerio", "Nodemailer"],
    summary:
      "A healthcare-scheme finder: an eligibility form, scheme details sourced by a scraper, and a hospital finder that geocodes a pincode or city through OpenStreetMap.",
    overview:
      "A React client and an Express/MongoDB server. Users sign up with email verification, describe themselves in an eligibility form, browse schemes, and find nearby hospitals on a Leaflet map.",
    problem:
      "Public health schemes and the hospitals that accept them are hard to discover from a single place.",
    approach: [
      "Scheme data is fetched by a Cheerio-based scraper on the server and exposed through list, detail, and eligibility endpoints.",
      "The hospital finder converts a pincode or city into coordinates with the Nominatim API, then queries nearby hospitals.",
      "Authentication includes JWT cookies, email verification, and password reset over Nodemailer.",
    ],
    system: {
      caption: "User journey — client pages and server controllers",
      steps: [
        { label: "Verify", note: "email OTP · JWT" },
        { label: "Eligibility", note: "age · income · location" },
        { label: "Schemes", note: "scraped · Cheerio" },
        { label: "Hospitals", note: "Nominatim geocode → map" },
      ],
    },
    inCode: [
      { label: "Geocoding", value: "OpenStreetMap Nominatim" },
      { label: "Scheme data", value: "Server-side Cheerio scraper" },
      { label: "Auth", value: "JWT · email verify · reset" },
      { label: "Eligibility", value: "Form + endpoint (rules still a placeholder)" },
    ],
    status: "Prototype — eligibility matching is marked as a TODO in the server code.",
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export const getNextProject = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};
