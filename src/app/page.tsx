"use client";

import { useMetaApi } from "@/lib/hooks";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { LoadingPage, ErrorMessage } from "@/components/ui/loading";
import Link from "next/link";
import type { AdAccount, CampaignInsights } from "@/lib/types";

interface AccountResponse {
  account: AdAccount;
  insights: CampaignInsights | null;
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useMetaApi<AccountResponse>(
    "/api/meta/account?insights=true"
  );

  if (isLoading) return <LoadingPage />;
  if (error)
    return <ErrorMessage message={error.message} onRetry={() => mutate()} />;
  if (!data) return null;

  const { account, insights } = data;
  const currency = account.currency || "EUR";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Werbekonto: {account.name} ({account.account_id})
        </p>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Gesamtausgaben"
          value={formatCurrency(account.amount_spent, currency)}
          subtitle="Gesamt (Konto)"
        />
        {insights && (
          <>
            <StatCard
              label="Ausgaben (30 Tage)"
              value={formatCurrency(insights.spend, currency)}
              subtitle={`${insights.date_start} – ${insights.date_stop}`}
            />
            <StatCard
              label="Impressionen"
              value={formatNumber(insights.impressions)}
              subtitle="Letzte 30 Tage"
            />
            <StatCard
              label="Reichweite"
              value={insights.reach ? formatNumber(insights.reach) : "–"}
              subtitle="Letzte 30 Tage"
            />
          </>
        )}
        {!insights && (
          <>
            <StatCard label="Kontostand" value={formatCurrency(account.balance, currency)} />
            <StatCard label="Währung" value={currency} />
            <StatCard label="Zeitzone" value={account.timezone_name} />
          </>
        )}
      </div>

      {/* Performance */}
      {insights && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Performance (30 Tage)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Klicks</p>
              <p className="text-xl font-semibold">
                {insights.clicks ? formatNumber(insights.clicks) : "–"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CTR</p>
              <p className="text-xl font-semibold">
                {insights.ctr ? formatPercent(insights.ctr) : "–"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CPC</p>
              <p className="text-xl font-semibold">
                {insights.cpc
                  ? formatCurrency(
                      parseFloat(insights.cpc) * 100,
                      currency
                    )
                  : "–"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CPM</p>
              <p className="text-xl font-semibold">
                {insights.cpm
                  ? formatCurrency(
                      parseFloat(insights.cpm) * 100,
                      currency
                    )
                  : "–"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Schnellzugriff
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/campaigns/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neue Kampagne
          </Link>
          <Link href="/campaigns" className="btn-secondary">
            Kampagnen verwalten
          </Link>
          <Link href="/media" className="btn-secondary">
            Medien hochladen
          </Link>
        </div>
      </div>
    </div>
  );
}
