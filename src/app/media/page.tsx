"use client";

import { useState, useCallback } from "react";
import { useMetaApi } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { LoadingPage, ErrorMessage, EmptyState } from "@/components/ui/loading";
import type { AdImage, MetaPaginatedResponse } from "@/lib/types";

export default function MediaPage() {
  const { data, error, isLoading, mutate } =
    useMetaApi<MetaPaginatedResponse<AdImage>>("/api/meta/media");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList) => {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      let successCount = 0;
      let failCount = 0;

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/meta/media", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.error) {
            failCount++;
          } else {
            successCount++;
          }
        } catch {
          failCount++;
        }
      }

      setUploading(false);

      if (successCount > 0) {
        setUploadSuccess(
          `${successCount} Datei(en) erfolgreich hochgeladen`
        );
        mutate();
      }
      if (failCount > 0) {
        setUploadError(`${failCount} Datei(en) fehlgeschlagen`);
      }

      setTimeout(() => {
        setUploadSuccess(null);
        setUploadError(null);
      }, 5000);
    },
    [mutate]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  }

  if (isLoading) return <LoadingPage />;
  if (error)
    return <ErrorMessage message={error.message} onRetry={() => mutate()} />;

  const images = data?.data || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medien</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lade Bilder und Videos für deine Anzeigen hoch
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`card p-8 mb-8 text-center border-2 border-dashed transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <svg
          className="w-12 h-12 mx-auto text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-3 text-sm text-gray-600">
          Dateien hierher ziehen oder{" "}
          <label className="text-blue-600 cursor-pointer hover:underline">
            durchsuchen
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          PNG, JPG, GIF, MP4, MOV – Max. 30 MB pro Datei
        </p>

        {uploading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Wird hochgeladen...</p>
          </div>
        )}

        {uploadSuccess && (
          <p className="mt-3 text-sm text-green-600">{uploadSuccess}</p>
        )}
        {uploadError && (
          <p className="mt-3 text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      {/* Image Grid */}
      {images.length === 0 ? (
        <EmptyState
          title="Keine Medien"
          description="Lade dein erstes Bild oder Video hoch."
        />
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hochgeladene Bilder ({images.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <div key={image.hash} className="card overflow-hidden group">
                <div className="aspect-square bg-gray-100 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                      onClick={() => navigator.clipboard.writeText(image.hash)}
                      className="opacity-0 group-hover:opacity-100 btn-secondary btn-sm transition-opacity"
                    >
                      Hash kopieren
                    </button>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {image.name}
                  </p>
                  {image.width && image.height && (
                    <p className="text-xs text-gray-400">
                      {image.width}x{image.height}
                    </p>
                  )}
                  {image.created_time && (
                    <p className="text-xs text-gray-400">
                      {formatDate(image.created_time)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
