import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const cookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production'
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'food-tracker'
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, { ...options, ...cookieOptions })
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect all API routes except public ones (food search and barcode lookup)
  const publicApiPaths = ["/api/food/search", "/api/food/barcode"];
  const isPublicApi = publicApiPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );
  const isProtectedApiPath = request.nextUrl.pathname.startsWith("/api/") && !isPublicApi;

  if (isProtectedApiPath && !user) {
    return NextResponse.json(
      { error: "Authentication required for AI features. Please sign in." },
      { status: 401 }
    );
  }

  // Redirect logged-in users away from login page
  if (request.nextUrl.pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/diary";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
