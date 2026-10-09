import type { Metadata } from "next";
import { WorkIndex } from "@/components/projects/WorkIndex";

export const metadata: Metadata = {
  title: "Work",
  description: "Index of Sabya Sachin Mohanta's projects — job queues, payments, event-driven systems, dashboards.",
  alternates: { canonical: "/work" },
};

export default function Page() {
  return <WorkIndex />;
}
