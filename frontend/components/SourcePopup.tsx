"use client";

import { X } from "@phosphor-icons/react/dist/ssr";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SourcePopup({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-10"
        >
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-medium text-foreground">Source Evidence</h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-8">
            <div className="bg-background border border-border rounded-xl p-6 font-mono text-sm leading-relaxed overflow-x-auto text-primary">
              {text}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
