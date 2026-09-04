import { cn } from "@/shared/utils/utils";

export type StatusTone = "info" | "success" | "error" | "warning" | "neutral";

export type StatusPillStyle = {
  badge: string;
};

export const STATUS_PILL_STYLES: Record<StatusTone, StatusPillStyle> = {
  info: {
    badge:
      "border-sky-300 bg-sky-200 text-sky-900 focus-visible:ring-sky-300/80 data-[state=open]:border-sky-400 data-[state=open]:ring-sky-300/70",
  },
  success: {
    badge:
      "border-emerald-300 bg-emerald-200 text-emerald-900 focus-visible:ring-emerald-300/80 data-[state=open]:border-emerald-400 data-[state=open]:ring-emerald-300/70",
  },
  error: {
    badge:
      "border-rose-300 bg-rose-200 text-rose-900 focus-visible:ring-rose-300/80 data-[state=open]:border-rose-400 data-[state=open]:ring-rose-300/70",
  },
  warning: {
    badge:
      "border-amber-300 bg-amber-200 text-amber-900 focus-visible:ring-amber-300/80 data-[state=open]:border-amber-400 data-[state=open]:ring-amber-300/70",
  },
  neutral: {
    badge:
      "border-neutral-300 bg-neutral-200 text-neutral-800 focus-visible:ring-neutral-300/80 data-[state=open]:border-neutral-400 data-[state=open]:ring-neutral-300/70",
  },
};

export const STATUS_PILL_BASE_CLASSNAME = [
  "inline-flex h-7 items-center rounded-full border px-3",
  "text-[11px] font-bold leading-none tracking-wide",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]",
].join(" ");

export const StatusPill = ({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) => {
  const style = STATUS_PILL_STYLES[tone];

  return (
    <span className={cn(STATUS_PILL_BASE_CLASSNAME, style.badge)}>{label}</span>
  );
};
