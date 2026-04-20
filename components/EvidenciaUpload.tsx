"use client";

import { useRef, useState } from "react";

interface Props {
  value: string;        // stored URL or ""
  onChange: (url: string) => void;
  maxFiles?: number;
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

/** Extracts a readable name from a stored URL when original name is unavailable */
const fallbackDisplayName = (fileUrl: string): string => {
  const raw = decodeURIComponent(fileUrl.split("/").pop() ?? fileUrl);
  const extMatch = raw.match(/(\.[^.]+)$/);
  const ext = extMatch?.[1] ?? "";
  let base = raw.slice(0, raw.length - ext.length);
  base = base.replace(/-[A-Za-z0-9]{15,}$/, ""); // strip Vercel random suffix
  base = base.replace(/^\d{10,14}_/, "");          // strip timestamp prefix
  base = base.replace(/_+/g, " ").trim();           // underscores → spaces
  return (base + ext) || raw;
};

type FileEntry = { url: string; displayName: string };

const parseEntries = (value: string): FileEntry[] => {
  if (!value) return [];
  let items: unknown[];
  try {
    const parsed = JSON.parse(value);
    items = Array.isArray(parsed) ? parsed : [value];
  } catch {
    items = [value];
  }
  return items.flatMap((item): FileEntry[] => {
    if (typeof item === "string" && item.trim()) {
      return [{ url: item, displayName: fallbackDisplayName(item) }];
    }
    if (typeof item === "object" && item !== null && "u" in item) {
      const it = item as { u?: unknown; n?: unknown };
      if (typeof it.u === "string" && it.u.trim()) {
        return [{ url: it.u, displayName: (typeof it.n === "string" && it.n.trim()) ? it.n : fallbackDisplayName(it.u) }];
      }
    }
    return [];
  });
};

const serializeEntries = (entries: FileEntry[]): string => {
  if (entries.length === 0) return "";
  return JSON.stringify(entries.map(e => ({ u: e.url, n: e.displayName })));
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolveEvidenceHref = (fileUrl: string): string => {
  if (isAbsoluteUrl(fileUrl)) {
    return `/api/evidencias/download?url=${encodeURIComponent(fileUrl)}`;
  }
  return fileUrl;
};

export default function EvidenciaUpload({ value, onChange, maxFiles = 1 }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const entries = parseEntries(value);
  const canAddMore = entries.length < maxFiles;

  async function handleFile(file: File) {
    if (!canAddMore) {
      setError(`Máximo ${maxFiles} archivos.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; name?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al subir el archivo");
      const url = json.url ?? "";
      const displayName = json.name?.trim() ? json.name : fallbackDisplayName(url);
      const next = [...entries, { url, displayName }].slice(0, maxFiles);
      onChange(serializeEntries(next));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir el archivo");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove(index: number) {
    const next = entries.filter((_, i) => i !== index);
    onChange(serializeEntries(next));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-1.5">
      {entries.length > 0 && (
        <div className="space-y-1.5">
          {entries.map((entry, i) => {
            const isUploadedFile = entry.url.startsWith("/uploads/") || isAbsoluteUrl(entry.url);
            return (
              <div key={`${entry.url}-${i}`} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50">
                <FileIcon />
                {isUploadedFile ? (
                  <a
                    href={resolveEvidenceHref(entry.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-700 font-medium truncate flex-1 hover:underline"
                    title={entry.displayName}
                  >
                    {entry.displayName}
                  </a>
                ) : (
                  <span className="text-sm text-slate-700 truncate flex-1" title={entry.displayName}>
                    {entry.displayName}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="text-slate-400 hover:text-red-500 transition text-xl leading-none ml-1"
                  title="Eliminar archivo"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <label
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-dashed transition-all ${
          loading || !canAddMore
            ? "border-blue-300 bg-blue-50 opacity-70"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
        }`}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          <UploadIcon />
        )}
        <span className="text-sm text-slate-500 select-none">
          {loading
            ? "Subiendo..."
            : canAddMore
              ? `Adjuntar archivo (${entries.length}/${maxFiles})`
              : `Límite alcanzado (${maxFiles}/${maxFiles})`}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={loading || !canAddMore}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{error}</p>
      )}
    </div>
  );
}
