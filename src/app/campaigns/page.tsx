"use client";

import { useState } from "react";
import Link from "next/link";
import { useMetaApi } from "@/lib/hooks";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingPage, ErrorMessage, EmptyState } from "@/components/ui/loading";
import type { Campaign, MetaPaginatedResponse } from "@/lib/types";

type StatusFilter = "ALL" | "ACTIVE" | "PAUSED" | "ARCHIVED";

export default function CampaignsPage() {
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const { data, error, isLoading, mutate } =
    useMetaApi<MetaPaginatedResponse<Campaign & { insights?: any }>>(
      "/api/meta/campaigns?insights=true"
    );

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function toggleStatus(campaign: Campaign) {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setActionLoading(campaign.id);
    try {
      await fetch("/api/meta/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaign.id, status: newStatus }),
      });
      mutate();
    } catch {
      // error handled silently, mutate will refresh
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Kampagne wirklich löschen?")) return;
    setActionLoading(id);
    try {
      await fetch("/api/meta/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      mutate();
    } catch {
      // error handled silently
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading) return <LoadingPage />;
  if (error)
    return <ErrorMessage message={error.message} onRetry={() => mutate()} />;

  const campaigns = data?.data || [];
  const filtered =
    filter === "ALL"
      ? campaigns.filter((c) => c.status !== "DELETED")
      : campaigns.filter((c) => c.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kampagnen</h1>
          <p className="text-sm text-gray-500 mt-1">
            {campaigns.length} Kampagnen insgesamt
          </p>
        </div>
        <Link href="/campaigns/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neue Kampagne
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "ACTIVE", "PAUSED", "ARCHIVED"] as StatusFilter[]).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {s === "ALL"
                ? "Alle"
                : s === "ACTIVE"
                ? "Aktiv"
                : s === "PAUSED"
                ? "Pausiert"
                : "Archiviert"}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Keine Kampagnen"
          description={
            filter === "ALL"
              ? "Du hast noch keine Kampagnen erstellt."
              : `Keine Kampagnen mit Status "${filter}".`
          }
          action={
            filter === "ALL" ? (
              <Link href="/campaigns/new" className="btn-primary btn-sm">
                Erste Kampagne erstellen
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => (
            <div key={campaign.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {campaign.name}
                    </h3>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Ziel: {campaign.objective.replace("OUTCOME_", "")}</span>
                    <span>ID: {campaign.id}</span>
                    <span>Erstellt: {formatDate(campaign.created_time)}</span>
                    {campaign.daily_budget && (
                      <span>
                        Tagesbudget: {formatCurrency(campaign.daily_budget)}
                      </span>
                    )}
                  </div>

                  {/* Insights Row */}
                  {campaign.insights && (
                    <div className="flex gap-6 mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-xs text-gray-400">Ausgaben</span>
                        <p className="text-sm font-medium">
                          {formatCurrency(campaign.insights.spend)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">
                          Impressionen
                        </span>
                        <p className="text-sm font-medium">
                          {formatNumber(campaign.insights.impressions)}
                        </p>
                      </div>
                      {campaign.insights.clicks && (
                        <div>
                          <span className="text-xs text-gray-400">Klicks</span>
                          <p className="text-sm font-medium">
                            {formatNumber(campaign.insights.clicks)}
                          </p>
                        </div>
                      )}
                      {campaign.insights.ctr && (
                        <div>
                          <span className="text-xs text-gray-400">CTR</span>
                          <p className="text-sm font-medium">
                            {parseFloat(campaign.insights.ctr).toFixed(2)}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => toggleStatus(campaign)}
                    disabled={actionLoading === campaign.id}
                    className="btn-secondary btn-sm"
                    title={
                      campaign.status === "ACTIVE"
                        ? "Pausieren"
                        : "Aktivieren"
                    }
                  >
                    {campaign.status === "ACTIVE" ? "Pausieren" : "Aktivieren"}
                  </button>
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    disabled={actionLoading === campaign.id}
                    className="btn-danger btn-sm"
                  >
                    Löschen
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
