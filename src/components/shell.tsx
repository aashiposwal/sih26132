import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, type Role } from "@/lib/store";

const NAV = [
  { to: "/", label: "Command" },
  { to: "/markets", label: "Mandis" },
  { to: "/listings", label: "Lots" },
  { to: "/match", label: "Matching" },
  { to: "/how", label: "The model" },
];

const ROLES: { id: Role; label: string }[] = [
  { id: "farmer", label: "Farmer" },
  { id: "buyer", label: "Buyer" },
  { id: "official", label: "Official" },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-20 border-b-2 border-line bg-bg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-accent-fg">
              <Sprout className="size-5" strokeWidth={2.25} />
            </span>
            <span className="text-lg font-bold tracking-tight">Kshetra</span>
          </Link>
          <nav className="order-3 flex w-full flex-wrap gap-1 md:order-none md:w-auto md:flex-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "min-h-11 rounded-[var(--radius-sm)] px-3 py-2 text-base font-bold",
                  pathname === n.to
                    ? "bg-accent text-accent-fg"
                    : "text-ink hover:bg-surface-2",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 rounded-[var(--radius-sm)] border-2 border-line bg-surface p-0.5">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={cn(
                  "min-h-11 rounded-[4px] px-3 text-sm font-bold",
                  role === r.id ? "bg-accent text-accent-fg" : "text-ink",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
