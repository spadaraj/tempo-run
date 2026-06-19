import { cookies } from "next/headers";

export async function getUserId(): Promise<string | null> {
  const c = await cookies();
  return c.get("user_id")?.value ?? null;
}

export async function getAccessToken(): Promise<string | null> {
  const c = await cookies();
  return c.get("spotify_access_token")?.value ?? null;
}

export async function requireSession(): Promise<{
  userId: string;
  accessToken: string;
}> {
  const userId = await getUserId();
  const accessToken = await getAccessToken();
  if (!userId || !accessToken) {
    throw new Error("UNAUTHORIZED");
  }
  return { userId, accessToken };
}
