"use client";

import { Button } from "@/shared/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/sign-in" });
    router.push("/sign-in");
  };

  return (
    <Button onClick={handleSignOut} variant="ghost" aria-label="Sign out">
      Sign Out
    </Button>
  );
}
