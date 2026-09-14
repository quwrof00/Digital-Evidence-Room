"use client";

import Link from "next/link";
import Image from "next/image";
import heroBg from "@/public/hero-bg.png";
import { ArrowRight, Scales } from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";

export default function Home() {
  const pageFlip = {
    hidden: { 
      opacity: 0, 
      rotateX: -90, 
      transformOrigin: "top center",
      perspective: 1200
    },
    show: { 
      opacity: 1, 
      rotateX: 0, 
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[#fdfcf8] text-[#1a1a1a] overflow-hidden">
      
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image 
          src={heroBg}
          alt="Abstract Japanese garden" 
          fill 
          className="object-cover opacity-60 mix-blend-multiply"
          priority
          fetchPriority="high"
          placeholder="blur"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fdfcf8]" />
      </div>

      {/* Top Navigation */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full flex items-center justify-between px-8 py-6 z-20 relative"
      >
        <div className="flex items-center gap-2">
          <Scales weight="fill" className="w-8 h-8 text-[#1a1a1a]" />
          <span className="font-semibold text-lg tracking-widest uppercase text-[#1a1a1a]">Digital Evidence Room</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4a4a4a]">
          <Link href="#" className="hover:text-black transition-colors">How it works</Link>
          <Link href="#" className="hover:text-black transition-colors">Features</Link>
          <Link href="#" className="hover:text-black transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-black transition-colors">About us</Link>
          
          <Link 
            href="/case/new" 
            className="flex items-center gap-2 bg-[#70bfa3] text-black px-6 py-2 rounded-full border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-semibold"
          >
            Start Investigation <ArrowRight weight="bold" />
          </Link>
        </div>
      </motion.header>

      {/* Main Content (Top Half) */}
      <div style={{ perspective: "1200px" }} className="relative z-10 flex flex-col items-center w-full mt-6 md:mt-12">
        <motion.div 
          variants={pageFlip as any}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center px-4"
        >
          <h1 
            className="text-6xl md:text-8xl font-black text-[#1a1a1a] max-w-4xl leading-[0.9]" 
            style={{ fontFamily: '"FS Rosa", Georgia, serif' }}
          >
            Uncover the truth,<br />piece by piece.
          </h1>
          
          <p className="mt-6 text-xl text-[#4a4a4a] font-medium max-w-2xl">
            Upload your documents. Let AI cross-check the claims, build a timeline, and highlight the contradictions with confidence.
          </p>

          <div>
            <Link 
              href="/case/new" 
              className="mt-10 flex items-center gap-3 bg-[#70bfa3] text-black text-xl px-8 py-4 rounded-full border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all font-semibold"
            >
              Start a new case <ArrowRight weight="bold" />
            </Link>
          </div>
        </motion.div>
      </div>

    </main>
  );
}
