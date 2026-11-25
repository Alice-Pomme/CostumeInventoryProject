import Link from "next/link";
import { Shirt } from "lucide-react";

const links = [
  { href: "/pieces", label: "Pièces" },
  { href: "/costumes", label: "Costumes" },
];

export function AppNav() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50"
        >
          <Shirt className="h-5 w-5" aria-hidden />
          <span className="font-semibold tracking-tight">Inventaire costumes</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
