"use client";

import { useId, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { safeImageSrc } from "@/lib/safe-image-url";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const ALLOWED = new Set(ACCEPT.split(","));
const MAX_BYTES = 8 * 1024 * 1024;

type Props = {
  name?: string;
  existingUrl?: string | null;
  required?: boolean;
};

export function PhotoDropzone({
  name = "photo",
  existingUrl = null,
  required = false,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function clearFile() {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function applyFile(file: File | null | undefined) {
    if (!file) {
      clearFile();
      return;
    }
    if (!ALLOWED.has(file.type)) {
      setError("Choisissez une image (JPEG, PNG, WebP ou GIF).");
      clearFile();
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image trop lourde (max. 8 Mo).");
      clearFile();
      return;
    }
    setError(null);
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    applyFile(e.target.files?.[0]);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    applyFile(e.dataTransfer.files?.[0]);
  }

  const shown = preview || safeImageSrc(existingUrl);

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition ${
          dragging
            ? "border-zinc-800 bg-zinc-100 dark:border-zinc-200 dark:bg-zinc-900"
            : "border-zinc-300 bg-zinc-50 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500"
        }`}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt=""
            className="max-h-40 w-auto rounded object-contain"
          />
        ) : (
          <ImagePlus
            className="h-8 w-8 text-zinc-400"
            aria-hidden
          />
        )}
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          {fileName
            ? fileName
            : shown
              ? "Glisser une nouvelle photo ou cliquer"
              : "Glisser-déposer une photo ici"}
        </span>
        <span className="text-xs text-zinc-500">
          ou cliquer pour parcourir · JPEG, PNG, WebP, GIF · max. 8 Mo
        </span>
        <input
          ref={inputRef}
          id={inputId}
          // Only submit the field when a file is chosen (avoids empty File crashes).
          name={fileName ? name : undefined}
          type="file"
          accept={ACCEPT}
          required={required && !existingUrl && !fileName}
          onChange={onInputChange}
          className="sr-only"
        />
      </label>
      {preview ? (
        <button
          type="button"
          onClick={clearFile}
          className="inline-flex items-center gap-1 text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          <X className="h-3 w-3" />
          Retirer la photo sélectionnée
        </button>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
