"use client";

const statusConfig: Record<string, { className: string; label: string }> = {
  ACTIVE: { className: "badge-active", label: "Aktiv" },
  PAUSED: { className: "badge-paused", label: "Pausiert" },
  DELETED: { className: "badge-deleted", label: "Gelöscht" },
  ARCHIVED: { className: "badge-archived", label: "Archiviert" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    className: "badge bg-gray-100 text-gray-800",
    label: status,
  };
  return <span className={config.className}>{config.label}</span>;
}
