"use client";
import { useEffect, useRef, useState } from "react";
import { BusinessProfile } from "@/lib/types";

type Msg = { role: "ai" | "user"; content: React.ReactNode };
type Chip = { label: string; preset?: string };
type Question = { id: string; ai: string; chips: Chip[]; allowFreeText?: boolean };

const QUESTIONS: Question[] = [
  {
    id: "goal",
    ai: "Damit ich die richtigen Creator finde: Was ist gerade dein wichtigstes Ziel?",
    chips: [
      { label: "Mehr Gäste aus der Nachbarschaft", preset: "local_traffic" },
      { label: "Stadtweit bekannter werden", preset: "city_awareness" },
      { label: "Premium-Image aufbauen", preset: "premium_image" },
    ],
    allowFreeText: true,
  },
  {
    id: "radius",
    ai: "Verstanden. Wie weit ist dein typischer Gast bereit zu kommen?",
    chips: [{ label: "Nur das Viertel" }, { label: "Die ganze Stadt" }, { label: "Egal, Hauptsache Reichweite" }],
  },
  {
    id: "style",
    ai: "Welcher Content-Stil passt zu euch?",
    chips: [{ label: "Authentisch & gemütlich" }, { label: "Modern & clean" }, { label: "Premium & edel" }],
  },
  {
    id: "budget",
    ai: "Letzte Frage: grobes Budget pro Kollaboration?",
    chips: [{ label: "unter 200 €" }, { label: "200–500 €" }, { label: "über 500 €" }],
  },
];

const ANALYZE_STEPS = [
  "Lokale Zielgruppe gewichten",
  "Echtes Engagement prüfen",
  "Stil-Match zur Marke berechnen",
  "Kandidaten ranken",
];

export function GoalChat({
  business,
  onComplete,
}: {
  business: BusinessProfile;
  onComplete: (presetId: string, goalText: string) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [awaiting, setAwaiting] = useState<number>(-1);
  const [phase, setPhase] = useState<"asking" | "analyzing">("asking");
  const [analyzeDone, setAnalyzeDone] = useState(0);
  const [draft, setDraft] = useState("");

  const answers = useRef<Record<string, string>>({});
  const preset = useRef<string>("local_traffic");
  const started = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function say(content: React.ReactNode, delay = 850) {
    setTyping(true);
    await sleep(delay);
    setTyping(false);
    setMessages((m) => [...m, { role: "ai", content }]);
    await sleep(120);
  }

  async function askQuestion(i: number) {
    await say(QUESTIONS[i].ai);
    setAwaiting(i);
  }

  async function answer(i: number, text: string, chipPreset?: string) {
    setAwaiting(-1);
    setMessages((m) => [...m, { role: "user", content: text }]);
    answers.current[QUESTIONS[i].id] = text;
    // Chip = deterministic preset. Free text = "" so the backend lets the LLM weigh the goal.
    if (i === 0) preset.current = chipPreset ?? "";
    await sleep(250);
    if (i + 1 < QUESTIONS.length) await askQuestion(i + 1);
    else await runAnalyzing();
  }

  async function runAnalyzing() {
    await say("Perfekt — ich hab alles. Ich gewichte jetzt die Signale nach deinem Ziel und matche…");
    setPhase("analyzing");
    for (let s = 1; s <= ANALYZE_STEPS.length; s++) {
      await sleep(520);
      setAnalyzeDone(s);
    }
    await sleep(600);
    const a = answers.current;
    const goalText = [
      a.goal,
      a.radius && `Einzugsgebiet: ${a.radius}`,
      a.style && `Stil: ${a.style}`,
      a.budget && `Budget: ${a.budget}`,
    ]
      .filter(Boolean)
      .join(". ");
    onComplete(preset.current, goalText);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    runIntro();
    async function runIntro() {
      await say(<>Hi! Ich bin dein RushHour-Matchmaker. 👋</>);
      await say(
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Von eurer Website erkannt</div>
          <div className="font-semibold text-neutral-900">{business.name}</div>
          <div className="text-sm text-neutral-600">
            {business.category} · {business.city}
            {business.neighborhood ? `-${business.neighborhood}` : ""}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {business.styleTags.slice(0, 4).map((t) => (
              <span key={t} className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs text-neutral-600">
                {t}
              </span>
            ))}
          </div>
        </div>,
        1000,
      );
      await askQuestion(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, awaiting, analyzeDone]);

  const q = awaiting >= 0 ? QUESTIONS[awaiting] : null;

  return (
    <div className="mt-6 flex flex-col">
      <div className="flex-1 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-sm text-white"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm bg-cloud px-4 py-2.5 text-sm text-ink"
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-3">
              <div className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === "analyzing" && (
          <div className="rounded-2xl bg-neutral-50 p-4">
            {ANALYZE_STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-2 py-1 text-sm transition-opacity duration-300 ${
                  i < analyzeDone ? "opacity-100" : "opacity-30"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    i < analyzeDone ? "bg-emerald-500 text-white" : "bg-neutral-200 text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className="text-neutral-700">{s}</span>
              </div>
            ))}
          </div>
        )}

        <div ref={bottom} />
      </div>

      {q && !typing && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {q.chips.map((c) => (
              <button
                key={c.label}
                onClick={() => answer(awaiting, c.label, c.preset)}
                className="rounded-full border border-line px-3.5 py-2 text-sm text-ink transition hover:border-rausch hover:bg-rausch/5"
              >
                {c.label}
              </button>
            ))}
          </div>
          {q.allowFreeText && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) {
                  answer(awaiting, draft.trim());
                  setDraft("");
                }
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="…oder schreib dein Ziel selbst"
                className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-rausch"
              />
              <button type="submit" className="rounded-xl bg-rausch px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rausch-dark">
                Senden
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
