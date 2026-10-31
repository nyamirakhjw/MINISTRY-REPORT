"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Ring } from "@/components/ui/ring";

/**
 * Month picker that changes the month without reloading the page: picking a month (or pressing the button) navigates in
 * place, and the content below crossfades (see MonthFade). Without JavaScript it is still a plain GET form.
 */
export function MonthPickerForm({ month, options, labels }: { month: string; options: { value: string; label: string }[]; labels: { month: string; show: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = React.useTransition();
  const [value, setValue] = React.useState(month);
  React.useEffect(() => setValue(month), [month]);

  const go = (m: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("month", m);
    start(() => router.push(`${pathname}?${next.toString()}`));
  };

  return (
    <form method="get" onSubmit={(e) => { e.preventDefault(); go(value); }} className="flex flex-wrap items-end gap-3" aria-busy={pending}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="month" className="font-semibold">{labels.month}</label>
        <Select id="month" name="month" value={value} onChange={(e) => { setValue(e.target.value); go(e.target.value); }} className="w-56">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? <Ring /> : null}{labels.show}</Button>
    </form>
  );
}
