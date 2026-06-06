"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReservations } from "@/lib/reservations";
import { ModeToggle } from "./ModeToggle";

export function TopNav() {
  const pathname = usePathname();
  const reservations = useReservations();
  const link = (href: string, label: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`rounded-full px-4 py-2 transition ${active ? "bg-cloud text-ink" : "text-ink hover:bg-cloud"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-rausch">
          <span aria-hidden className="text-2xl leading-none">◆</span>
          RushHour
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium">
          {link("/", "For Businesses", true)}
          {link("/creator", "For Creators")}
          {link("/data", "Data")}
          <Link
            href="/reservations"
            className={`relative rounded-full px-4 py-2 transition ${
              pathname.startsWith("/reservations") ? "bg-cloud text-ink" : "text-ink hover:bg-cloud"
            }`}
          >
            Reservations
            {reservations.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rausch px-1.5 text-xs font-bold text-white">
                {reservations.length}
              </span>
            )}
          </Link>
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}
