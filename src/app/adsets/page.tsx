"use client";

import { useState } from "react";
import Link from "next/link";
import { useMetaApi } from "@/lib/hooks";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingPage, ErrorMessage, EmptyState } from "@/components/ui/loading";
import type { AdSet, MetaPaginatedResponse } from "@/lib/types";

export default function AdSetsPage() {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");
  const { data, error, isLoading, mutate } =
    useMetaApi<MetaPaginatedResponse<AdSet>>("/api/meta/adsets");

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function toggleStatus(adSet: AdSet) {
    const newStatus = adSet.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setActionLoading(adSet.id);
    try {
      await fetch("/api/meta/adsets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: adSet.id, status: newStatus }),
      });
      mutate();
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading) return <LoadingPage />;
  if (error)
    return <ErrorMessage message={error.message} onRetry={() => mutate()} />;

  const adSets = data?.data || [];
  const filtered =
    filter === "ALL"
      ? adSets.filter((a) => a.status !== "DELETED")
      : adSets.filter((a) => a.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Sets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {adSets.length} Ad Sets insgesamt
          </p>
        </div>
        <Link href="/adsets/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neues Ad Set
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
          title="Keine Ad Sets"
          description={
            filter === "ALL"
              ? "Erstelle zuerst eine Kampagne, dann ein Ad Set."
              : `Keine Ad Sets mit Status "${filter}".`
          }
          action={
            <Link href="/adsets/new" className="btn-primary btn-sm">
              Ad Set erstellen
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((adSet) => (
            <div key={adSet.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {adSet.name}
                    </h3>
                    <StatusBadge status={adSet.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>ID: {adSet.id}</span>
                    <span>Kampagne: {adSet.campaign_id}</span>
                    <span>Billing: {adSet.billing_event}</span>
                    <span>Optimierung: {adSet.optimization_goal}</span>
                    <span>Erstellt: {formatDate(adSet.created_time)}</span>
                    {adSet.daily_budget && (
                      <span>
                        Tagesbudget: {formatCurrency(adSet.daily_budget)}
                      </span>
                    )}
                  </div>

                  {/* Targeting Summary */}
                  {adSet.targeting && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">Targeting:</p>
                      <div className="flex flex-wrap gap-2">
                        {adSet.targeting.age_min && (
                          <span className="badge bg-gray-100 text-gray-700">
                            Alter: {adSet.targeting.age_min}–{adSet.targeting.age_max || 65}
                          </span>
                        )}
                        {adSet.targeting.geo_locations?.countries?.map((c) => (
                          <span key={c} className="badge bg-blue-100 text-blue-700">
                            {c}
                          </span>
                        ))}
                        {adSet.targeting.interests?.map((i) => (
                          <span key={i.id} className="badge bg-purple-100 text-purple-700">
                            {i.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => toggleStatus(adSet)}
                    disabled={actionLoading === adSet.id}
                    className="btn-secondary btn-sm"
                  >
                    {adSet.status === "ACTIVE" ? "Pausieren" : "Aktivieren"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
