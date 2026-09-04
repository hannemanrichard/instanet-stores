import { formatDistanceToNow } from "date-fns";
import { ar, enUS, fr } from "date-fns/locale";

const localeMap = {
  en: enUS,
  ar,
  fr,
} as const;

type SupportedLocale = keyof typeof localeMap;

export const formatRelativeDate = (
  value?: string | null,
  locale = "en"
): string => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  const dateFnsLocale =
    localeMap[locale as SupportedLocale] ?? localeMap.en;

  return formatDistanceToNow(parsed, {
    addSuffix: true,
    locale: dateFnsLocale,
  });
};
