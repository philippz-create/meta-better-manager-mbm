"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMetaApi } from "@/lib/hooks";
import { LoadingPage } from "@/components/ui/loading";
import type {
  Campaign,
  MetaPaginatedResponse,
  BillingEvent,
  OptimizationGoal,
  AdSetStatus,
} from "@/lib/types";

const optimizationGoals: { value: OptimizationGoal; label: string }[] = [
  { value: "REACH", label: "Reichweite" },
  { value: "IMPRESSIONS", label: "Impressionen" },
  { value: "LINK_CLICKS", label: "Link-Klicks" },
  { value: "LANDING_PAGE_VIEWS", label: "Landingpage-Aufrufe" },
  { value: "LEAD_GENERATION", label: "Lead-Generierung" },
  { value: "CONVERSIONS", label: "Conversions" },
];

const billingEvents: { value: BillingEvent; label: string }[] = [
  { value: "IMPRESSIONS", label: "Impressionen (CPM)" },
  { value: "LINK_CLICKS", label: "Link-Klicks (CPC)" },
];

const countries = [
  { code: "DE", label: "Deutschland" },
  { code: "AT", label: "Österreich" },
  { code: "CH", label: "Schweiz" },
  { code: "US", label: "USA" },
  { code: "GB", label: "Großbritannien" },
  { code: "FR", label: "Frankreich" },
  { code: "IT", label: "Italien" },
  { code: "ES", label: "Spanien" },
  { code: "NL", label: "Niederlande" },
  { code: "PL", label: "Polen" },
];

export default function NewAdSetPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <NewAdSetForm />
    </Suspense>
  );
}

function NewAdSetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCampaignId = searchParams.get("campaign_id") || "";

  const { data: campaignsData, isLoading: campaignsLoading } =
    useMetaApi<MetaPaginatedResponse<Campaign>>("/api/meta/campaigns");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [campaignId, setCampaignId] = useState(presetCampaignId);
  const [status, setStatus] = useState<AdSetStatus>("PAUSED");
  const [dailyBudget, setDailyBudget] = useState("");
  const [billingEvent, setBillingEvent] = useState<BillingEvent>("IMPRESSIONS");
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>("REACH");
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [genders, setGenders] = useState<number[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["DE"]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        campaign_id: campaignId,
        status,
        billing_event: billingEvent,
        optimization_goal: optimizationGoal,
        ...(dailyBudget
          ? { daily_budget: String(Math.round(parseFloat(dailyBudget) * 100)) }
          : {}),
        ...(startTime ? { start_time: new Date(startTime).toISOString() } : {}),
        ...(endTime ? { end_time: new Date(endTime).toISOString() } : {}),
        targeting: {
          age_min: parseInt(ageMin),
          age_max: parseInt(ageMax),
          ...(genders.length > 0 ? { genders } : {}),
          geo_locations: {
            countries: selectedCountries,
          },
        },
      };

      const res = await fetch("/api/meta/adsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      router.push(campaignId ? `/campaigns/${campaignId}` : "/adsets");
    } catch {
      setError("Fehler beim Erstellen des Ad Sets");
    } finally {
      setLoading(false);
    }
  }

  if (campaignsLoading) return <LoadingPage />;

  const campaigns = campaignsData?.data?.filter((c) => c.status !== "DELETED") || [];

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Neues Ad Set</h1>
        <p className="text-sm text-gray-500 mt-1">
          Definiere Zielgruppe, Budget und Zeitraum
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="label">Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="z.B. DE 18-35 Interesse: Fitness"
            required
          />
        </div>

        {/* Campaign */}
        <div>
          <label htmlFor="campaign" className="label">Kampagne *</label>
          {campaigns.length === 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
              Keine Kampagnen vorhanden.{" "}
              <a href="/campaigns/new" className="underline">
                Erstelle zuerst eine Kampagne.
              </a>
            </div>
          ) : (
            <select
              id="campaign"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="select"
              required
            >
              <option value="">Kampagne wählen...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Optimization & Billing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="goal" className="label">Optimierungsziel *</label>
            <select
              id="goal"
              value={optimizationGoal}
              onChange={(e) => setOptimizationGoal(e.target.value as OptimizationGoal)}
              className="select"
            >
              {optimizationGoals.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="billing" className="label">Abrechnung *</label>
            <select
              id="billing"
              value={billingEvent}
              onChange={(e) => setBillingEvent(e.target.value as BillingEvent)}
              className="select"
            >
              {billingEvents.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget */}
        <div>
          <label htmlFor="budget" className="label">Tagesbudget (EUR) *</label>
          <div className="relative">
            <input
              id="budget"
              type="number"
              step="0.01"
              min="1"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="input pl-8"
              placeholder="z.B. 10.00"
              required
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
          </div>
        </div>

        {/* Targeting Section */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Zielgruppe</h2>

          {/* Age */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="ageMin" className="label">Alter von</label>
              <input
                id="ageMin"
                type="number"
                min="13"
                max="65"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="ageMax" className="label">Alter bis</label>
              <input
                id="ageMax"
                type="number"
                min="13"
                max="65"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="mb-4">
            <label className="label">Geschlecht</label>
            <div className="flex gap-3 mt-1">
              {[
                { value: [] as number[], label: "Alle" },
                { value: [1], label: "Männlich" },
                { value: [2], label: "Weiblich" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setGenders(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    JSON.stringify(genders) === JSON.stringify(opt.value)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Countries */}
          <div>
            <label className="label">Länder</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {countries.map((c) => {
                const isSelected = selectedCountries.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedCountries((prev) =>
                        isSelected
                          ? prev.filter((x) => x !== c.code)
                          : [...prev, c.code]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Zeitraum */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start" className="label">Startdatum</label>
            <input
              id="start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="end" className="label">Enddatum</label>
            <input
              id="end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="label">Startstatus</label>
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={() => setStatus("PAUSED")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                status === "PAUSED"
                  ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              Pausiert
            </button>
            <button
              type="button"
              onClick={() => setStatus("ACTIVE")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                status === "ACTIVE"
                  ? "border-green-400 bg-green-50 text-green-800"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              Sofort aktiv
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || !name || !campaignId}
            className="btn-primary"
          >
            {loading ? "Erstelle..." : "Ad Set erstellen"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/adsets")}
            className="btn-secondary"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
