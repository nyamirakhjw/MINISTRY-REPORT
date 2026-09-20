import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/shell/public-chrome";
import type { LegalDoc } from "@/content/legal";

export async function LegalPage({ doc, path, prefix, home, breadcrumbLabel }: { doc: LegalDoc; path: string; prefix: string; home: string; breadcrumbLabel: string }) {
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: home, item: prefix || "/" },
    { "@type": "ListItem", position: 2, name: doc.title },
  ] };
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader path={path} />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <nav aria-label={breadcrumbLabel} className="mb-4 text-sm text-muted-foreground">
          <ol className="flex gap-2"><li><Link href={prefix || "/"} className="underline underline-offset-4">{home}</Link></li><li aria-hidden="true">/</li><li aria-current="page">{doc.title}</li></ol>
        </nav>
        <h1>{doc.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{doc.updated}</p>
        <p className="mt-4 max-w-prose text-lg">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2>{s.heading}</h2>
            <div className="mt-2 max-w-prose space-y-3">{s.body.map((p) => <p key={p}>{p}</p>)}</div>
          </section>
        ))}
      </main>
      <PublicFooter prefix={prefix} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
    </div>
  );
}
