"use client";

import { useRef, useState, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, messages: nextMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer ?? "Désolé, une erreur est survenue." },
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

  return (
    <div className="flex h-[30rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              m.role === "user" ? "ml-auto bg-forest text-white" : "bg-paper text-ink"
            }`}
          >
            {m.content}
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
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-forest"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-forest px-3 py-2 text-sm font-medium text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
