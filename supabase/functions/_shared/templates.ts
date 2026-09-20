// Email templates for notification kinds (English and Kiswahili). Kiswahili strings are DRAFT until gate G-6.
export type Lang = "en" | "sw";
export interface Rendered { subject: string; text: string; html: string }

type Payload = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const kindName: Record<Lang, Record<string, string>> = {
  en: { regular_pioneer: "regular pioneer", auxiliary_pioneer: "auxiliary pioneer", special_pioneer: "special pioneer" },
  sw: { regular_pioneer: "painia wa kawaida", auxiliary_pioneer: "painia msaidizi", special_pioneer: "painia maalum" },
};

export function render(kind: string, lang: Lang, name: string, p: Payload, siteUrl: string): Rendered | null {
  const first = name.split(" ")[0] ?? name;
  const note = str(p.note);
  const link = `${siteUrl}/app`;
  const L = lang === "sw";
  let subject = "";
  const lines: string[] = [];
  switch (kind) {
    case "account_approved":
      subject = L ? "Ombi lako limeidhinishwa" : "Your request was approved";
      lines.push(L ? `Habari ${first}, ombi lako la kujiunga limeidhinishwa. Sasa unaweza kuingia.` : `Hello ${first}, your request was approved. You can now sign in.`, link);
      break;
    case "account_rejected":
      subject = L ? "Ombi lako halikuidhinishwa" : "Your request was not approved";
      lines.push(L ? `Habari ${first}, ombi lako halikuidhinishwa.` : `Hello ${first}, your request was not approved.`);
      if (note) lines.push((L ? "Sababu: " : "Reason: ") + note);
      break;
    case "photo_change_requested":
      subject = L ? "Tafadhali pakia picha nyingine" : "Please upload a new photo";
      lines.push(L ? `Habari ${first}, tafadhali pakia picha nyingine ya wasifu.` : `Hello ${first}, please upload a different profile photo.`);
      if (note) lines.push((L ? "Maelezo: " : "Note: ") + note);
      lines.push(`${siteUrl}/pending`);
      break;
    case "arrangement_decided": {
      const approved = p.approved === true;
      const what = kindName[lang][str(p.kind)] ?? "";
      subject = approved ? (L ? "Ombi la huduma limeidhinishwa" : "Your service request was approved") : (L ? "Ombi la huduma halikuidhinishwa" : "Your service request was not approved");
      lines.push(L ? `Habari ${first}, ombi lako la ${what} ${approved ? "limeidhinishwa" : "halikuidhinishwa"}.` : `Hello ${first}, your ${what} request was ${approved ? "approved" : "not approved"}.`);
      if (note) lines.push((L ? "Maelezo: " : "Note: ") + note);
      break;
    }
    case "profile_change_decided":
      subject = L ? "Ombi la kubadilisha wasifu" : "Your profile change request";
      lines.push(L ? `Habari ${first}, ombi lako la kubadilisha wasifu ${p.approved === true ? "limeidhinishwa" : "limekataliwa"}.` : `Hello ${first}, your profile change request was ${p.approved === true ? "approved" : "declined"}.`);
      break;
    case "report_submitted_on_behalf":
      subject = L ? "Ripoti yako imewasilishwa" : "Your report was submitted";
      lines.push(L ? `Habari ${first}, mzee ${str(p.by)} amewasilisha ripoti yako ya ${str(p.month).slice(0, 7)}.` : `Hello ${first}, Elder ${str(p.by)} submitted your report for ${str(p.month).slice(0, 7)} on your behalf.`, link);
      break;
    default:
      return null;
  }
  const text = lines.join("\n\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#0F172A">${lines
    .map((l) => (l.startsWith("http") ? `<p><a href="${esc(l)}">${esc(l)}</a></p>` : `<p>${esc(l)}</p>`))
    .join("")}<p style="color:#475569;font-size:14px">Ministry Report</p></div>`;
  return { subject, text, html };
}
