"use client";

import { useRef, useState } from "react";

interface Props {
  value: string;        // stored URL or ""
  onChange: (url: string) => void;
}

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx";

function FileIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828A4 4 0 0012.172 4L5.586 10.586a6 6 0 008.485 8.485L20 13" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

export default function EvidenciaUpload({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al subir el archivo");
      onChange(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir el archivo");
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  // Derive a display name: prefer the last path segment, fallback to full value
  const displayName = value ? decodeURIComponent(value.split("/").pop() ?? value) : null;
  // Detect whether it's an uploaded file or a legacy text value
  const isUploadedFile = value.startsWith("/uploads/");

  return (
    <div className="space-y-1.5">
      {value && isUploadedFile ? (
        // ── Uploaded file pill ──
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50">
          <FileIcon />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-700 font-medium truncate flex-1 hover:underline"
            title={displayName ?? undefined}
          >
            {displayName}
          </a>
          <button
            type="button"
            onClick={handleRemove}
            className="text-slate-400 hover:text-red-500 transition text-xl leading-none ml-1"
            title="Eliminar archivo"
          >
            ×
          </button>
        </div>
      ) : (
        // ── Drop zone / trigger ──
        <label
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-dashed cursor-pointer transition-all ${
            loading
              ? "border-blue-300 bg-blue-50 opacity-70 pointer-events-none"
              : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <UploadIcon />
          )}
          <span className="text-sm text-slate-500 select-none">
            {loading ? "Subiendo..." : "Adjuntar archivo (PDF, imagen, Word, Excel)"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{error}</p>
      )}
    </div>
  );
}
