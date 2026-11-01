import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/auth/login";
const HOME_FOR_SIGNED_IN = "/recipes";

// Auth pages that only make sense for signed-out visitors.
const SIGNED_OUT_ONLY = ["/auth/login", "/auth/sign-up"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);

  const { pathname, searchParams } = request.nextUrl;

  // Redirect while keeping any refreshed session cookies, so the browser and
  // server stay in sync.
  const redirectTo = (path: string, keepQuery = false) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    if (!keepQuery) url.search = "";
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  // A confirmation link that falls back to the site root (?code=...) is
  // handed to the confirm route.
  if (pathname === "/" && searchParams.has("code")) {
    return redirectTo("/auth/confirm", true);
  }

  if (pathname === "/") {
    return redirectTo(isSignedIn ? HOME_FOR_SIGNED_IN : LOGIN_PATH);
  }

  // Only /auth and /auth/... are public (not e.g. /authors).
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    if (isSignedIn && SIGNED_OUT_ONLY.includes(pathname)) {
      return redirectTo(HOME_FOR_SIGNED_IN);
    }
    return supabaseResponse;
  }

  // Every other page is protected.
  if (!isSignedIn) {
    return redirectTo(LOGIN_PATH);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is, so the
  // refreshed session cookies reach the browser.
  return supabaseResponse;
}
