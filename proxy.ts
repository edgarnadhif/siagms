import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey || "default_secret_key");

async function hasValidSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  if (!session) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });

    return Boolean(payload.userId && payload.tenantId && payload.role);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const isAuthenticated = await hasValidSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
