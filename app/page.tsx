"use client";

import { useEffect, useState } from "react";

type Result = { tld: string; status: "available" | "taken" | "unknown" };

export default function Home() {
  const [name, setName] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);

  const clean = name.trim().toLowerCase();

  // Load the saved mode (or the computer's own setting) when the page opens
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) {
        setDark(saved === "dark");
      } else {
        setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    } catch {
      // storage not available: keep light mode
    }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

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
    <main
      className={`min-h-screen flex flex-col items-center px-4 pt-24 pb-16 transition-colors ${
        dark ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 rounded-full px-4 py-2 text-sm font-medium shadow-sm border transition-colors ${
          dark
            ? "bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700"
            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
        }`}
      >
        {dark ? "☀ Light mode" : "🌙 Dark mode"}
      </button>

      <h1
        className={`text-4xl font-bold mb-2 ${
          dark ? "text-slate-100" : "text-slate-800"
        }`}
      >
        Domain Checker
      </h1>
      <p className={`mb-8 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        Type a name and see which endings are free.
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="yourname"
        className={`w-full max-w-xl rounded-xl border px-5 py-4 text-xl outline-none focus:border-blue-500 shadow-sm ${
          dark
            ? "bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
            : "bg-white border-slate-300 text-slate-800"
        }`}
      />

      <div className="w-full max-w-xl mt-6 flex flex-col gap-3">
        {clean && loading && (
          <p className={dark ? "text-slate-500" : "text-slate-400"}>Checking...</p>
        )}

        {shown.map((r) => (
          <div
            key={r.tld}
            className={`flex items-center justify-between gap-3 rounded-xl px-5 py-4 shadow-sm border ${
              dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}
          >
            <span
              className={`text-lg truncate ${
                dark ? "text-slate-100" : "text-slate-800"
              }`}
            >
              {clean}.{r.tld}
            </span>

            <div className="flex items-center gap-3">
              <span
                className={
                  r.status === "available"
                    ? dark
                      ? "rounded-full bg-green-900 px-3 py-1 text-sm font-medium text-green-300"
                      : "rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                    : r.status === "taken"
                    ? dark
                      ? "rounded-full bg-red-900 px-3 py-1 text-sm font-medium text-red-300"
                      : "rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700"
                    : dark
                    ? "rounded-full bg-slate-700 px-3 py-1 text-sm font-medium text-slate-300"
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