"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { Button } from "./button";

const COPIED_RESET_MS = 1600;

export const copyText = async (value: string): Promise<boolean> => {
  if (!value) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the execCommand path when Clipboard API is blocked.
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.setAttribute("aria-hidden", "true");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  } catch {
    return false;
  }
};

export const IdentifierChip = ({ code }: { code: string }) => {
  const t = useTranslations("dashboard.common");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const didCopy = await copyText(code);
    if (didCopy) setCopied(true);
  };

  if (!code) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? t("copied") : t("copyCode", { code })}
      className="h-7 gap-1.5 px-2.5 font-mono text-xs font-semibold tracking-wide"
    >
      {code}
      {copied ? (
        <Check className="size-3.5" strokeWidth={2.25} aria-hidden />
      ) : (
        <Copy className="size-3.5 opacity-80" strokeWidth={2} aria-hidden />
      )}
    </Button>
  );
};
