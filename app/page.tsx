"use client";

import { useEffect, useState } from "react";

type Status = "available" | "taken" | "unknown";
type Result = { tld: string; status: Status };

// Must match the list in app/api/check/route.ts
const TLDS = ["com", "net", "org", "io", "co", "ai", "app", "dev", "xyz", "me"];

function Bubble({
  tld,
  status,
  loading,
  clean,
  dark,
}: {
  tld: string;
  status: Status | null;
  loading: boolean;
  clean: string;
  dark: boolean;
}) {
  const size =
    "w-[72px] h-[72px] sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110";

  const label =
    status === "available"
      ? "Free"
      : status === "taken"
      ? "Taken"
      : status === "unknown"
      ? "Can't check"
      : "";

  const color =
    status === "available"
      ? "bg-green-500 text-white"
      : status === "taken"
      ? "bg-red-500 text-white"
      : dark
      ? "bg-slate-700 text-slate-300"
      : "bg-slate-200 text-slate-500";

  const inner = (
    <>
      <span className="text-sm sm:text-lg font-bold">.{tld}</span>
      <span className="text-[10px] sm:text-xs opacity-90">{label}</span>
    </>
  );

  const pulse = loading && status === null ? "animate-pulse" : "";

  if (status === "available") {
    return (
      <a
        href={`https://www.namecheap.com/domains/registration/results/?domain=${clean}.${tld}`}
        target="_blank"
        rel="noopener noreferrer"
        title={`Buy ${clean}.${tld}`}
        className={`${size} ${color}`}
      >
        {inner}
      </a>
    );
  }

  return <div className={`${size} ${color} ${pulse}`}>{inner}</div>;
}

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

  // Look up each ending's result by name
  const byTld: Record<string, Status> = {};
  if (clean) {
    results.forEach((r) => {
      byTld[r.tld] = r.status;
    });
  }

  const bubble = (tld: string) => (
    <Bubble
      key={tld}
      tld={tld}
      status={byTld[tld] ?? null}
      loading={loading}
      clean={clean}
      dark={dark}
    />
  );

  return (
    <main
      className={`min-h-screen flex flex-col items-center px-4 pt-20 pb-16 transition-colors ${
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

      {/* Bubble diagram: 3 on top, 2 left, name in the middle, 2 right, 3 below */}
      <div className="mt-12 flex flex-col items-center gap-3 sm:gap-5">
        <div className="flex gap-3 sm:gap-5">
          {TLDS.slice(0, 3).map(bubble)}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex gap-3 sm:gap-5">{TLDS.slice(3, 5).map(bubble)}</div>

          <div
            className={`w-20 sm:w-36 md:w-44 text-center break-all text-sm sm:text-xl font-semibold ${
              dark ? "text-slate-100" : "text-slate-800"
            }`}
          >
            {clean || "yourname"}
          </div>

          <div className="flex gap-3 sm:gap-5">{TLDS.slice(5, 7).map(bubble)}</div>
        </div>

        <div className="flex gap-3 sm:gap-5">
          {TLDS.slice(7, 10).map(bubble)}
        </div>
      </div>

      {/* Legend */}
      <div
        className={`mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm ${
          dark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" /> Available (click to buy)
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Taken
        </span>
        <span className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              dark ? "bg-slate-600" : "bg-slate-300"
            }`}
                      />{" "}
          Can't check
        </span>
      </div>
    </main>
  );
}