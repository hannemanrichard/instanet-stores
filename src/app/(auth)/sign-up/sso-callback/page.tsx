"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader } from "@/shared/components/ui/loader";

export default function SignUpSsoCallbackPage() {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-center">
      <Loader label="Finishing Google sign-up" />
      <p className="text-sm text-muted-foreground">Finishing Google sign-up…</p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
