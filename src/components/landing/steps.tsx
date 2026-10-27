import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * How it works (PRD v1.1 §4.1). A real sequence, so the numbers are earned. Each step has a different small
 * picture, drawn from shapes only (no figures, so nothing here can be mistaken for data).
 * The gold line joining the steps draws with scroll progress where the browser supports it.
 */
export async function Steps() {
  const t = await getTranslations("landing");
  const c = await getTranslations("common");
  return (
    <section aria-labelledby="steps-title" className="lp-section">
      <div className="lp-wrap">
        <h2 id="steps-title" className="lp-h2">{t("stepsTitle")}</h2>
        <ol className="lp-steps">
          <li className="lp-step lp-reveal">
            <span className="lp-step-n" aria-hidden="true">1</span>
            <h3>{t("step1Title")}</h3>
            <p>{t("step1Body")}</p>
            <div className="lp-vis lp-mini" aria-hidden="true">
              <div className="lp-mini-track"><div className="lp-mini-fill" /></div>
              <span className="lp-mini-chip">{t("step1Chip")}</span>
            </div>
          </li>
          <li className="lp-step lp-reveal">
            <span className="lp-step-n" aria-hidden="true">2</span>
            <h3>{t("step2Title")}</h3>
            <p>{t("step2Body")}</p>
            <div className="lp-vis lp-mini" aria-hidden="true">
              <div className="lp-seg">
                <span data-on="true"><Check className="size-4" />{c("yes")}</span>
                <span>{c("no")}</span>
              </div>
            </div>
          </li>
          <li className="lp-step lp-reveal">
            <span className="lp-step-n" aria-hidden="true">3</span>
            <h3>{t("step3Title")}</h3>
            <p>{t("step3Body")}</p>
            <div className="lp-vis lp-mini lp-card-mini" aria-hidden="true">
              <span className="bar" />
              <span className="tiles"><span /><span /></span>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
