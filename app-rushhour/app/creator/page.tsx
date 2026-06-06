"use client";
import { useState } from "react";
import Link from "next/link";
import { CreatorProfile } from "@/lib/types";
import { extractCreator } from "@/lib/api-client";
import { SignalBar } from "@/components/SignalBar";

export default function CreatorOnboarding() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  async function submit() {
    setLoading(true);
    const p = await extractCreator(link || "instagram.com/lisa_hamburg_eats");
    setProfile(p);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pt-16 pb-24">
      <div className="text-center">
        <span className="rounded-full bg-rausch/10 px-4 py-1.5 text-sm font-semibold text-rausch">
          Für Creators
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Ein Link — fertig ist dein Profil.
        </h1>
        <p className="mt-4 text-lg text-muted">
          Kein langes Bewerben. Unsere KI baut dein Profil und matcht dich mit Marken, zu denen du wirklich passt.
        </p>
        <Link href="/creator/dashboard" className="mt-4 inline-block text-sm font-semibold text-rausch hover:underline">
          Schon dabei? Zum Creator-Dashboard →
        </Link>
      </div>

      <div className="mt-9 flex items-center gap-2 rounded-full bg-white p-2 shadow-pill ring-1 ring-line focus-within:ring-2 focus-within:ring-rausch">
        <span aria-hidden className="pl-3 text-lg text-muted">
          🔗
        </span>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="instagram.com/dein_handle"
          aria-label="Link zu deinem Profil"
          className="flex-1 bg-transparent px-1 py-2 text-base outline-none placeholder:text-muted"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-full bg-rausch px-6 py-3 font-semibold text-white transition hover:bg-rausch-dark disabled:opacity-50"
        >
          {loading ? "Analysiere…" : "Analysieren"}
        </button>
      </div>

      {profile && (
        <div className="mt-10 animate-rise overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line/70">
          {profile.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.coverUrl} alt="" className="aspect-[16/7] w-full object-cover" />
          )}
          <div className="p-6">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatarUrl}
                alt=""
                className="-mt-12 h-16 w-16 rounded-full object-cover ring-4 ring-white"
              />
              <div>
                <div className="text-lg font-semibold text-ink">{profile.handle}</div>
                <div className="text-sm text-muted">
                  {profile.followers.toLocaleString("de-DE")} Follower · {profile.audienceCity}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {profile.topics.map((t) => (
                <span key={t} className="rounded-full bg-cloud px-3 py-1 text-xs font-medium text-ink">
                  #{t}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <SignalBar label="Lokale Zielgruppe" value={profile.signals.localShare} />
              <SignalBar label="Echtes Engagement" value={profile.signals.engagement} />
              <SignalBar label="Reichweite" value={profile.signals.reach} />
            </div>

            <div className="mt-6 rounded-2xl bg-cloud p-4 text-sm text-muted">
              ✨ Profil von der KI erstellt. Marken sehen dich jetzt in passenden Match-Listen.
            </div>
            <Link
              href="/creator/dashboard"
              className="mt-4 block rounded-xl bg-rausch py-3.5 text-center font-semibold text-white transition hover:bg-rausch-dark"
            >
              Zum Creator-Dashboard →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
