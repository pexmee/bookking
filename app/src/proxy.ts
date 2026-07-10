import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyBasicAuth } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (verifyBasicAuth(authHeader)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="BookKing", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
