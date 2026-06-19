export default function UploadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 dark:bg-black">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
        Upload Apple Health export
      </h1>
      <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
        On your iPhone: Health app → tap your profile → Export All Health Data →
        AirDrop or email the zip to yourself, then upload it here.
      </p>
      <p className="text-sm text-zinc-500">(Upload handler coming next.)</p>
    </main>
  );
}
