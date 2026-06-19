import { notFound, redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { readDB } from "@/lib/db";
import RatingForm from "./RatingForm";

export const dynamic = "force-dynamic";

export default async function RatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/");

  const db = await readDB();
  const session = db.sessions.find((s) => s.id === id && s.userId === userId);
  if (!session) notFound();
  if (session.rating) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 p-8">
      <header>
        <h1 className="text-3xl font-bold">How did that go?</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          One tap. This is how I learn what to give you next time.
        </p>
      </header>
      <RatingForm sessionId={session.id} />
    </main>
  );
}
