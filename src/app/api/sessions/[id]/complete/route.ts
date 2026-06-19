import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { withDB } from "@/lib/db";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const { id } = await ctx.params;

  await withDB((db) => {
    const s = db.sessions.find(
      (x) => x.id === id && x.userId === session.userId,
    );
    if (s && !s.completedAt) {
      s.completedAt = new Date().toISOString();
    }
  });

  return NextResponse.json({ ok: true });
}
