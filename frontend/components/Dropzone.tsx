"use client";

import { UploadSimple, FilePdf, FileText } from "@phosphor-icons/react/dist/ssr";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const API = "http://localhost:8080";

async function postFiles(files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  const res = await fetch(`${API}/upload`, { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }
}

export default function Dropzone({ onFilesDropped }: { onFilesDropped: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startWithFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setStatus(`Uploading ${files.length} file(s) for Strands analysis...`);
    try {
      await postFiles(files);
      onFilesDropped();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setStatus(message);
    }
  }, [onFilesDropped]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center w-full h-full max-w-4xl mx-auto p-6"
    >
      <div className="text-center mb-10">
        <h2
          className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          style={{ fontFamily: '"FS Rosa", Georgia, serif' }}
        >
          Upload Evidence
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          PDFs, CSVs, or WhatsApp .txt exports. Strands agents on Bedrock extract the timeline, entities, and claims.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.txt"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            void startWithFiles(Array.from(e.target.files));
          }
        }}
      />

      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full h-72 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden group cursor-pointer bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          isDragging ? "border-primary bg-primary/5" : "border-black hover:border-primary"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) {
            void startWithFiles(Array.from(e.dataTransfer.files));
          }
        }}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex gap-6 mb-8 text-black group-hover:text-primary transition-colors duration-300">
          <FilePdf weight="duotone" className="w-12 h-12" />
          <UploadSimple
            weight="bold"
            className={cn(
              "w-12 h-12 transition-transform duration-300",
              isDragging ? "-translate-y-4" : "group-hover:-translate-y-2"
            )}
          />
          <FileText weight="duotone" className="w-12 h-12" />
        </div>
        <p className="text-2xl font-bold mb-2 text-black">Drop files to upload</p>
        <p className="text-[#4a4a4a] font-medium">or click to browse</p>
      </motion.div>

      {status && <p className="mt-4 text-center font-medium text-[#4a4a4a]">{status}</p>}
    </motion.div>
  );
}
