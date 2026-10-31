// Badge de statut d'un RDV passé (ou annulé).

const STYLES: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: "Venu", className: "bg-forest-soft text-forest" },
  NO_SHOW: { label: "Absent", className: "bg-danger-soft text-danger" },
  CANCELLED: { label: "Annulé", className: "bg-paper text-ink-faint" },
};

const TO_CHECK = { label: "À pointer", className: "bg-amber-soft text-amber-dark" };

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? TO_CHECK;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${style.className}`}>
      {style.label}
    </span>
  );
}
