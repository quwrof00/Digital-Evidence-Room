"use client";

import { useState } from "react";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>("");
  const [documentIds, setDocumentIds] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setStatus("Please select at least one file.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setStatus(`Uploading ${files.length} file(s)...`);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus(`Success! Document IDs: ${data.document_ids.join(", ")}`);
      setDocumentIds(data.document_ids);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-xl mx-auto flex flex-col gap-8">
        <h1 className="text-3xl font-bold">Upload Evidence Files</h1>
        
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="file" className="font-semibold">
              Select Files (PDF, CSV, TXT)
            </label>
            <input
              type="file"
              id="file"
              multiple
              accept=".pdf,.csv,.txt"
              onChange={handleFileChange}
              className="border p-2 rounded"
            />
          </div>
          
          <button
            type="submit"
            disabled={files.length === 0}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Upload {files.length > 0 ? `(${files.length})` : ""}
          </button>
        </form>

        {status && (
          <div className="p-4 rounded bg-gray-100 dark:bg-gray-800">
            <p>{status}</p>
          </div>
        )}
      </main>
    </div>
  );
}
