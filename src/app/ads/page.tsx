"use client";

import { useState } from "react";
import Link from "next/link";
import { useMetaApi } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingPage, ErrorMessage, EmptyState } from "@/components/ui/loading";
import type { Ad, MetaPaginatedResponse } from "@/lib/types";

export default function AdsPage() {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");
  const { data, error, isLoading, mutate } =
    useMetaApi<MetaPaginatedResponse<Ad>>("/api/meta/ads");

  if (isLoading) return <LoadingPage />;
  if (error)
    return <ErrorMessage message={error.message} onRetry={() => mutate()} />;

  const ads = data?.data || [];
  const filtered =
    filter === "ALL"
      ? ads.filter((a) => a.status !== "DELETED")
      : ads.filter((a) => a.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anzeigen</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ads.length} Anzeigen insgesamt
          </p>
        </div>
        <Link href="/ads/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neue Anzeige
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "ACTIVE", "PAUSED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {s === "ALL" ? "Alle" : s === "ACTIVE" ? "Aktiv" : "Pausiert"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Keine Anzeigen"
          description={
            filter === "ALL"
              ? "Erstelle zuerst ein Ad Set, dann eine Anzeige."
              : `Keine Anzeigen mit Status "${filter}".`
          }
          action={
            <Link href="/ads/new" className="btn-primary btn-sm">
              Anzeige erstellen
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ad) => (
            <div key={ad.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {ad.name}
                    </h3>
                    <StatusBadge status={ad.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>ID: {ad.id}</span>
                    <span>Ad Set: {ad.adset_id}</span>
                    <span>Creative: {ad.creative?.id || "–"}</span>
                    <span>Erstellt: {formatDate(ad.created_time)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
