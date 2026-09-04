import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  AUTH_FALLBACK_PATH,
  isAuthEntryPath,
  resolveAuthRedirectPath,
} from "@/shared/utils/authRedirect";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/store(.*)",
  "/api/stores(.*)",
  "/api/orders(.*)",
  "/api/returns(.*)",
  "/api/payments(.*)",
  "/api/inventory(.*)",
  "/api/managers(.*)",
]);

/** Paths that require a session except specific public methods/routes */
const isSessionApi = (pathname: string, method: string) => {
  if (pathname === "/api/products" || pathname.startsWith("/api/products/")) {
    if (pathname === "/api/products/catalog") return false;
    if (/^\/api\/products\/\d+\/items$/.test(pathname) && method === "GET") {
      return false;
    }
    if (pathname === "/api/products/catalog") return false;
    // catalog already handled; list/detail mutations need auth
    if (pathname.startsWith("/api/products/catalog")) return false;
    return true;
  }

  if (pathname.startsWith("/api/product-pages")) {
    if (method === "GET") return false;
    return true;
  }

  if (pathname.startsWith("/api/leads")) {
    if (method === "POST" && pathname === "/api/leads") return false;
    return true;
  }

  if (pathname.startsWith("/api/lead-hops")) {
    if (method === "POST" && pathname === "/api/lead-hops") return false;
    return true;
  }

  if (pathname.startsWith("/api/settings")) {
    return true;
  }

  return false;
};

const buildLocalSignInRedirect = (req: Request) => {
  const url = new URL(req.url);
  const signInUrl = new URL("/sign-in", url.origin);
  const returnPath = `${url.pathname}${url.search}`;
  if (returnPath && returnPath !== "/sign-in") {
    signInUrl.searchParams.set("redirect_url", returnPath);
  }
  return NextResponse.redirect(signInUrl);
};

export default clerkMiddleware(async (auth, req) => {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method;

  const settingsMapPublic =
    pathname === "/api/settings" &&
    method === "GET" &&
    searchParams.get("scope") === "map";

  const needsAuth =
    isProtectedRoute(req) ||
    (!settingsMapPublic && isSessionApi(pathname, method));
  const isAuthEntry = isAuthEntryPath(pathname);

  if (needsAuth || isAuthEntry) {
    const { userId } = await auth();

    if (isAuthEntry && userId) {
      const nextPath = resolveAuthRedirectPath(
        searchParams.get("redirect_url"),
        AUTH_FALLBACK_PATH,
        req.nextUrl.origin
      );
      return NextResponse.redirect(new URL(nextPath, req.url));
    }

    if (needsAuth && !userId) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Always use the app's custom /sign-in (never Clerk Account Portal).
      return buildLocalSignInRedirect(req);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/sign-out(.*)",
    "/api/set-role(.*)",
    "/api/clerk(.*)",
    "/api/store(.*)",
    "/api/stores(.*)",
    "/api/orders(.*)",
    "/api/returns(.*)",
    "/api/payments(.*)",
    "/api/inventory(.*)",
    "/api/managers(.*)",
    "/api/products(.*)",
    "/api/product-pages(.*)",
    "/api/leads(.*)",
    "/api/lead-hops(.*)",
    "/api/settings(.*)",
  ],
};
