"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CampaignObjective, CampaignStatus, BuyingType, BidStrategy } from "@/lib/types";

const objectives: { value: CampaignObjective; label: string; description: string }[] = [
  {
    value: "OUTCOME_AWARENESS",
    label: "Bekanntheit",
    description: "Erreiche so viele Personen wie möglich",
  },
  {
    value: "OUTCOME_TRAFFIC",
    label: "Traffic",
    description: "Leite Nutzer auf deine Website oder App",
  },
  {
    value: "OUTCOME_ENGAGEMENT",
    label: "Interaktion",
    description: "Erhalte mehr Likes, Kommentare und Shares",
  },
  {
    value: "OUTCOME_LEADS",
    label: "Leads",
    description: "Sammle Kontaktdaten potenzieller Kunden",
  },
  {
    value: "OUTCOME_SALES",
    label: "Verkäufe",
    description: "Steigere Conversions und Verkäufe",
  },
  {
    value: "OUTCOME_APP_PROMOTION",
    label: "App-Promotion",
    description: "Steigere App-Installationen und Nutzung",
  },
];

const specialAdCategories = [
  { value: "NONE", label: "Keine" },
  { value: "EMPLOYMENT", label: "Stellenangebote" },
  { value: "HOUSING", label: "Immobilien" },
  { value: "CREDIT", label: "Kreditangebote" },
  { value: "ISSUES_ELECTIONS_POLITICS", label: "Politik / Wahlen" },
];

const bidStrategies: { value: BidStrategy; label: string; description: string }[] = [
  {
    value: "LOWEST_COST_WITHOUT_CAP",
    label: "Niedrigste Kosten",
    description: "Maximiere Ergebnisse zum niedrigsten Preis (Standard)",
  },
  {
    value: "COST_CAP",
    label: "Kostenobergrenze",
    description: "Halte die durchschnittlichen Kosten unter einem Zielwert",
  },
  {
    value: "LOWEST_COST_WITH_BID_CAP",
    label: "Gebotsobergrenze",
    description: "Setze ein maximales Gebot pro Auktion",
  },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<CampaignObjective>("OUTCOME_TRAFFIC");
  const [status, setStatus] = useState<CampaignStatus>("PAUSED");
  const [specialCategory, setSpecialCategory] = useState("NONE");
  const [buyingType, setBuyingType] = useState<BuyingType>("AUCTION");

  // Budget optimization
  const [budgetLevel, setBudgetLevel] = useState<"campaign" | "adset">("adset");
  const [budgetType, setBudgetType] = useState<"daily" | "lifetime">("daily");
  const [budget, setBudget] = useState("");
  const [bidStrategy, setBidStrategy] = useState<BidStrategy>("LOWEST_COST_WITHOUT_CAP");

  // Schedule (for lifetime budget)
  const [startTime, setStartTime] = useState("");
  const [stopTime, setStopTime] = useState("");

  const isCBO = budgetLevel === "campaign";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const budgetCents = budget ? String(Math.round(parseFloat(budget) * 100)) : undefined;

      const payload: Record<string, unknown> = {
        name,
        objective,
        status,
        buying_type: buyingType,
        special_ad_categories: specialCategory === "NONE" ? [] : [specialCategory],
      };

      // CBO: Budget at campaign level
      if (isCBO && budgetCents) {
        if (budgetType === "daily") {
          payload.daily_budget = budgetCents;
        } else {
          payload.lifetime_budget = budgetCents;
        }
      }

      // Bid strategy (only for AUCTION buying type)
      if (buyingType === "AUCTION" && bidStrategy !== "LOWEST_COST_WITHOUT_CAP") {
        payload.bid_strategy = bidStrategy;
      }

      // Schedule
      if (startTime) payload.start_time = new Date(startTime).toISOString();
      if (stopTime) payload.stop_time = new Date(stopTime).toISOString();

      const res = await fetch("/api/meta/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      router.push("/campaigns");
    } catch {
      setError("Fehler beim Erstellen der Kampagne");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Neue Kampagne</h1>
        <p className="text-sm text-gray-500 mt-1">
          Schritt 1 von 3: Erstelle eine neue Werbekampagne
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700">
          <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold">1</span>
          Kampagne
        </div>
        <div className="w-6 h-px bg-gray-300" />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-400">
          <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">2</span>
          Ad Set
        </div>
        <div className="w-6 h-px bg-gray-300" />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-400">
          <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">3</span>
          Anzeige
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="label">Kampagnenname *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="z.B. Sommeraktion 2026"
            required
          />
        </div>

        {/* Special Ad Category */}
        <div>
          <label htmlFor="special" className="label">Besondere Anzeigenkategorie</label>
          <select
            id="special"
            value={specialCategory}
            onChange={(e) => setSpecialCategory(e.target.value)}
            className="select"
          >
            {specialAdCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Pflichtangabe bei Anzeigen für Stellen, Immobilien, Kredite oder Politik
          </p>
        </div>

        {/* Buying Type */}
        <div>
          <label className="label">Kauftyp</label>
          <div className="flex gap-3 mt-1">
            {(["AUCTION", "RESERVED"] as BuyingType[]).map((bt) => (
              <button
                key={bt}
                type="button"
                onClick={() => setBuyingType(bt)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  buyingType === bt
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {bt === "AUCTION" ? "Auktion" : "Reservierung"}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Auktion (Standard) – flexibel und leistungsbasiert. Reservierung – garantierte Reichweite.
          </p>
        </div>

        {/* Objective */}
        <div>
          <label className="label">Kampagnenziel *</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {objectives.map((obj) => (
              <button
                key={obj.value}
                type="button"
                onClick={() => setObjective(obj.value)}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  objective === obj.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-sm">{obj.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{obj.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Budget Optimization Level (CBO vs ABO) */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Kampagnen-Budgetoptimierung</h2>
          <p className="text-xs text-gray-500 mb-4">
            Wähle ob das Budget auf Kampagnen- (CBO) oder Ad-Set-Ebene (ABO) verwaltet wird
          </p>

          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setBudgetLevel("campaign")}
              className={`flex-1 text-left p-3 rounded-lg border-2 transition-colors ${
                budgetLevel === "campaign"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium text-sm">CBO – Kampagnen-Budget</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Meta verteilt das Budget automatisch auf die Ad Sets
              </p>
            </button>
            <button
              type="button"
              onClick={() => setBudgetLevel("adset")}
              className={`flex-1 text-left p-3 rounded-lg border-2 transition-colors ${
                budgetLevel === "adset"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium text-sm">ABO – Ad-Set-Budget</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Du setzt das Budget individuell pro Ad Set
              </p>
            </button>
          </div>

          {/* CBO Budget Settings */}
          {isCBO && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Daily vs Lifetime */}
              <div>
                <label className="label">Budget-Typ</label>
                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setBudgetType("daily")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                      budgetType === "daily"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    Tagesbudget
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetType("lifetime")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                      budgetType === "lifetime"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    Laufzeitbudget
                  </button>
                </div>
              </div>

              {/* Budget Amount */}
              <div>
                <label htmlFor="budget" className="label">
                  {budgetType === "daily" ? "Tagesbudget" : "Gesamtbudget"} (EUR) *
                </label>
                <div className="relative">
                  <input
                    id="budget"
                    type="number"
                    step="0.01"
                    min="1"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="input pl-8"
                    placeholder={budgetType === "daily" ? "z.B. 20.00" : "z.B. 500.00"}
                    required={isCBO}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {budgetType === "daily"
                    ? "Durchschnittlicher Betrag pro Tag. Meta kann bis zu 25% mehr ausgeben an starken Tagen."
                    : "Gesamtbetrag über die gesamte Laufzeit. Erfordert ein Enddatum."}
                </p>
              </div>

              {/* Schedule for lifetime budget */}
              {budgetType === "lifetime" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start" className="label">Startdatum *</label>
                    <input
                      id="start"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="stop" className="label">Enddatum *</label>
                    <input
                      id="stop"
                      type="datetime-local"
                      value={stopTime}
                      onChange={(e) => setStopTime(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bid Strategy */}
        {buyingType === "AUCTION" && (
          <div>
            <label className="label">Gebotsstrategie</label>
            <div className="space-y-2 mt-2">
              {bidStrategies.map((bs) => (
                <button
                  key={bs.value}
                  type="button"
                  onClick={() => setBidStrategy(bs.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    bidStrategy === bs.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">{bs.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{bs.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

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
          <p className="text-xs text-gray-400 mt-1">
            Empfehlung: &quot;Pausiert&quot; starten, dann Ad Sets und Ads hinzufügen
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button type="submit" disabled={loading || !name || (isCBO && !budget)} className="btn-primary">
            {loading ? "Erstelle..." : "Kampagne erstellen"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/campaigns")}
            className="btn-secondary"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
