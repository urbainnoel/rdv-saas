"use client";

import { useState } from "react";
import { MessageIcon } from "@/components/icons";

type Lead = {
  id: string;
  name: string;
  contact: string;
  context: string | null;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "À recontacter",
  CONTACTED: "Contacté",
  CONVERTED: "Converti",
  LOST: "Pas intéressé",
};

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-amber-soft text-amber-dark",
  CONTACTED: "bg-forest-soft text-forest",
  CONVERTED: "bg-forest text-white",
  LOST: "bg-paper text-ink-faint",
};

// Lien WhatsApp (wa.me) à partir d'un numéro : format international requis.
// Un numéro local guinéen (9 chiffres commençant par 6) reçoit l'indicatif 224.
function whatsappNumber(contact: string, defaultCountryCode: string | null): string | null {
  if (contact.includes("@")) return null;
  let digits = contact.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  digits = digits.replace(/\D/g, "");
  if (defaultCountryCode && /^6\d{8}$/.test(digits)) return defaultCountryCode + digits;
  return digits.length >= 8 ? digits : null;
}

export default function LeadList({
  leads: initialLeads,
  businessName,
  defaultCountryCode,
}: {
  leads: Lead[];
  businessName: string;
  defaultCountryCode: string | null;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<"todo" | "all">("todo");

  const todoCount = leads.filter((l) => l.status === "NEW").length;
  const visible = filter === "todo" ? leads.filter((l) => l.status === "NEW") : leads;

  async function changeStatus(id: string, status: string) {
    const previous = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    const res = await fetch(`/api/dashboard/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res?.ok) setLeads(previous);
  }

  async function remove(id: string) {
    const previous = leads;
    setLeads((ls) => ls.filter((l) => l.id !== id));
    const res = await fetch(`/api/dashboard/leads/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) setLeads(previous);
  }

  if (leads.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <MessageIcon className="h-8 w-8 text-ink-faint" />
        <p className="text-ink-soft">Aucun prospect pour l&apos;instant.</p>
        <p className="max-w-sm text-sm text-ink-faint">
          Quand un visiteur s&apos;intéresse à tes services sans réserver, ton assistant lui demande
          son contact. Il apparaîtra ici.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 flex gap-2 text-sm">
        <FilterButton active={filter === "todo"} onClick={() => setFilter("todo")}>
          À recontacter ({todoCount})
        </FilterButton>
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          Tous ({leads.length})
        </FilterButton>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-ink-soft">
          Tous tes prospects ont été recontactés.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {visible.map((lead) => {
            const firstName = lead.name.split(" ")[0];
            const wa = whatsappNumber(lead.contact, defaultCountryCode);
            const greeting = `Bonjour ${firstName}, c'est ${businessName}. Vous aviez échangé avec notre assistant, je reviens vers vous pour répondre à vos questions.`;
            return (
              <div key={lead.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{lead.name}</p>
                  <p className="text-sm text-ink-soft">{lead.contact}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {new Date(lead.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  {lead.context && (
                    <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm text-ink-soft">
                      « {lead.context} »
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {wa && (
                      <a
                        href={`https://wa.me/${wa}?text=${encodeURIComponent(greeting)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => lead.status === "NEW" && changeStatus(lead.id, "CONTACTED")}
                        className="rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-white transition hover:bg-forest-dark"
                      >
                        Écrire sur WhatsApp
                      </a>
                    )}
                    {!lead.contact.includes("@") && (
                      <a
                        href={`tel:${lead.contact}`}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-forest hover:text-forest"
                      >
                        Appeler
                      </a>
                    )}
                    {lead.contact.includes("@") && (
                      <a
                        href={`mailto:${lead.contact}?subject=${encodeURIComponent(businessName)}&body=${encodeURIComponent(greeting)}`}
                        onClick={() => lead.status === "NEW" && changeStatus(lead.id, "CONTACTED")}
                        className="rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-white transition hover:bg-forest-dark"
                      >
                        Envoyer un email
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={lead.status}
                    onChange={(e) => changeStatus(lead.id, e.target.value)}
                    aria-label={`Statut de ${lead.name}`}
                    className={`rounded-full border-0 px-3 py-1 text-xs font-medium ${STATUS_STYLES[lead.status] ?? ""}`}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(lead.id)}
                    className="text-xs text-ink-faint underline hover:text-danger"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 font-medium transition ${
        active ? "bg-forest text-white" : "bg-surface text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
