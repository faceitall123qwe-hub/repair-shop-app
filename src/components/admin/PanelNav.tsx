import Link from "next/link";
import { logoutAction } from "@/app/(admin)/panel/(app)/actions";

const links = [
  { href: "/panel", label: "Pulpit" },
  { href: "/panel/zgloszenia", label: "Zgłoszenia" },
  { href: "/panel/dzien", label: "Dzień" },
];

export function PanelNav({ userName }: { userName: string }) {
  return (
    <header className="border-line bg-surface sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
        <nav className="flex items-center gap-1 overflow-x-auto">
          <span className="text-pcb mr-2 font-mono text-xs">SRV</span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:bg-paper rounded-sm px-3 py-1.5 text-sm whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="flex items-center gap-2">
          <span className="text-steel hidden text-xs sm:inline">{userName}</span>
          <button className="text-steel hover:text-ink text-sm">Wyloguj</button>
        </form>
      </div>
    </header>
  );
}
