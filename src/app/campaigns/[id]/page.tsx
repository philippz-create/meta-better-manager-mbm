"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMetaApi } from "@/lib/hooks";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingPage, ErrorMessage, EmptyState } from "@/components/ui/loading";
import type { Campaign, AdSet, Ad, MetaPaginatedResponse, CampaignInsights } from "@/lib/types";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: campaign, error, isLoading, mutate } =
    useMetaApi<Campaign>(`/api/meta/campaigns/${id}`);

  const { data: insightsData } =
    useMetaApi<MetaPaginatedResponse<CampaignInsights>>(`/api/meta/campaigns/${id}/insights`);

  const { data: adSetsData, mutate: mutateAdSets } =
    useMetaApi<MetaPaginatedResponse<AdSet>>(`/api/meta/adsets?campaign_id=${id}`);

  const { data: adsData } =
    useMetaApi<MetaPaginatedResponse<Ad>>(`/api/meta/ads?campaign_id=${id}`);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function toggleCampaignStatus() {
    if (!campaign) return;
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setActionLoading("campaign");
    try {
      await fetch("/api/meta/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaign.id, status: newStatus }),
      });
      mutate();
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleAdSetStatus(adSet: AdSet) {
    const newStatus = adSet.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setActionLoading(adSet.id);
    try {
      await fetch("/api/meta/adsets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: adSet.id, status: newStatus }),
      });
      mutateAdSets();
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => mutate()} />;
  if (!campaign) return <ErrorMessage message="Kampagne nicht gefunden" />;

  const insights = insightsData?.data?.[0];
  const adSets = adSetsData?.data?.filter((a) => a.status !== "DELETED") || [];
  const ads = adsData?.data?.filter((a) => a.status !== "DELETED") || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/campaigns" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 truncate">{campaign.name}</h1>
        <StatusBadge status={campaign.status} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-6 ml-8">
        <span>Ziel: {campaign.objective.replace("OUTCOME_", "")}</span>
        <span>ID: {campaign.id}</span>
        <span>Erstellt: {formatDate(campaign.created_time)}</span>
        {campaign.daily_budget && <span>Tagesbudget: {formatCurrency(campaign.daily_budget)}</span>}
        {campaign.lifetime_budget && <span>Laufzeitbudget: {formatCurrency(campaign.lifetime_budget)}</span>}
      </div>

      {/* Campaign Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={toggleCampaignStatus}
          disabled={actionLoading === "campaign"}
          className="btn-secondary btn-sm"
        >
          {campaign.status === "ACTIVE" ? "Kampagne pausieren" : "Kampagne aktivieren"}
        </button>
      </div>

      {/* Insights */}
      {insights && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <span className="text-xs text-gray-400">Ausgaben</span>
            <p className="text-lg font-semibold">{formatCurrency(insights.spend)}</p>
          </div>
          <div className="card p-4">
            <span className="text-xs text-gray-400">Impressionen</span>
            <p className="text-lg font-semibold">{formatNumber(insights.impressions)}</p>
          </div>
          {insights.clicks && (
            <div className="card p-4">
              <span className="text-xs text-gray-400">Klicks</span>
              <p className="text-lg font-semibold">{formatNumber(insights.clicks)}</p>
            </div>
          )}
          {insights.ctr && (
            <div className="card p-4">
              <span className="text-xs text-gray-400">CTR</span>
              <p className="text-lg font-semibold">{parseFloat(insights.ctr).toFixed(2)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Ad Sets Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Ad Sets ({adSets.length})
          </h2>
          <Link href={`/adsets/new?campaign_id=${id}`} className="btn-primary btn-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neues Ad Set
          </Link>
        </div>

        {adSets.length === 0 ? (
          <EmptyState
            title="Keine Ad Sets"
            description="Erstelle ein Ad Set für diese Kampagne, um Zielgruppe und Budget festzulegen."
            action={
              <Link href={`/adsets/new?campaign_id=${id}`} className="btn-primary btn-sm">
                Erstes Ad Set erstellen
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {adSets.map((adSet) => {
              const adSetAds = ads.filter((a) => a.adset_id === adSet.id);
              return (
                <div key={adSet.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{adSet.name}</h3>
                        <StatusBadge status={adSet.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {adSet.daily_budget && <span>Budget: {formatCurrency(adSet.daily_budget)}/Tag</span>}
                        <span>Billing: {adSet.billing_event}</span>
                        <span>Optimierung: {adSet.optimization_goal}</span>
                        <span>{adSetAds.length} Anzeige{adSetAds.length !== 1 ? "n" : ""}</span>
                      </div>

                      {/* Targeting Summary */}
                      {adSet.targeting && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {adSet.targeting.age_min && (
                            <span className="badge bg-gray-100 text-gray-700">
                              Alter: {adSet.targeting.age_min}–{adSet.targeting.age_max || 65}
                            </span>
                          )}
                          {adSet.targeting.geo_locations?.countries?.map((c) => (
                            <span key={c} className="badge bg-blue-100 text-blue-700">{c}</span>
                          ))}
                        </div>
                      )}

                      {/* Ads in this Ad Set */}
                      {adSetAds.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2">Anzeigen:</p>
                          <div className="space-y-1">
                            {adSetAds.map((ad) => (
                              <div key={ad.id} className="flex items-center gap-2 text-xs text-gray-600">
                                <StatusBadge status={ad.status} />
                                <span>{ad.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Link
                        href={`/ads/new?adset_id=${adSet.id}&campaign_id=${id}`}
                        className="btn-primary btn-sm"
                      >
                        + Anzeige
                      </Link>
                      <button
                        onClick={() => toggleAdSetStatus(adSet)}
                        disabled={actionLoading === adSet.id}
                        className="btn-secondary btn-sm"
                      >
                        {adSet.status === "ACTIVE" ? "Pause" : "Aktiv"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
