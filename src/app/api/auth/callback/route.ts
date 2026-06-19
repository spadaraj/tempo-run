import { NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/spotify";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_params", url));
  }

  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("spotify_oauth_state="))
    ?.split("=")[1];

  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(new URL("/?error=state_mismatch", url));
  }

  const token = await exchangeCodeForToken(code);

  const res = NextResponse.redirect(new URL("/upload", url));
  res.cookies.set("spotify_access_token", token.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: token.expires_in,
  });
  res.cookies.set("spotify_refresh_token", token.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.delete("spotify_oauth_state");
  return res;
}
