# Production Readiness Checklist

Use this as a prompt or a manual checklist before shipping any website build. Paste the whole thing, or just the relevant section if the build doesn't need all of it (e.g., a static site doesn't need local business schema).

## Infrastructure
- [ ] Point to a custom domain (not the default host subdomain)
- [ ] Proper page routing/sources — no broken or placeholder routes
- [ ] Custom 404 page

## On-page SEO
- [ ] Unique title and meta description per page
- [ ] Canonical tags on every page
- [ ] One clear H1 per page
- [ ] Internal links and breadcrumbs where they make sense

## Discovery files
- [ ] sitemap.xml
- [ ] robots.txt
- [ ] llms.txt
- [ ] favicon (all standard sizes)

## Structured data
- [ ] Schema.org markup relevant to the content (Article, Product, etc.)
- [ ] Local business schema if applicable
- [ ] Social share images (Open Graph + Twitter cards) for every page

## Accessibility & images
- [ ] Real alt text on every image, not filenames or "image1"

## Technical cleanup
- [ ] Zero console errors or warnings
- [ ] No production source maps exposed
- [ ] Trim oversized JS bundles — check the build output, not just a guess
- [ ] Browser tab title shouldn't show the framework name (Vite, React, Next, Create React App, etc.) — replace with the actual site name
- [ ] No leftover placeholder text, lorem ipsum, or default template content anywhere

## Bar
- [ ] Ship it clean. No half-finished items, no "TODO" left in.
