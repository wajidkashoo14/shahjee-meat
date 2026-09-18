import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { routing } from "@/i18n/routing";

const intlProxy = createMiddleware(routing);

/**
 * Matches "/en/account/...", "/ja/admin/...", or the un-prefixed form,
 * so we can tell which locale-agnostic section a request is for.
 */
function sectionOf(pathname: string): "account" | "admin" | null {
  const stripped = pathname.replace(/^\/(en|ja)(?=\/|$)/, "");
  if (stripped === "/account" || stripped.startsWith("/account/")) return "account";
  if (stripped === "/admin" || stripped.startsWith("/admin/")) return "admin";
  return null;
}

export default function proxy(request: NextRequest) {
  const section = sectionOf(request.nextUrl.pathname);

  if (section) {
    // Cheap, edge-safe cookie presence check. Real role/permission checks
    // (customer vs staff vs admin) happen server-side in the section's
    // layout, which has DB access to load the full session + role.
    const hasSession = getSessionCookie(request);
    if (!hasSession) {
      const localeMatch = request.nextUrl.pathname.match(/^\/(en|ja)/);
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
      const signInUrl = new URL(`/${locale}/sign-in`, request.url);
      signInUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return intlProxy(request);
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
