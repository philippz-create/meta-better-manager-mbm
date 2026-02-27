"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface SettingField {
  key: string;
  label: string;
  placeholder: string;
  help: string;
  type: "text" | "password";
}

const fields: SettingField[] = [
  {
    key: "META_APP_ID",
    label: "App ID",
    placeholder: "123456789012345",
    help: "developers.facebook.com → Deine App → App-Einstellungen → Allgemeines",
    type: "text",
  },
  {
    key: "META_APP_SECRET",
    label: "App Secret",
    placeholder: "abcdef1234567890abcdef1234567890",
    help: "developers.facebook.com → Deine App → App-Einstellungen → Allgemeines → Anzeigen",
    type: "password",
  },
  {
    key: "META_ACCESS_TOKEN",
    label: "Access Token",
    placeholder: "EAABsb...",
    help: "developers.facebook.com → Deine App → Marketing API → Tools → Token abrufen",
    type: "password",
  },
  {
    key: "META_AD_ACCOUNT_ID",
    label: "Ad Account ID",
    placeholder: "act_123456789",
    help: "Business Manager → Unternehmenseinstellungen → Konten → Werbekonten",
    type: "text",
  },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [masked, setMasked] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const searchParams = useSearchParams();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) setMessage({ type: "success", text: decodeURIComponent(success.replace(/\+/g, " ")) });
    if (error) setMessage({ type: "error", text: decodeURIComponent(error.replace(/\+/g, " ")) });
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const vals: Record<string, string> = {};
        const masks: Record<string, string> = {};
        for (const [key, info] of Object.entries(data.settings) as [string, { value: string; masked: string }][]) {
          vals[key] = info.value;
          masks[key] = info.masked;
        }
        setValues(vals);
        setMasked(masks);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (data.error) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: data.message });
        setEditing({});
        // Refresh masked values
        const refreshRes = await fetch("/api/settings");
        const refreshData = await refreshRes.json();
        const masks: Record<string, string> = {};
        for (const [key, info] of Object.entries(refreshData.settings) as [string, { value: string; masked: string }][]) {
          masks[key] = info.masked;
        }
        setMasked(masks);
      }
    } catch {
      setMessage({ type: "error", text: "Fehler beim Speichern" });
    } finally {
      setSaving(false);
    }
  }

  function isConfigured(key: string): boolean {
    const val = values[key];
    return !!val && val.length > 0 && !val.startsWith("your_");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const allConfigured = fields.every((f) => isConfigured(f.key));
  const hasChanges = Object.keys(editing).length > 0;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
        <p className="text-sm text-gray-500 mt-1">
          Meta API Zugangsdaten verwalten
        </p>
      </div>

      {/* Status Banner */}
      <div
        className={`card p-4 mb-6 flex items-center gap-3 ${
          allConfigured
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            allConfigured ? "bg-green-500" : "bg-yellow-500"
          }`}
        />
        <span className="text-sm font-medium">
          {allConfigured
            ? "Alle Zugangsdaten konfiguriert"
            : "Zugangsdaten fehlen – bitte eintragen"}
        </span>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg mb-6 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Settings Fields */}
      <div className="space-y-4">
        {fields.map((field) => {
          const configured = isConfigured(field.key);
          const isEditing = editing[field.key];
          const isVisible = showValues[field.key];

          return (
            <div key={field.key} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <label className="text-sm font-semibold text-gray-900">
                    {field.label}
                  </label>
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      configured
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {configured ? "Gesetzt" : "Fehlt"}
                  </span>
                </div>
                {!isEditing && configured && (
                  <button
                    onClick={() =>
                      setEditing((prev) => ({ ...prev, [field.key]: true }))
                    }
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ändern
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-400 mb-3">{field.help}</p>

              {isEditing || !configured ? (
                <div className="relative">
                  <input
                    type={
                      field.type === "password" && !isVisible
                        ? "password"
                        : "text"
                    }
                    value={values[field.key] || ""}
                    onChange={(e) => {
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }));
                      setEditing((prev) => ({ ...prev, [field.key]: true }));
                    }}
                    placeholder={field.placeholder}
                    className="input pr-10 font-mono text-sm"
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowValues((prev) => ({
                          ...prev,
                          [field.key]: !prev[field.key],
                        }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {isVisible ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="font-mono text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  {masked[field.key] || "–"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="btn-primary"
        >
          {saving ? "Speichere..." : "Speichern"}
        </button>
        {hasChanges && (
          <span className="text-xs text-yellow-600">
            Ungespeicherte Änderungen
          </span>
        )}
      </div>

      {/* OAuth Section */}
      <OAuthSection
        hasAppId={isConfigured("META_APP_ID")}
        hasAppSecret={isConfigured("META_APP_SECRET")}
      />
    </div>
  );
}

function OAuthSection({
  hasAppId,
  hasAppSecret,
}: {
  hasAppId: boolean;
  hasAppSecret: boolean;
}) {
  const [tokenStatus, setTokenStatus] = useState<{
    valid?: boolean;
    message?: string;
    expires_at?: string;
    scopes?: string[];
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function checkToken() {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/token");
      const data = await res.json();
      setTokenStatus(data);
    } catch {
      setTokenStatus({ valid: false, message: "Prüfung fehlgeschlagen" });
    } finally {
      setChecking(false);
    }
  }

  async function startOAuth() {
    setOauthLoading(true);
    try {
      const res = await fetch(
        `/api/auth/login?origin=${encodeURIComponent(window.location.origin)}`
      );
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      window.location.href = data.url;
    } catch {
      alert("OAuth-Start fehlgeschlagen");
    } finally {
      setOauthLoading(false);
    }
  }

  const canOAuth = hasAppId && hasAppSecret;

  return (
    <div className="mt-10 card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Token-Verwaltung
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Prüfe deinen Token oder generiere automatisch einen langlebigen Token (60 Tage) per OAuth.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={checkToken}
          disabled={checking}
          className="btn-secondary btn-sm"
        >
          {checking ? "Prüfe..." : "Token prüfen"}
        </button>
        <button
          onClick={startOAuth}
          disabled={!canOAuth || oauthLoading}
          className="btn-primary btn-sm"
          title={
            !canOAuth
              ? "App ID und App Secret müssen zuerst eingetragen werden"
              : undefined
          }
        >
          {oauthLoading ? "Weiterleitung..." : "Neuen Token per OAuth generieren"}
        </button>
      </div>

      {!canOAuth && (
        <p className="text-xs text-yellow-600 mb-3">
          Trage zuerst App ID und App Secret ein, um OAuth nutzen zu können.
        </p>
      )}

      {tokenStatus && (
        <div
          className={`p-4 rounded-lg text-sm ${
            tokenStatus.valid
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                tokenStatus.valid ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="font-medium">
              {tokenStatus.valid ? "Token gültig" : "Token ungültig"}
            </span>
          </div>
          <p>{tokenStatus.message}</p>
          {tokenStatus.expires_at && (
            <p className="mt-1 text-xs">
              Ablauf:{" "}
              {new Date(tokenStatus.expires_at).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          {tokenStatus.scopes && tokenStatus.scopes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tokenStatus.scopes.map((s) => (
                <span
                  key={s}
                  className="badge bg-green-100 text-green-700"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
