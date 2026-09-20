"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PhotoCropper } from "@/components/forms/photo-cropper";
import { resubmitRequestAction } from "@/lib/actions/profile";

export function PendingPhoto({ memberId, name }: { memberId: string; name: string }) {
  const router = useRouter();
  return <PhotoCropper memberId={memberId} name={name} onSaved={() => router.refresh()} />;
}

export function ResubmitButton() {
  const t = useTranslations("pending");
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button disabled={pending} onClick={() => start(async () => { await resubmitRequestAction(); router.refresh(); })}>{t("requestAgain")}</Button>;
}
