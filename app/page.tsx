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
    "w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110";

  const label =
    status === "available"
      ? "Free"
      : status === "taken"
      ? "Taken"
      : status === "unknown"
      ? "N/A"
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
      <span className="text-[11px] sm:text-base font-bold">.{tld}</span>
      <span className="text-[8px] sm:text-xs opacity-90">{label}</span>
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
  const active = clean.length > 0;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) {
        setDark(saved === "dark");
      } else {
        setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    } catch {
      // keep light mode
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

  // The same elements stay on the page; the bubbles just grow in or collapse
  const gap = active ? "gap-2 sm:gap-4" : "gap-0";
  const rowClass = `flex justify-center overflow-hidden transition-all duration-500 ${gap} ${
    active ? "max-h-[130px] opacity-100 py-2" : "max-h-0 opacity-0 py-0"
  }`;
  const sideClass = `flex overflow-hidden transition-all duration-500 ${gap} ${
    active ? "max-w-[260px] opacity-100 px-2" : "max-w-0 opacity-0 px-0"
  }`;

  return (
    <main
      className={`min-h-screen flex flex-col items-center px-3 pt-20 pb-12 transition-colors ${
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
        className={`text-3xl sm:text-4xl font-bold mb-2 ${
          dark ? "text-slate-100" : "text-slate-800"
        }`}
      >
        Domain Checker
      </h1>
      <p className={`mb-8 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        Type a name and see which endings are free.
      </p>

      <div className="flex flex-col items-center">
        {/* 3 bubbles above */}
        <div className={rowClass}>{TLDS.slice(0, 3).map(bubble)}</div>

        <div className="flex items-center">
          {/* 2 bubbles on the left */}
          <div className={sideClass}>{TLDS.slice(3, 5).map(bubble)}</div>

          {/* The search box: wide at first, smaller once you start typing */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="yourname"
            autoFocus
            className={`rounded-xl border text-center outline-none focus:border-blue-500 shadow-md transition-all duration-500 ${
              active
                ? "w-[120px] sm:w-56 md:w-72 px-3 sm:px-5 py-3 sm:py-4 text-base sm:text-xl"
                : "w-[min(90vw,36rem)] px-5 py-4 text-xl"
            } ${
              dark
                ? "bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
                : "bg-white border-slate-300 text-slate-800"
            }`}
          />

          {/* 2 bubbles on the right */}
          <div className={sideClass}>{TLDS.slice(5, 7).map(bubble)}</div>
        </div>

        {/* 3 bubbles below */}
        <div className={rowClass}>{TLDS.slice(7, 10).map(bubble)}</div>
      </div>

      {active && (
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
            />
            N/A = can't check
          </span>
        </div>
      )}
    </main>
  );
}