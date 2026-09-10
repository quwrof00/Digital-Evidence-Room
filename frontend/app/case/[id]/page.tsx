"use client";

import { useState } from "react";
import ShojiDoors from "@/components/ShojiDoors";
import Dropzone from "@/components/Dropzone";
import LiveChecklist from "@/components/LiveChecklist";
import Timeline from "@/components/Timeline";
import ChatBox from "@/components/ChatBox";
import SourcePopup from "@/components/SourcePopup";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

type Phase = "upload" | "processing" | "dashboard";

export default function CaseWorkspace() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [popupText, setPopupText] = useState<string | null>(null);

  return (
    <ShojiDoors>
      <div className="w-full h-screen flex flex-col bg-background text-foreground">
        
        {/* Navbar */}
        <header className="h-16 border-b-2 border-black flex items-center px-6 shrink-0 bg-[#fdfcf8] z-10">
          <Link href="/" className="flex items-center gap-2 text-[#4a4a4a] hover:text-black transition-colors mr-6">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </Link>
          <h1 className="font-bold text-xl border-l-2 border-black pl-6" style={{ fontFamily: '"FS Rosa", Georgia, serif' }}>Investigation Workspace</h1>
        </header>

        {/* Phase Container */}
        <main className="flex-1 overflow-hidden relative bg-[#fdfcf8]">
          
          {phase === "upload" && (
            <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
              <Dropzone onFilesDropped={() => setPhase("processing")} />
            </div>
          )}

          {phase === "processing" && (
            <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
              <LiveChecklist onComplete={() => setPhase("dashboard")} />
            </div>
          )}

          {phase === "dashboard" && (
            <div className="absolute inset-0 flex animate-in slide-in-from-bottom-8 duration-700">
              <Timeline 
                onEventClick={(e) => {
                  if (e.sourceText) setPopupText(e.sourceText);
                }} 
              />
              <ChatBox />
            </div>
          )}

        </main>

        {/* Popup */}
        {popupText && (
          <SourcePopup text={popupText} onClose={() => setPopupText(null)} />
        )}
      </div>
    </ShojiDoors>
  );
}
