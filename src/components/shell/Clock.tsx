"use client";

import { useEffect, useState } from "react";
import { site } from "@/data/site";

/** Live local time for Sabya (IST). Renders a stable placeholder on the server. */
export function Clock({ seconds = true, className }: { seconds?: boolean; className?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: site.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: seconds ? "2-digit" : undefined,
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  return (
    <span className={className}>
      <time suppressHydrationWarning className="tabular-nums">
        {time ?? (seconds ? "--:--:--" : "--:--")}
      </time>{" "}
      {site.timeZoneLabel}
    </span>
  );
}
