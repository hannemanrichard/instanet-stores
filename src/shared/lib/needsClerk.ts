/** Routes that need Clerk (auth-aware CTAs or signed-in UI). Catalog stays Clerk-free. */
export const needsClerk = (pathname: string | null): boolean => {
  if (!pathname) return false;

  if (pathname === "/") return true;

  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/sign-out") ||
    pathname.startsWith("/terms")
  );
};
