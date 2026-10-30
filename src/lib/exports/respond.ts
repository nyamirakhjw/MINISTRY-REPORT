import "server-only";

/**
 * Safe download responses for every export route.
 *
 * A header value may only contain Latin-1 characters. The congregation name is typed by an Elder (for example with a
 * curly apostrophe, as in "Jehovah’s"), and it went straight into Content-Disposition. Node refuses such a header, so
 * the whole export failed and the browser reported an invalid response instead of a file. File names are now folded to
 * plain ASCII, with the full name kept in the UTF-8 `filename*` form for browsers that read it.
 */
export function asciiFileName(name: string): string {
  const folded = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-{2,}/g, "-").replace(/^[-.]+/, "");
  return folded || "export";
}

export function downloadResponse(body: string | Uint8Array | ArrayBuffer, contentType: string, fileName: string): Response {
  const ascii = asciiFileName(fileName);
  const utf8 = encodeURIComponent(fileName.toLowerCase().replace(/\s+/g, "-")).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** Next.js uses thrown values for redirect() and notFound(); those must pass through untouched. */
function isNextControlFlow(error: unknown): boolean {
  const digest = typeof error === "object" && error !== null && "digest" in error ? String((error as { digest: unknown }).digest) : "";
  return digest.startsWith("NEXT_");
}

/**
 * Runs an export handler. Real failures are logged with their stack (so they show in the Vercel logs) and answered with a
 * short JSON message the Elder can read, instead of a blank error page. Nothing personal is included in the message.
 */
export async function safeExport(label: string, run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    if (isNextControlFlow(error)) throw error;
    console.error(`export_failed:${label}`, error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : error);
    return Response.json({ error: "export_failed", export: label, detail: error instanceof Error ? error.message.slice(0, 200) : "unknown" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
