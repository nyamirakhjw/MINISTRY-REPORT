"use client";
import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { setAvatarAction } from "@/lib/actions/profile";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 120 * 1024;
const SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Re-encodes on the device to 512x512 WebP (JPEG where WebP encoding is unavailable), 120 KB or less. Strips location and camera data (PRO-02). */
async function renderCropped(src: string, area: Area): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, SIZE, SIZE);
  for (const [type, ext] of [["image/webp", "webp"], ["image/jpeg", "jpg"]] as const) {
    for (const q of [0.85, 0.75, 0.65, 0.55, 0.45, 0.35]) {
      const blob = await toBlob(canvas, type, q);
      if (blob && blob.type === type && blob.size <= MAX_OUTPUT_BYTES) return { blob, ext };
    }
  }
  throw new Error("size");
}

export function PhotoCropper({ memberId, name, onSaved }: { memberId: string; name: string; onSaved: () => void }) {
  const t = useTranslations("photo");
  const [src, setSrc] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [area, setArea] = React.useState<Area | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function pick(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(t("notImage"));
    if (file.size > MAX_INPUT_BYTES) return setError(t("tooBig"));
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  async function save() {
    if (!src || !area) return;
    setBusy(true);
    setError(null);
    try {
      const { blob, ext } = await renderCropped(src, area);
      const path = `${memberId}/avatar.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: "3600" });
      if (upErr) throw new Error("upload");
      const r = await setAvatarAction(path);
      if (!r.ok) throw new Error("save");
      onSaved();
    } catch {
      setError(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  const nudge = (dx: number, dy: number) => setCrop((c) => ({ x: c.x + dx, y: c.y + dy }));

  return (
    <div className="flex flex-col gap-4">
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" id="photo-file" onChange={(e) => pick(e.target.files?.[0])} aria-label={t("choose")} />
      {!src ? (
        <Button variant="secondary" onClick={() => inputRef.current?.click()}><ImagePlus aria-hidden="true" />{t("choose")}</Button>
      ) : (
        <>
          <div className="relative h-72 w-full overflow-hidden rounded-lg bg-foreground/90 sm:h-80">
            <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
              onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />
          </div>
          <p className="text-sm text-muted-foreground">{t("gestureHelp")}</p>
          <div className="flex items-center gap-3">
            <label htmlFor="photo-zoom" className="font-semibold">{t("zoom")}</label>
            <input id="photo-zoom" type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-11 flex-1 accent-[var(--primary)]" />
          </div>
          <div role="group" aria-label={t("move")} className="flex items-center justify-center gap-2">
            <Button variant="secondary" size="icon" onClick={() => nudge(-12, 0)} aria-label={t("left")}><ArrowLeft aria-hidden="true" /></Button>
            <Button variant="secondary" size="icon" onClick={() => nudge(0, -12)} aria-label={t("up")}><ArrowUp aria-hidden="true" /></Button>
            <Button variant="secondary" size="icon" onClick={() => nudge(0, 12)} aria-label={t("down")}><ArrowDown aria-hidden="true" /></Button>
            <Button variant="secondary" size="icon" onClick={() => nudge(12, 0)} aria-label={t("right")}><ArrowRight aria-hidden="true" /></Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={save} disabled={busy || !area}>{busy ? t("saving") : t("save")}</Button>
            <Button variant="ghost" onClick={() => inputRef.current?.click()} disabled={busy}>{t("chooseAnother")}</Button>
          </div>
        </>
      )}
      {error ? <p role="alert" className="font-semibold text-danger">{error}</p> : null}
      <p className="text-sm text-muted-foreground">{t("privacyNote", { name })}</p>
    </div>
  );
}
