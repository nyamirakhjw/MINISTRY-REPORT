import { Lock, ShieldCheck, WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

/** Three facts people care about, each already true in the product (PRD §5.3, D-29, §16.5). A list with dividers, not cards. */
export async function PrivateByDesign() {
  const t = await getTranslations("landing");
  const facts = [
    { Icon: Lock, text: t("privacy1") },
    { Icon: WifiOff, text: t("privacy2") },
    { Icon: ShieldCheck, text: t("privacy3") },
  ];
  return (
    <section aria-labelledby="private-title" className="lp-section lp-divider-top bg-surface">
      <div className="lp-wrap lp-private">
        <div className="lp-reveal">
          <span className="lp-rule lp-reveal" aria-hidden="true" style={{ display: "block", marginBottom: "1rem" }} />
          <h2 id="private-title" className="lp-h2">{t("privacyTitle")}</h2>
        </div>
        <ul className="lp-facts">
          {facts.map(({ Icon, text }) => (
            <li key={text} className="lp-fact lp-reveal">
              <Icon aria-hidden="true" />
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
