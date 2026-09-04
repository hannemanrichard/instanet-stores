import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/shared/lib/brand";
import { cn } from "@/shared/utils/utils";

type AuthLogoProps = {
  className?: string;
  markClassName?: string;
};

/** Same Instanet mark used in the dashboard sidebar. */
export const AuthLogo = ({ className, markClassName }: AuthLogoProps) => (
  <Link
    href="/dashboard"
    className={cn(
      "inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    aria-label={`${BRAND_NAME} home`}
  >
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary",
        markClassName
      )}
    >
      <Image
        src={BRAND_LOGO_SRC}
        alt=""
        width={28}
        height={28}
        className="size-7 object-contain"
        aria-hidden
        priority
        unoptimized
      />
    </div>
    <div className="grid min-w-0 text-start text-sm leading-tight">
      <span className="truncate font-semibold text-foreground">{BRAND_NAME}</span>
      <span className="truncate text-xs text-muted-foreground">Stores</span>
    </div>
  </Link>
);
