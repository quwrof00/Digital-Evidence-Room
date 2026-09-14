"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Scales, FolderOpen, Plus } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from "@/lib/useAuth";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Case = {
  ID: string;
  Name: string;
  CreatedAt: string;
};

export default function Dashboard() {
  const userId = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    fetch(`${API}/cases?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCases(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="w-full min-h-screen bg-[#fdfcf8] text-[#1a1a1a] flex flex-col">
      {/* Navbar */}
      <header className="h-16 border-b-2 border-black flex items-center justify-between px-6 shrink-0 bg-[#fdfcf8] z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-[#4a4a4a] hover:text-black transition-colors mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Scales weight="fill" className="w-6 h-6 text-[#1a1a1a]" />
          <span className="font-semibold text-lg tracking-widest uppercase text-[#1a1a1a]">Digital Evidence Room</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 md:p-12">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#1a1a1a]" style={{ fontFamily: '"FS Rosa", Georgia, serif' }}>
            My Cases
          </h1>
          <Link 
            href="/case/new"
            className="flex items-center gap-2 bg-[#70bfa3] text-black px-5 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
          >
            <Plus weight="bold" /> New Case
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#70bfa3] border-t-black rounded-full animate-spin"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <FolderOpen weight="duotone" className="w-16 h-16 mx-auto mb-4 text-[#4a4a4a]" />
            <h2 className="text-2xl font-bold mb-2">No cases yet</h2>
            <p className="text-[#4a4a4a] mb-6 max-w-sm mx-auto">Upload documents to start your first investigation and extract insights.</p>
            <Link 
              href="/case/new"
              className="inline-flex items-center gap-2 bg-[#70bfa3] text-black px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
            >
              Start Investigation
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {cases.map((c, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={c.ID}
              >
                <Link 
                  href={`/case/${c.ID}`}
                  className="flex items-center justify-between p-6 bg-white border-2 border-black rounded-xl hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#70bfa3]/20 rounded-lg flex items-center justify-center border border-[#70bfa3]">
                      <FolderOpen weight="fill" className="w-6 h-6 text-[#70bfa3]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl group-hover:text-[#70bfa3] transition-colors">{c.Name}</h3>
                      <p className="text-sm text-[#4a4a4a]">Created {new Date(c.CreatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="bg-[#f5f5f5] px-4 py-2 rounded-lg border border-[#e5e5e5] text-sm font-medium">
                    Open Workspace &rarr;
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
