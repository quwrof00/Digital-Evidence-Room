"use client";

import { PaperPlaneRight, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const AGENT_URL = process.env.NEXT_PUBLIC_STRANDS_URL || "http://localhost:8000";

export default function ChatBox() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: "I'm the Strands investigator. Ask about payments, dates, or contradictions — I'll search the ingested evidence.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch(`${AGENT_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      const answer =
        data.answer ||
        data.detail ||
        "The investigator could not answer. Is the Strands service running on port 8000 with AWS credentials?";
      setMessages((prev) => [...prev, { role: "ai", text: String(answer) }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Could not reach the Strands agent. Ensure it is running and accessible.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full md:w-96 border-l-2 border-black bg-white flex flex-col h-full z-10">
      <div className="p-4 border-b-2 border-black bg-[#fdfcf8] flex items-center gap-2">
        <Sparkle weight="fill" className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg" style={{ fontFamily: '"FS Rosa", Georgia, serif' }}>
          AI Investigator
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#fdfcf8] flex flex-col">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex flex-col max-w-[85%] mt-4",
                m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl border-2 border-black font-medium whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-black rounded-br-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-black rounded-bl-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                )}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && <p className="text-sm text-[#4a4a4a]">Searching evidence with Bedrock…</p>}
      </div>

      <div className="p-4 border-t-2 border-black bg-[#fdfcf8]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSend()}
            placeholder="Ask a question..."
            className="w-full bg-white border-2 border-black rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
          <button
            onClick={() => void handleSend()}
            disabled={busy}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-black hover:bg-black hover:text-white transition-colors border-2 border-black disabled:opacity-50"
          >
            <PaperPlaneRight weight="bold" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
