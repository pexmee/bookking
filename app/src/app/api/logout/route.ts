import { NextResponse } from "next/server";

/** Clears HTTP Basic auth by returning 401; used with client-side credential overwrite. */
export async function GET() {
  return new NextResponse("Signed out.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="BookKing", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}
