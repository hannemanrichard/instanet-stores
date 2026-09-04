"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      await signOut({ redirectUrl: "/sign-in" });
      router.push("/sign-in");
    })();
  }, [signOut, router]);

  return <div className="p-8 text-center">Signing out...</div>;
}
