import { renderOg, ogSize } from "@/lib/og";

export const alt = "Ministry Report: JW Nyamira";
export const size = ogSize;
export const contentType = "image/png";
export default function Image() {
  return renderOg("Monthly ministry report", "A people for Jehovah's Name", "JW NYAMIRA");
}
