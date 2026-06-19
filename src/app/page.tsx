import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessToken, getUserId } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { generatePlan } from "@/lib/plan";
import GeneratePlaylistButton from "./_components/GeneratePlaylistButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await getUserId();
  const accessToken = await getAccessToken();

  if (!userId || !accessToken) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 p-8 dark:bg-black">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            Tempo Run
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            A music-paced treadmill coach. Hit longer runs and faster paces with
            playlists engineered to your cadence.
          </p>
        </div>
        <a
          href="/api/auth/login"
          className="rounded-full bg-[#1DB954] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#1ed760]"
        >
          Log in with Spotify
        </a>
      </main>
    );
  }

  const db = await readDB();
  const onboarding = db.onboarding[userId];
  if (!onboarding) {
    redirect("/onboarding");
  }

  const history = db.sessions.filter((s) => s.userId === userId);
  const activeSession = history.find((s) => s.startedAt && !s.completedAt);
  if (activeSession) {
    redirect(`/run/${activeSession.id}`);
  }

  const unrated = history.find((s) => s.completedAt && !s.rating);
  if (unrated) {
    redirect(`/run/${unrated.id}/rate`);
  }

  const plan = generatePlan(history, onboarding);
  const completedCount = history.filter((s) => s.rating).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Today&apos;s run</h1>
        <p className="text-sm text-zinc-500">
          Run #{completedCount + 1} · phase: {phaseLabel(plan.phase)}
        </p>
      </header>

      <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-baseline gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-zinc-500">Target</span>
            <span className="text-5xl font-bold">
              {plan.targetMinutes}
              <span className="ml-1 text-2xl text-zinc-500">min</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-zinc-500">Cadence</span>
            <span className="text-3xl font-semibold">
              {plan.targetCadence}
              <span className="ml-1 text-base text-zinc-500">SPM</span>
            </span>
          </div>
        </div>

        <p className="text-zinc-700 dark:text-zinc-300">{plan.rationale}</p>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Playlist structure
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {plan.blocks.map((b) => (
              <li key={b.label} className="flex justify-between border-b border-zinc-100 py-1 dark:border-zinc-900">
                <span>{b.label}</span>
                <span className="text-zinc-500">
                  {b.minutes} min · {b.bpm} BPM
                </span>
              </li>
            ))}
          </ul>
        </div>

        <GeneratePlaylistButton />
      </section>

      <footer className="flex flex-col gap-2 text-sm text-zinc-500">
        <Link href="/upload" className="underline">
          Re-upload Apple Health data
        </Link>
        <Link href="/history" className="underline">
          View run history
        </Link>
      </footer>
    </main>
  );
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case "duration":
      return "building duration";
    case "hold-20":
      return "holding 20 min";
    case "hold-30":
      return "holding 30 min";
    case "speed":
      return "adding speed";
    default:
      return phase;
  }
}
