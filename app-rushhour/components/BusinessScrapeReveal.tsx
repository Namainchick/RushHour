"use client";
import { useEffect, useState } from "react";
import { ExtractBusinessResult } from "@/lib/types";
import { useMockMode } from "@/lib/mock-mode";

function hostOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line/70 py-3 first:border-t-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-ink">{children}</div>
    </div>
  );
}

export function BusinessScrapeReveal({
  url,
  data,
  onContinue,
}: {
  url: string;
  data: ExtractBusinessResult | null;
  onContinue: () => void;
}) {
  const [mock] = useMockMode();
  const [phase, setPhase] = useState(0);

  const host = hostOf(data?.sourceUrl || url);
  const steps = [
    { label: `Website ${host || "aufrufen"} abrufen`, icon: "🌐" },
    { label: "Inhalte & Meta-Daten lesen", icon: "📄" },
    { label: "Marke mit KI verstehen", icon: "✨" },
    { label: mock ? "Beispieldaten geladen" : "Profil in Supabase gespeichert", icon: mock ? "📦" : "🗄️" },
  ];

  // Light up the checklist one step at a time.
  useEffect(() => {
    if (phase >= steps.length) return;
    const t = setTimeout(() => setPhase((p) => p + 1), 650);
    return () => clearTimeout(t);
  }, [phase, steps.length]);

  const revealed = phase >= steps.length && data !== null;

  if (!revealed) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line/70">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-rausch text-white">◆</span>
          <span className="font-semibold text-ink">Deine Website wird analysiert…</span>
        </div>
        <div className="mt-5 space-y-3">
          {steps.map((s, i) => {
            const done = i < phase;
            const active = i === phase;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  i <= phase ? "opacity-100" : "opacity-30"
                }`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-sm ${
                    done ? "bg-emerald-500 text-white" : active ? "bg-rausch/15 text-rausch" : "bg-cloud text-muted"
                  }`}
                >
                  {done ? "✓" : s.icon}
                </span>
                <span className={done ? "text-ink" : "text-muted"}>{s.label}</span>
                {active && (
                  <span className="ml-auto flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-rausch"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const b = data!.profile;
  return (
    <div className="animate-rise rounded-3xl bg-white p-6 shadow-card ring-1 ring-line/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ink">Das haben wir von deiner Website gelesen</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {mock ? "Beispieldaten" : "Gespeichert"}
        </span>
      </div>

      {host && (
        <a
          href={data!.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-rausch hover:underline"
        >
          🔗 {host}
        </a>
      )}

      {data!.summary && (
        <div className="mt-4 rounded-2xl bg-rausch/5 p-4 text-sm leading-relaxed text-ink">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-rausch">KI-Zusammenfassung</div>
          {data!.summary}
        </div>
      )}

      <div className="mt-4">
        <Field label="Name">{b.name}</Field>
        <Field label="Kategorie">{b.category}</Field>
        <Field label="Standort">
          {b.city}
          {b.neighborhood ? ` · ${b.neighborhood}` : ""}
        </Field>
        <Field label="Marken-Stil">
          <div className="flex flex-wrap gap-1.5">
            {b.styleTags.map((t) => (
              <span key={t} className="rounded-full bg-cloud px-3 py-1 text-xs font-medium text-ink">
                {t}
              </span>
            ))}
          </div>
        </Field>
        <Field label="Beschreibung">
          <span className="text-sm text-muted">{b.description}</span>
        </Field>
      </div>

      <button
        onClick={onContinue}
        className="mt-6 w-full rounded-xl bg-rausch py-3.5 font-semibold text-white transition hover:bg-rausch-dark"
      >
        Stimmt — weiter zum Ziel →
      </button>
    </div>
  );
}
