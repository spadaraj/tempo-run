import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { withDB, type FeelingToday, type YesterdayActivity } from "@/lib/db";
import { baselineFromOnboarding } from "@/lib/plan";

export async function POST(req: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = (await req.json()) as {
    yesterdayActivity: YesterdayActivity;
    feelingToday: FeelingToday;
  };

  const { baselineMinutes, baselineCadence } = baselineFromOnboarding(
    body.yesterdayActivity,
    body.feelingToday,
  );

  await withDB((db) => {
    db.onboarding[session.userId] = {
      userId: session.userId,
      yesterdayActivity: body.yesterdayActivity,
      feelingToday: body.feelingToday,
      baselineMinutes,
      baselineCadence,
      createdAt: new Date().toISOString(),
    };
  });

  return NextResponse.json({ ok: true });
}
