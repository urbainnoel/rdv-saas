"use client";

import { useRef, useState, useEffect } from "react";

type SlotChoice = { index: number; label: string };
type Message = {
  role: "user" | "assistant";
  content: string;
  // Créneaux proposés par l'assistant, affichés en boutons sous sa bulle.
  slots?: SlotChoice[];
  // Lien de gestion du RDV qui vient d'être réservé dans la discussion.
  manageUrl?: string | null;
};

// Le lien n'est rendu cliquable que s'il pointe bien vers une page de
// gestion de ce site (jamais une URL arbitraire écrite par le modèle).
function isOwnManageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.origin === window.location.origin && u.pathname.startsWith("/rdv/");
  } catch {
    return false;
  }
}

function MessageText({ content, manageUrl }: { content: string; manageUrl?: string | null }) {
  if (!isOwnManageUrl(manageUrl) || !content.includes(manageUrl)) return <>{content}</>;
  const [before, ...rest] = content.split(manageUrl);
  return (
    <>
      {before}
      <a href={manageUrl} target="_blank" rel="noreferrer" className="font-semibold text-forest underline [overflow-wrap:anywhere]">
        {manageUrl}
      </a>
      {rest.join(manageUrl)}
    </>
  );
}

// Panneau de chat intégré dans la page (plus une bulle flottante cachée dans
// un coin) : c'est une des deux portes d'entrée principales de la page de
// réservation, au même niveau que le formulaire.
export default function ChatWidget({
  slug,
  businessName,
}: {
  slug: string;
  businessName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Bonjour, je suis l'assistant de ${businessName}. Dites-moi ce que vous cherchez : je réponds à vos questions et je peux réserver votre créneau directement, ici.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Seuls le rôle et le texte partent au serveur.
        body: JSON.stringify({ slug, messages: nextMessages.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer ?? "Désolé, une erreur est survenue.",
          slots: Array.isArray(data.slots) ? data.slots : [],
          manageUrl: typeof data.manageUrl === "string" ? data.manageUrl : null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  const lastIndex = messages.length - 1;

  return (
    <div className="flex h-[30rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={`w-fit max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user" ? "bg-forest text-white" : "bg-paper text-ink"
              }`}
            >
              <MessageText content={m.content} manageUrl={m.manageUrl} />
            </div>

            {isOwnManageUrl(m.manageUrl) && (
              <a
                href={m.manageUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex min-h-11 w-fit items-center rounded-xl border-2 border-forest px-4 text-sm font-bold text-forest transition hover:bg-forest-soft"
              >
                Gérer mon rendez-vous
              </a>
            )}

            {/* Créneaux cliquables : seulement sous le dernier message, pour
                ne pas laisser choisir un horaire d'une proposition dépassée. */}
            {m.role === "assistant" && i === lastIndex && !loading && m.slots && m.slots.length > 0 && (
              <div className="mt-2 flex max-w-[85%] flex-wrap gap-2" role="group" aria-label="Créneaux proposés">
                {m.slots.map((slot) => (
                  <button
                    key={slot.index}
                    type="button"
                    onClick={() => send(`Je choisis le ${slot.label}`)}
                    className="min-h-11 rounded-xl border-2 border-forest bg-surface px-3.5 py-2 text-left text-sm font-semibold text-forest transition first-letter:uppercase hover:bg-forest hover:text-white"
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex w-fit items-center gap-1 rounded-xl bg-paper px-3 py-2.5">
            <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-ink-faint [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-ink-faint [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-ink-faint [animation-delay:300ms]" />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message…"
          className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-forest"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-xl bg-forest px-3 py-2 text-sm font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
