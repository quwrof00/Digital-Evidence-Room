"use client";

import { useState } from "react";
import ShojiDoors from "@/components/ShojiDoors";
import Timeline from "@/components/Timeline";
import ChatBox from "@/components/ChatBox";
import SourcePopup from "@/components/SourcePopup";
import Link from "next/link";
import { ArrowLeft, Sparkle } from "@phosphor-icons/react/dist/ssr";

export default function SampleCaseWorkspace() {
  const [popupText, setPopupText] = useState<string | null>(null);

  return (
    <ShojiDoors>
      <div className="w-full h-screen flex flex-col bg-background text-foreground">
        
        {/* Navbar */}
        <header className="h-16 border-b-2 border-black flex items-center justify-between px-6 shrink-0 bg-[#fdfcf8] z-10">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-[#4a4a4a] hover:text-black transition-colors mr-6">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back</span>
            </Link>
            <h1 className="font-bold text-xl border-l-2 border-black pl-6 flex items-center gap-2" style={{ fontFamily: '"FS Rosa", Georgia, serif' }}>
              <Sparkle weight="fill" className="text-primary w-5 h-5" />
              Sample Investigation (Mock Data)
            </h1>
          </div>
        </header>

        {/* Phase Container */}
        <main className="flex-1 overflow-hidden relative bg-[#fdfcf8]">
          <div className="absolute inset-0 flex animate-in slide-in-from-bottom-8 duration-700">
            <Timeline 
              isMock={true}
              onEventClick={(e) => {
                if (e.sourceText) setPopupText(e.sourceText);
              }} 
            />
            <ChatBox isMock={true} />
          </div>
        </main>

        {/* Popup */}
        {popupText && (
          <SourcePopup text={popupText} onClose={() => setPopupText(null)} />
        )}
      </div>
    </ShojiDoors>
  );
}
