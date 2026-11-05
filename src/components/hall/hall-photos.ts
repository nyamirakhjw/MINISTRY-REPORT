// The three hall photos are imported (not linked by path), so the build fails loudly if a file is missing
// and Next.js can size each one for the device and generate its blur preview.
import front from "@/assets/hall/front.webp";
import frontSoft from "@/assets/hall/front-soft.webp";
import garden from "@/assets/hall/garden.webp";
import inside from "@/assets/hall/inside.webp";

export const HALL = { front, frontSoft, garden, inside } as const;
export type HallPhotoKey = "front" | "garden" | "inside";
