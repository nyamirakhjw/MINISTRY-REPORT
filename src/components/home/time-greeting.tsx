"use client";

import { useSyncExternalStore } from "react";
import { dayPart, type DayPart } from "@/lib/nairobi";

const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};

/**
 * The greeting line. The server sends the Nairobi time of day so the first paint is right; once the page is in the
 * browser it follows the phone's own clock and changes by itself when the hour passes.
 */
export function TimeGreeting({ name, labels, initial, id = "db-greeting", as: Tag = "h1" }: { name: string; labels: Record<DayPart, string>; initial: DayPart; id?: string; as?: "h1" | "p" }) {
  const part = useSyncExternalStore(subscribe, () => dayPart(new Date().getHours()), () => initial);
  return (
    <Tag id={id} className="db-greet">
      <span key={part} className="db-hi">{labels[part]}</span>
      <span className="db-name">{name}</span>
    </Tag>
  );
}
