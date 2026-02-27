"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CampaignObjective, CampaignStatus } from "@/lib/types";

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

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [objective, setObjective] = useState<CampaignObjective>("OUTCOME_TRAFFIC");
  const [status, setStatus] = useState<CampaignStatus>("PAUSED");
  const [dailyBudget, setDailyBudget] = useState("");
  const [specialCategory, setSpecialCategory] = useState("NONE");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        objective,
        status,
        special_ad_categories:
          specialCategory === "NONE" ? [] : [specialCategory],
        ...(dailyBudget
          ? { daily_budget: String(Math.round(parseFloat(dailyBudget) * 100)) }
          : {}),
      };

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
          Erstelle eine neue Werbekampagne
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
          <label htmlFor="name" className="label">
            Kampagnenname *
          </label>
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
                <p className="text-xs text-gray-500 mt-0.5">
                  {obj.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label htmlFor="budget" className="label">
            Tagesbudget (EUR)
          </label>
          <div className="relative">
            <input
              id="budget"
              type="number"
              step="0.01"
              min="1"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="input pl-8"
              placeholder="z.B. 20.00"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              €
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Optional – Budget kann auch auf Ad-Set-Ebene gesetzt werden
          </p>
        </div>

        {/* Special Ad Category */}
        <div>
          <label htmlFor="special" className="label">
            Besondere Anzeigenkategorie
          </label>
          <select
            id="special"
            value={specialCategory}
            onChange={(e) => setSpecialCategory(e.target.value)}
            className="select"
          >
            {specialAdCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
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
          <p className="text-xs text-gray-400 mt-1">
            Empfehlung: &quot;Pausiert&quot; starten, dann Ad Sets und Ads hinzufügen
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button type="submit" disabled={loading || !name} className="btn-primary">
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
