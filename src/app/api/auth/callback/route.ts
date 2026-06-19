import { NextResponse } from "next/server";
import { exchangeCodeForToken, getCurrentUser } from "@/lib/spotify";

function getBaseUrl(request: Request): string {
  const protocol =
    request.headers.get("x-forwarded-proto") ?? "http";
  const host =
    request.headers.get("host") ??
    new URL(request.url).host;
  return `${protocol}://${host}`;
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const baseUrl = getBaseUrl(request);
  console.log("[callback] request.url:", request.url);
  console.log("[callback] host header:", request.headers.get("host"));
  console.log("[callback] computed baseUrl:", baseUrl);

  const code = incoming.searchParams.get("code");
  const state = incoming.searchParams.get("state");
  const error = incoming.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=${error}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/?error=missing_params`);
  }

  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("spotify_oauth_state="))
    ?.split("=")[1];

  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(`${baseUrl}/?error=state_mismatch`);
  }

  const token = await exchangeCodeForToken(code);
  const user = await getCurrentUser(token.access_token);

  const res = NextResponse.redirect(`${baseUrl}/`);
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
  res.cookies.set("user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.delete("spotify_oauth_state");
  return res;
}
