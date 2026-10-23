"use client";

import { useEffect, useState } from "react";

type Result = { tld: string; status: "available" | "taken" | "unknown" };

export default function Home() {
  const [name, setName] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const clean = name.trim().toLowerCase();

  useEffect(() => {
    if (!clean) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/check?name=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (!cancelled) setResults(res.ok ? data.results : []);
      } catch {
        if (!cancelled) setResults([]);
      }
      if (!cancelled) setLoading(false);
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [clean]);

  // Show available names first, then taken, then unknown
  const order = { available: 0, taken: 1, unknown: 2 };
  const shown = clean
    ? [...results].sort((a, b) => order[a.status] - order[b.status])
    : [];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center px-4 pt-24 pb-16">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">Domain Checker</h1>
      <p className="text-slate-500 mb-8">Type a name and see which endings are free.</p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="yourname"
        className="w-full max-w-xl rounded-xl border border-slate-300 bg-white px-5 py-4 text-xl text-slate-800 outline-none focus:border-blue-500 shadow-sm"
      />

      <div className="w-full max-w-xl mt-6 flex flex-col gap-3">
        {clean && loading && <p className="text-slate-400">Checking...</p>}

        {shown.map((r) => (
          <div
            key={r.tld}
            className="flex items-center justify-between gap-3 rounded-xl bg-white px-5 py-4 shadow-sm border border-slate-200"
          >
            <span className="text-lg text-slate-800 truncate">
              {clean}.{r.tld}
            </span>

            <div className="flex items-center gap-3">
              <span
                className={
                  r.status === "available"
                    ? "rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                    : r.status === "taken"
                    ? "rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700"
                    : "rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500"
                }
              >
                {r.status === "available"
                  ? "Available"
                  : r.status === "taken"
                  ? "Taken"
                  : "Can't check"}
              </span>

              {r.status === "available" && (
                <a
                  href={`https://www.namecheap.com/domains/registration/results/?domain=${clean}.${r.tld}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Buy
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}