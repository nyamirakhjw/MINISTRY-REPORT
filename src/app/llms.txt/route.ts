import { publicEnv } from "@/lib/env";

export function GET() {
  const body = `# Ministry Report

> A private, mobile-first web app for monthly ministry reporting, used by the Nyamira congregation of Jehovah's Witnesses.

## Public pages
- [Home](${publicEnv.siteUrl}/): what this is, meeting details, how to sign in or ask for access
- [Privacy notice](${publicEnv.siteUrl}/privacy)
- [Terms of use](${publicEnv.siteUrl}/terms)

## Not for automated collection
Every signed-in area (/app, /admin, /platform) contains private personal data and is not for crawling, indexing or model training.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
