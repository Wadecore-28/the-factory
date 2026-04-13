"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-zinc-950 p-8 text-center text-zinc-100">
      <h1 className="font-sans text-xl font-semibold text-red-400">Noget gik galt</h1>
      <p className="max-w-lg text-sm text-zinc-400">
        Siden kunne ikke vises. Fejlen nedenfor hjælper med fejlsøgning. Prøv igen, eller genindlæs siden.
      </p>
      <pre className="max-h-[40vh] max-w-2xl overflow-auto rounded-lg border border-zinc-800 bg-black/60 p-4 text-left font-mono text-xs text-red-200/90">
        {error.message}
      </pre>
      {error.digest ? (
        <p className="font-mono text-[10px] text-zinc-600">Digest: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-full border border-red-500/60 bg-red-950/80 px-6 py-2 font-mono text-sm font-semibold uppercase tracking-wide text-red-100 transition hover:bg-red-900/90"
      >
        Prøv igen
      </button>
    </div>
  );
}
