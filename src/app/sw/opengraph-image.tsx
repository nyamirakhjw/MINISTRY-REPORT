import { renderOg, ogSize } from "@/lib/og";

export const alt = "Ripoti ya Huduma: JW Nyamira";
export const size = ogSize;
export const contentType = "image/png";
export default function Image() {
  return renderOg("Ripoti ya huduma ya kila mwezi", "Watu wa Jina la Yehova", "JW NYAMIRA");
}
