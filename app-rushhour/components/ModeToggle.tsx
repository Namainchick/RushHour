"use client";
import { useMockMode } from "@/lib/mock-mode";

// Small pill in the nav to flip between Real (extraction + Supabase) and Mock
// (local fixtures, offline). Persists across reloads.
export function ModeToggle() {
  const [mock, setMock] = useMockMode();
  return (
    <button
      type="button"
      onClick={() => setMock(!mock)}
      title={mock ? "Mock-Modus: lokale Beispieldaten, kein Netz" : "Real-Modus: echte Extraktion + Supabase"}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        mock
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-emerald-300 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${mock ? "bg-amber-500" : "bg-emerald-500"}`} />
      {mock ? "Mock" : "Real"}
    </button>
  );
}
