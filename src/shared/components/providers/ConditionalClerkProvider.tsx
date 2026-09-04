"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/shared/lib/clerkAppearance";
import { needsClerk } from "@/shared/lib/needsClerk";

interface ConditionalClerkProviderProps {
  children: React.ReactNode;
}

export const ConditionalClerkProvider = ({
  children,
}: ConditionalClerkProviderProps) => {
  const pathname = usePathname();
  const shouldLoadClerk = useMemo(() => needsClerk(pathname), [pathname]);

  if (!shouldLoadClerk) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
      appearance={clerkAppearance}
    >
      {children}
    </ClerkProvider>
  );
};
