import { publicEnv } from "@/lib/env";

export function GET() {
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  const body = `Contact: mailto:ogoradelmus1@gmail.com\nExpires: ${expires}\nPreferred-Languages: en, sw\nCanonical: ${publicEnv.siteUrl}/.well-known/security.txt\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
