import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedPaths = ["/bible", "/notes", "/search", "/admin"]
const authPaths = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value
  const path = request.nextUrl.pathname

  const isProtected = protectedPaths.some((p) => path.startsWith(p))
  const isAuth = authPaths.some((p) => path.startsWith(p))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuth && session) {
    return NextResponse.redirect(new URL("/bible", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)"],
}
