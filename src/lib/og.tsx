import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

export function renderOg(title: string, tagline: string, brand: string) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F7F9FC", padding: 72, borderBottom: "16px solid #F2C14E" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="96" height="112" viewBox="0 0 120 140">
            <path d="M60 4 L104 16 Q112 18 112 27 L112 68 Q112 104 60 134 Q8 104 8 68 L8 27 Q8 18 16 16 Z" fill="#0B2E6B" />
            <path d="M60 11 L100 22 Q106 23.5 106 30 L106 68 Q106 99 60 126 Q14 99 14 68 L14 30 Q14 23.5 20 22 Z" fill="none" stroke="#F2C14E" strokeWidth="1.6" />
            <path d="M45 42 V70 C45 80 39 86 30 86 M55 42 L64 84 L76 54 L88 84 L97 42" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 40, color: "#0B2E6B", fontWeight: 700, letterSpacing: 2 }}>{brand}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, lineHeight: 1.05, color: "#0B2E6B", fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 36, color: "#8A6A00" }}>{tagline}</div>
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
