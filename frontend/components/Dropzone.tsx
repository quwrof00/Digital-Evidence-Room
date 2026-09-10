"use client";

import { UploadSimple, FilePdf, FileText } from "@phosphor-icons/react/dist/ssr";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Dropzone({ onFilesDropped }: { onFilesDropped: () => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const formData = new FormData();
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        formData.append("files", e.dataTransfer.files[i]);
      }
      
      try {
        const res = await fetch("http://localhost:8080/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          onFilesDropped();
        } else {
          console.error("Upload failed");
        }
      } catch (error) {
        console.error("Upload error", error);
      }
    }
  }, [onFilesDropped]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center w-full h-full max-w-4xl mx-auto p-6"
    >
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>Upload Evidence</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">Drag and drop your PDFs and WhatsApp text files here to begin the investigation.</p>
      </div>

      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden group cursor-pointer bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          isDragging ? "border-primary bg-primary/5" : "border-black hover:border-primary"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => onFilesDropped()} 
      >
        <div className="flex gap-6 mb-8 text-black group-hover:text-primary transition-colors duration-300">
          <FilePdf weight="duotone" className="w-12 h-12" />
          <UploadSimple weight="bold" className={cn("w-12 h-12 transition-transform duration-300", isDragging ? "-translate-y-4" : "group-hover:-translate-y-2")} />
          <FileText weight="duotone" className="w-12 h-12" />
        </div>

        <p className="text-2xl font-bold mb-2 text-black">Drop files to upload</p>
        <p className="text-[#4a4a4a] font-medium">or click to browse</p>
      </motion.div>
    </motion.div>
  );
}
