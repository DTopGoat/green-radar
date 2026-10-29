import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const links = [
  { to: "/", label: "Map" },
  { to: "/crops", label: "Crops" },
  { to: "/accuracy", label: "Accuracy" },
  { to: "/about", label: "About" },
] as const;

export function AppHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("gr-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <header className="z-20 border-b border-line bg-cloud">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <Link to="/" className="min-w-0">
          <span className="block font-serif text-xl leading-none text-ink">Green Radar</span>
          <span className="mt-1 block text-xs tracking-wide text-muted uppercase">
            Cordillera · Sentinel-2
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 overflow-x-auto" aria-label="Primary">
          {links.map((link) => {
            const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`inline-flex h-11 items-center rounded-full px-3 text-sm ${
                  active ? "bg-pine text-cloud" : "text-ink"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 items-center rounded-full border border-line px-3 text-sm text-ink"
            aria-pressed={dark}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </nav>
      </div>
    </header>
  );
}
