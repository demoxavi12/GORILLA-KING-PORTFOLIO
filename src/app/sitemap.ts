import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { projects } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/work`, changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((p) => ({ url: `${site.url}/work/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
