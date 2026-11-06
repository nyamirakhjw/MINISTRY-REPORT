import { Lock, ShieldCheck, WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

/** Three facts people care about, each already true in the product (PRD §5.3, D-29, §16.5), on the same navy and gold card as the Home banner. */
export async function PrivateByDesign() {
  const t = await getTranslations("landing");
  const facts = [
    { Icon: Lock, text: t("privacy1") },
    { Icon: WifiOff, text: t("privacy2") },
    { Icon: ShieldCheck, text: t("privacy3") },
  ];
  return (
    <section aria-labelledby="private-title" className="lp-section lp-divider-top">
      <div className="lp-wrap">
        <div className="lp-navy lp-reveal">
          <span className="lp-navy-deco lp-navy-stripe" aria-hidden="true" />
          <span className="lp-navy-deco lp-navy-orb-a" aria-hidden="true" />
          <span className="lp-navy-deco lp-navy-orb-b" aria-hidden="true" />
          <h2 id="private-title" className="lp-h2">{t("privacyTitle")}</h2>
          <ul className="lp-glass-list">
            {facts.map(({ Icon, text }) => (
              <li key={text} className="lp-glass-row">
                <Icon aria-hidden="true" />
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
