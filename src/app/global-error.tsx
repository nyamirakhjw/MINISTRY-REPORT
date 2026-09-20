"use client";

/** Last-resort boundary. Renders its own document, so it cannot use providers or translations. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem", background: "#F7F9FC", color: "#0F172A" }}>
        <main id="main" style={{ maxWidth: "32rem", margin: "20vh auto" }}>
          <h1>Something went wrong / Hitilafu imetokea</h1>
          <p>Try again. If it keeps happening, tell an Elder. / Jaribu tena. Ikiendelea, mwambie mzee.</p>
          <button onClick={reset} style={{ minHeight: 48, padding: "0 20px", borderRadius: 6, border: 0, background: "#0B2E6B", color: "#fff", fontSize: 16, fontWeight: 600 }}>Try again / Jaribu tena</button>
        </main>
      </body>
    </html>
  );
}
