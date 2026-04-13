import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata = {
  title: "Manual — The Factory",
};

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-tf-bg p-6 font-sans text-slate-200 md:p-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbage til The Factory
        </Link>
        <header className="mb-10 border-b border-tf-border pb-6">
          <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-400/80">
            <BookOpen className="h-4 w-4" />
            Manual
          </p>
          <h1 className="text-3xl font-bold text-white">The Factory — kort guide</h1>
          <p className="mt-2 text-slate-400">
            Hvad knapper og paneler gør. Ingen jargon: bare så du kan finde rundt.
          </p>
        </header>
        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-cyan-200">Øverst på siden</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Forbind gateway</strong> — åbner forbindelse til OpenClaw med koden fra{" "}
                <code className="text-slate-400">openclaw.json</code>.
              </li>
              <li>
                <strong>Afbryd</strong> — lukker forbindelsen.
              </li>
              <li>
                <strong>Gateway LIVE / Offline</strong> — om der er live forbindelse lige nu.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-cyan-200">Start her (grøn boks)</h2>
            <p className="mb-2">
              Vises når du ikke er forbundet. Den minder dig om at sætte <code className="text-slate-400">authToken</code>{" "}
              og starte gatewayen.
            </p>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-cyan-200">War Room</h2>
            <p className="mb-2">Status-oversigt for Eugene og under-agenter (Alpha, Bravo, Charlie). Det er overblik — ikke chat.</p>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-cyan-200">Clearance Room</h2>
            <p className="mb-2">
              Når gatewayen beder om lov til noget farligt (fx kørsel af kommando), dukker det op her. Du kan godkende eller
              afvise, hvis din gateway annoncerer de rigtige metoder.
            </p>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-cyan-200">The Factory</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Alle → lounge / station</strong> — flytter alle bots visuelt til pause-rum eller arbejdsplads.
              </li>
              <li>
                <strong>Nulstil XP/log</strong> — nulstiller XP, chat med Eugene og gemt agent-data i denne browser.
              </li>
              <li>
                <strong>Eu / A / B / C</strong> — kaffe = lounge, kuffert = station, job/idle/done styrer om de “arbejder”.
              </li>
              <li>
                <strong>Eugene · direktiv</strong> — skriv opgaver her (som Telegram, men i browseren). Vælg evt. en
                OpenClaw-session og flueben for at spejle til gateway.
              </li>
              <li>
                <strong>FAB-NET</strong> — kort tekst om hvor mange der er aktive eller i pause.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-cyan-200">Gateway live</h2>
            <p>Rå events fra WebSocket. Godt til at se om der sker noget i gatewayen.</p>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-cyan-200">Aktive sessioner</h2>
            <p>
              JSON fra <code className="text-slate-400">sessions.list</code>. Bruges bl.a. til at vælge session i Eugene-panelet.
            </p>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-cyan-200">Memory center / Skill center</h2>
            <p>
              <strong>Hukommelse</strong> — log-linjer som dashboardet har gemt per agent (fx fra Eugene-chat).
              <br />
              <strong>Skills</strong> — dine egne stikord/liste per agent; søg, tilføj, fjern. Alt gemmes lokalt i browseren.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

