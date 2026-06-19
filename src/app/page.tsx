export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 p-8 dark:bg-black">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          Tempo Run
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Generate Spotify playlists that match your running cadence. Connect
          your Spotify account to get started.
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
