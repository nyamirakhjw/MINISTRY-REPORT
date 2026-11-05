import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HALL, type HallPhotoKey } from "./hall-photos";
import "./hall.css";

const ORDER: HallPhotoKey[] = ["front", "garden", "inside"];
const ALT: Record<HallPhotoKey, "photoFrontAlt" | "photoGardenAlt" | "photoInsideAlt"> = {
  front: "photoFrontAlt", garden: "photoGardenAlt", inside: "photoInsideAlt",
};

/** Signed-in Home: a hall photo (a different one each day) that fades away as the person scrolls into their tasks. */
export async function HomeBanner() {
  const t = await getTranslations("landing");
  const key = ORDER[new Date().getDate() % ORDER.length];
  return (
    <div className="hb">
      <div className="hb-frame hb-photo">
        <Image src={HALL[key]} alt={t(ALT[key])} fill priority sizes="(min-width: 1024px) 960px, 100vw" placeholder="blur" quality={70} className="hb-img" />
      </div>
    </div>
  );
}
