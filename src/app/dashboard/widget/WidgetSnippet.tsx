"use client";

import { useState } from "react";

export default function WidgetSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-ink p-4">
      <div className="flex items-start justify-between gap-3">
        <code className="block overflow-x-auto whitespace-pre text-sm text-paper">{snippet}</code>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-xl bg-forest px-3 py-1.5 text-xs font-bold text-white transition hover:bg-forest-dark"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
    </div>
  );
}
