export const normalizeUserEmail = (email: unknown): string => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

type EmailBearer = {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }>;
};

export const resolveUserEmail = (user: EmailBearer | null | undefined): string => {
  if (!user) return "";
  const raw =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress;
  return normalizeUserEmail(raw);
};
