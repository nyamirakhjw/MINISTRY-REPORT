/**
 * Report card drawing (PRD §12.1, CARD-01 to CARD-04). A 1080 x 1080 PNG drawn on an HTML canvas on the device, so it
 * works offline and looks the same in every browser. Brand artwork: it looks the same in light and dark mode, so its
 * colours are fixed here (the same navy and gold as the letterhead) instead of following the theme. The card never
 * shows a comment, username, phone or email. Browser only.
 */

export type CardKind = "pioneer" | "yes" | "no";

export interface CardLabels {
  title: string;          // "Monthly ministry report"
  forMonth: string;       // "For August 2026"
  category: string;       // "Regular pioneer"
  hours: string;          // "No. of hours"
  studies: string;        // "Studies conducted"
  participated: string;   // "Participated"
  yes: string;            // "Yes"
  didNot: string;         // "Did not participate this month"
  tagline: string;
  app: string;            // "Ministry Report"
}

export interface CardInput {
  labels: CardLabels;
  name: string;
  kind: CardKind;
  hours: number | null;
  studies: number;
  photoUrl: string | null;
  markUrl: string;
  locale: string;
}

const NAVY = "#0B2E6B";
const SKY = "#E6EFFC";
const GOLD = "#F2C14E";
const WHITE = "#FFFFFF";
const SLATE = "#334155";
export const CARD_SIZE = 1080;

/** Reads a font-family list from a CSS variable (next/font sets these), so the canvas uses the same fonts as the page. */
function familyFromVar(cssVar: string, fallback: string): string {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${cssVar}), ${fallback}`;
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || fallback;
  probe.remove();
  return family;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // keeps the canvas exportable; if the host refuses, we fall back to initials
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, weight: number, maxWidth: number, start: number, min: number): number {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > min && ctx.measureText(text).width > maxWidth) { size -= 2; ctx.font = `${weight} ${size}px ${family}`; }
  return size;
}

/** Greedy wrap into at most two lines, shrinking the font before ever cutting a name short. */
function wrapName(ctx: CanvasRenderingContext2D, name: string, family: string, maxWidth: number): { lines: string[]; size: number } {
  for (const size of [56, 48, 42, 36]) {
    ctx.font = `600 ${size}px ${family}`;
    const words = name.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) line = next; else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return { lines, size };
  }
  ctx.font = "600 36px " + family;
  let text = name;
  while (text.length > 1 && ctx.measureText(`${text}…`).width > maxWidth) text = text.slice(0, -1);
  return { lines: [`${text}…`], size: 36 };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]![0] ?? "" : "")).toUpperCase();
}

export async function drawReportCard(canvas: HTMLCanvasElement, input: CardInput): Promise<void> {
  const heading = familyFromVar("--font-lexend", "system-ui, sans-serif");
  const body = familyFromVar("--font-source-sans", "system-ui, sans-serif");
  try {
    await Promise.all([document.fonts.load(`600 64px ${heading}`), document.fonts.load(`600 30px ${body}`), document.fonts.load(`400 30px ${body}`)]);
  } catch { /* fall back to the system font rather than failing the card */ }
  const [mark, photo] = await Promise.all([loadImage(input.markUrl), input.photoUrl ? loadImage(input.photoUrl) : Promise.resolve(null)]);

  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas");
  const upper = (s: string) => s.toLocaleUpperCase(input.locale);
  ctx.textBaseline = "alphabetic";

  // Background and the diagonal navy-and-gold corner
  ctx.fillStyle = SKY;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(340, 0); ctx.lineTo(0, 340); ctx.closePath(); ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.moveTo(340, 0); ctx.lineTo(376, 0); ctx.lineTo(0, 376); ctx.lineTo(0, 340); ctx.closePath(); ctx.fill();

  // Emblem, top right
  if (mark) {
    const w = 190;
    ctx.drawImage(mark, CARD_SIZE - 56 - w, 44, w, (w * mark.height) / mark.width);
  }

  // Title
  ctx.textAlign = "center";
  ctx.fillStyle = NAVY;
  const title = upper(input.labels.title);
  fitFont(ctx, title, heading, 600, 880, 58, 34);
  ctx.fillText(title, CARD_SIZE / 2, 330);

  // Month ribbon with gold ends
  const rx = 170, ry = 366, rw = 740, rh = 84;
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.moveTo(rx - 34, ry + rh / 2); ctx.lineTo(rx + 10, ry); ctx.lineTo(rx + 10, ry + rh); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(rx + rw + 34, ry + rh / 2); ctx.lineTo(rx + rw - 10, ry); ctx.lineTo(rx + rw - 10, ry + rh); ctx.closePath(); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = WHITE;
  const forMonth = upper(input.labels.forMonth);
  fitFont(ctx, forMonth, heading, 600, rw - 80, 40, 24);
  ctx.fillText(forMonth, CARD_SIZE / 2, ry + rh / 2 + 14);

  // Photo with a gold ring, name and category
  const cx = 200, cy = 590, r = 92;
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  if (photo) {
    const side = Math.min(photo.width, photo.height);
    ctx.drawImage(photo, (photo.width - side) / 2, (photo.height - side) / 2, side, side, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = NAVY;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = WHITE;
    ctx.font = `600 76px ${heading}`;
    ctx.fillText(initialsOf(input.name), cx, cy + 27);
  }
  ctx.restore();

  ctx.textAlign = "left";
  const textX = 330, textW = CARD_SIZE - textX - 70;
  const { lines, size } = wrapName(ctx, input.name, heading, textW);
  ctx.fillStyle = NAVY;
  ctx.font = `600 ${size}px ${heading}`;
  const lineH = size * 1.15;
  const blockH = lines.length * lineH + 70;
  let y = cy - blockH / 2 + size;
  for (const line of lines) { ctx.fillText(line, textX, y); y += lineH; }
  ctx.font = `600 30px ${body}`;
  const chipW = Math.min(textW, ctx.measureText(input.labels.category).width + 48);
  ctx.fillStyle = GOLD;
  roundRect(ctx, textX, y - lineH + 22, chipW, 50, 25); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.fillText(input.labels.category, textX + 24, y - lineH + 22 + 34, chipW - 36);

  // Metric tiles
  const tile = (x: number, w: number, label: string, value: string) => {
    ctx.fillStyle = WHITE;
    roundRect(ctx, x, 730, w, 190, 22); ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 28, 730 + 190 - 10, w - 56, 6);
    ctx.textAlign = "center";
    ctx.fillStyle = SLATE;
    ctx.font = `600 30px ${body}`;
    ctx.fillText(label, x + w / 2, 730 + 52, w - 40);
    ctx.fillStyle = NAVY;
    fitFont(ctx, value, heading, 600, w - 60, 100, 48);
    ctx.fillText(value, x + w / 2, 730 + 148);
  };
  if (input.kind === "no") {
    ctx.fillStyle = WHITE;
    roundRect(ctx, 100, 730, 880, 190, 22); ctx.fill();
    ctx.fillStyle = NAVY;
    ctx.textAlign = "center";
    fitFont(ctx, input.labels.didNot, heading, 600, 800, 46, 28);
    ctx.fillText(input.labels.didNot, CARD_SIZE / 2, 730 + 112);
  } else {
    const first = input.kind === "pioneer" ? { label: input.labels.hours, value: String(input.hours ?? 0) } : { label: input.labels.participated, value: input.labels.yes };
    tile(100, 420, first.label, first.value);
    tile(560, 420, input.labels.studies, String(input.studies));
  }

  // Navy wave footer with a gold line, tagline and app name
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.moveTo(0, 980);
  ctx.bezierCurveTo(240, 940, 420, 1010, 640, 972);
  ctx.bezierCurveTo(820, 940, 960, 990, CARD_SIZE, 960);
  ctx.lineTo(CARD_SIZE, CARD_SIZE); ctx.lineTo(0, CARD_SIZE); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 6; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 980);
  ctx.bezierCurveTo(240, 940, 420, 1010, 640, 972);
  ctx.bezierCurveTo(820, 940, 960, 990, CARD_SIZE, 960);
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.font = `600 28px ${body}`;
  ctx.textAlign = "left";
  ctx.fillText(input.labels.tagline, 56, 1044, 620);
  ctx.textAlign = "right";
  ctx.fillText(input.labels.app, CARD_SIZE - 56, 1044, 340);
}
