"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMetaApi } from "@/lib/hooks";
import { LoadingPage } from "@/components/ui/loading";
import type {
  AdSet,
  AdImage,
  AdCreative,
  MetaPaginatedResponse,
  AdStatus,
} from "@/lib/types";

const ctaTypes = [
  { value: "LEARN_MORE", label: "Mehr erfahren" },
  { value: "SHOP_NOW", label: "Jetzt kaufen" },
  { value: "SIGN_UP", label: "Registrieren" },
  { value: "BOOK_TRAVEL", label: "Jetzt buchen" },
  { value: "CONTACT_US", label: "Kontaktiere uns" },
  { value: "DOWNLOAD", label: "Herunterladen" },
  { value: "GET_OFFER", label: "Angebot sichern" },
  { value: "APPLY_NOW", label: "Jetzt bewerben" },
  { value: "SUBSCRIBE", label: "Abonnieren" },
  { value: "NO_BUTTON", label: "Kein Button" },
];

export default function NewAdPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <NewAdForm />
    </Suspense>
  );
}

function NewAdForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetAdSetId = searchParams.get("adset_id") || "";
  const presetCampaignId = searchParams.get("campaign_id") || "";

  const { data: adSetsData, isLoading: adSetsLoading } =
    useMetaApi<MetaPaginatedResponse<AdSet>>("/api/meta/adsets");
  const { data: imagesData, isLoading: imagesLoading } =
    useMetaApi<MetaPaginatedResponse<AdImage>>("/api/meta/media");
  const { data: creativesData, isLoading: creativesLoading } =
    useMetaApi<MetaPaginatedResponse<AdCreative>>("/api/meta/creatives");

  const [step, setStep] = useState<"creative" | "ad">("creative");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Creative fields
  const [creativeName, setCreativeName] = useState("");
  const [pageId, setPageId] = useState("");
  const [message, setMessage] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedImageHash, setSelectedImageHash] = useState("");
  const [ctaType, setCtaType] = useState("LEARN_MORE");
  const [createdCreativeId, setCreatedCreativeId] = useState("");

  // Ad fields
  const [adName, setAdName] = useState("");
  const [adSetId, setAdSetId] = useState(presetAdSetId);
  const [adStatus, setAdStatus] = useState<AdStatus>("PAUSED");
  const [useExistingCreative, setUseExistingCreative] = useState(false);
  const [existingCreativeId, setExistingCreativeId] = useState("");

  async function handleCreateCreative(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: creativeName,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            ...(selectedImageHash ? { image_hash: selectedImageHash } : {}),
            link: linkUrl,
            message,
            ...(headline ? { name: headline } : {}),
            ...(description ? { description } : {}),
            ...(ctaType !== "NO_BUTTON"
              ? { call_to_action: { type: ctaType, value: { link: linkUrl } } }
              : {}),
          },
        },
      };

      const res = await fetch("/api/meta/creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setCreatedCreativeId(data.id);
      setStep("ad");
    } catch {
      setError("Fehler beim Erstellen des Creatives");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const creativeId = useExistingCreative
      ? existingCreativeId
      : createdCreativeId;

    try {
      const res = await fetch("/api/meta/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adName,
          adset_id: adSetId,
          status: adStatus,
          creative: { creative_id: creativeId },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      router.push(presetCampaignId ? `/campaigns/${presetCampaignId}` : "/ads");
    } catch {
      setError("Fehler beim Erstellen der Anzeige");
    } finally {
      setLoading(false);
    }
  }

  if (adSetsLoading || imagesLoading || creativesLoading) return <LoadingPage />;

  const adSets = adSetsData?.data?.filter((a) => a.status !== "DELETED") || [];
  const images = imagesData?.data || [];
  const creatives = creativesData?.data || [];

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Neue Anzeige</h1>
        <p className="text-sm text-gray-500 mt-1">
          {step === "creative"
            ? "Schritt 1: Creative erstellen oder bestehendes wählen"
            : "Schritt 2: Anzeige erstellen und Ad Set zuweisen"}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            step === "creative"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
            {step === "creative" ? "1" : "\u2713"}
          </span>
          Creative
        </div>
        <div className="w-8 h-px bg-gray-300" />
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            step === "ad"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
            2
          </span>
          Anzeige
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {step === "creative" && (
        <>
          {/* Toggle: new vs existing creative */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setUseExistingCreative(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                !useExistingCreative
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              Neues Creative
            </button>
            <button
              type="button"
              onClick={() => setUseExistingCreative(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                useExistingCreative
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              Bestehendes Creative ({creatives.length})
            </button>
          </div>

          {useExistingCreative ? (
            <div className="space-y-4">
              {creatives.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  Keine Creatives vorhanden. Erstelle zuerst ein neues.
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="existingCreative" className="label">
                      Creative wählen *
                    </label>
                    <select
                      id="existingCreative"
                      value={existingCreativeId}
                      onChange={(e) => setExistingCreativeId(e.target.value)}
                      className="select"
                    >
                      <option value="">Creative wählen...</option>
                      {creatives.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.id} {c.title ? `– ${c.title}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setCreatedCreativeId(existingCreativeId);
                      setStep("ad");
                    }}
                    disabled={!existingCreativeId}
                    className="btn-primary"
                  >
                    Weiter zu Schritt 2
                  </button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateCreative} className="space-y-6">
              <div>
                <label htmlFor="cName" className="label">Creative-Name *</label>
                <input
                  id="cName"
                  type="text"
                  value={creativeName}
                  onChange={(e) => setCreativeName(e.target.value)}
                  className="input"
                  placeholder="z.B. Sommer-Sale Banner"
                  required
                />
              </div>

              <div>
                <label htmlFor="pageId" className="label">
                  Facebook Page ID *
                </label>
                <input
                  id="pageId"
                  type="text"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="input"
                  placeholder="Deine Facebook-Seiten-ID"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Findest du unter: Facebook-Seite → Info → Seiten-ID
                </p>
              </div>

              <div>
                <label htmlFor="msg" className="label">Anzeigentext *</label>
                <textarea
                  id="msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Der Text, der über dem Bild angezeigt wird..."
                  required
                />
              </div>

              <div>
                <label htmlFor="link" className="label">Link URL *</label>
                <input
                  id="link"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="input"
                  placeholder="https://deine-website.de/landingpage"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hl" className="label">Headline</label>
                  <input
                    id="hl"
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="input"
                    placeholder="Kurze Überschrift"
                  />
                </div>
                <div>
                  <label htmlFor="cta" className="label">Call-to-Action</label>
                  <select
                    id="cta"
                    value={ctaType}
                    onChange={(e) => setCtaType(e.target.value)}
                    className="select"
                  >
                    {ctaTypes.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="desc" className="label">Beschreibung</label>
                <input
                  id="desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  placeholder="Kurze Beschreibung unter der Headline"
                />
              </div>

              {/* Image Selector */}
              <div>
                <label className="label">Bild wählen</label>
                {images.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                    Keine Bilder vorhanden.{" "}
                    <a href="/media" className="underline">
                      Lade zuerst Bilder hoch.
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {images.map((img) => (
                      <button
                        key={img.hash}
                        type="button"
                        onClick={() => setSelectedImageHash(img.hash)}
                        className={`aspect-square rounded-lg overflow-hidden border-3 transition-all ${
                          selectedImageHash === img.hash
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || !creativeName || !pageId || !message || !linkUrl}
                  className="btn-primary"
                >
                  {loading ? "Erstelle..." : "Creative erstellen & weiter"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/ads")}
                  className="btn-secondary"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {step === "ad" && (
        <form onSubmit={handleCreateAd} className="space-y-6">
          {createdCreativeId && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Creative ID: <code className="font-mono">{createdCreativeId}</code>
            </div>
          )}

          <div>
            <label htmlFor="adName" className="label">Anzeigenname *</label>
            <input
              id="adName"
              type="text"
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
              className="input"
              placeholder="z.B. Sommer-Sale – DE 18-35"
              required
            />
          </div>

          <div>
            <label htmlFor="adSet" className="label">Ad Set *</label>
            {adSets.length === 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                Keine Ad Sets vorhanden.{" "}
                <a href="/adsets/new" className="underline">
                  Erstelle zuerst ein Ad Set.
                </a>
              </div>
            ) : (
              <select
                id="adSet"
                value={adSetId}
                onChange={(e) => setAdSetId(e.target.value)}
                className="select"
                required
              >
                <option value="">Ad Set wählen...</option>
                {adSets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label">Startstatus</label>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setAdStatus("PAUSED")}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  adStatus === "PAUSED"
                    ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                Pausiert
              </button>
              <button
                type="button"
                onClick={() => setAdStatus("ACTIVE")}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  adStatus === "ACTIVE"
                    ? "border-green-400 bg-green-50 text-green-800"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                Sofort aktiv
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || !adName || !adSetId}
              className="btn-primary"
            >
              {loading ? "Erstelle..." : "Anzeige erstellen"}
            </button>
            <button
              type="button"
              onClick={() => setStep("creative")}
              className="btn-secondary"
            >
              Zurück
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
