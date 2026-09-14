"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, CircleDashed, SpinnerGap } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const STEPS = [
  "Reading PDFs...",
  "Extracting text from WhatsApp logs...",
  "Identifying key entities and dates...",
  "Cross-checking claims...",
  "Building timeline...",
  "Finalizing dashboard...",
];

export default function LiveChecklist({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isBackendDone, setIsBackendDone] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const ws = new WebSocket("ws://localhost:8080/ws");
    const markDone = () => {
      if (!cancelled) setIsBackendDone(true);
    };
    ws.onerror = markDone;
    ws.onmessage = (event) => {
      try {
        for (const msgStr of String(event.data).split("\n")) {
          if (!msgStr.trim()) continue;
          const msg = JSON.parse(msgStr);
          if (msg.status === "completed" || msg.status === "error") markDone();
        }
      } catch {
        /* ignore partial frames */
      }
    };
    return () => {
      cancelled = true;
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (currentStep < STEPS.length) {
      const timer = setTimeout(() => setCurrentStep((s) => s + 1), 900);
      return () => clearTimeout(timer);
    }
    const delay = isBackendDone ? 400 : 8000;
    const timer = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onComplete();
    }, delay);
    return () => clearTimeout(timer);
  }, [currentStep, isBackendDone, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-2xl mx-auto p-6">
      <div className="text-center mb-12">
        <h2
          className="text-4xl font-bold mb-4 tracking-tight"
          style={{ fontFamily: '"FS Rosa", Georgia, serif' }}
        >
          Processing Evidence
        </h2>
        <p className="text-[#4a4a4a] text-lg">Strands agents are analyzing your documents on Bedrock...</p>
      </div>

      <div className="w-full bg-card border-2 border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <ul className="space-y-6">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;
            return (
              <li
                key={step}
                className={cn(
                  "flex items-center gap-4 transition-all duration-500",
                  isPending ? "opacity-30" : "opacity-100"
                )}
              >
                <div className="flex-shrink-0">
                  {isCompleted && <CheckCircle weight="fill" className="w-8 h-8 text-primary" />}
                  {isCurrent && <SpinnerGap weight="bold" className="w-8 h-8 text-black animate-spin" />}
                  {isPending && <CircleDashed weight="regular" className="w-8 h-8 text-[#1a1a1a]" />}
                </div>
                <span
                  className={cn(
                    "text-xl font-medium transition-colors",
                    isCompleted || isCurrent ? "text-black font-semibold" : "text-[#1a1a1a]"
                  )}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
