"use client";
import { useState } from "react";
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
    setProfile(p); setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">RushHour für Creators</h1>
      <p className="mt-2 text-neutral-600">Link rein — wir bauen dein Profil automatisch.</p>
      <div className="mt-6 flex gap-2">
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="instagram.com/dein_handle"
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900" />
        <button onClick={submit} disabled={loading}
          className="rounded-xl bg-neutral-900 px-5 py-3 font-medium text-white disabled:opacity-50">
          {loading ? "…" : "Analysieren"}
        </button>
      </div>

      {profile && (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <img src={profile.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <div className="font-semibold text-neutral-900">{profile.handle}</div>
              <div className="text-xs text-neutral-500">{profile.followers.toLocaleString("de-DE")} Follower · {profile.audienceCity}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.topics.map((t) => <span key={t} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">{t}</span>)}
          </div>
          <div className="mt-5 space-y-2">
            <SignalBar label="Lokale Zielgruppe" value={profile.signals.localShare} />
            <SignalBar label="Echtes Engagement" value={profile.signals.engagement} />
            <SignalBar label="Reichweite" value={profile.signals.reach} />
          </div>
        </div>
      )}
    </main>
  );
}
