"use client";

import Link from "next/link";
import { ArrowRight, Scales } from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";

export default function Home() {
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[#fdfcf8] text-[#1a1a1a] overflow-hidden">
      
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
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center mt-12 md:mt-24 px-4"
      >
        <motion.h1 
          variants={fadeInUp}
          className="text-6xl md:text-8xl text-[#1a1a1a] max-w-4xl leading-tight" 
          style={{ fontFamily: "Georgia, serif" }}
        >
          Uncover the truth,<br />piece by piece.
        </motion.h1>
        
        <motion.p 
          variants={fadeInUp}
          className="mt-6 text-xl text-[#4a4a4a] font-medium max-w-2xl"
        >
          Upload your documents. Let AI cross-check the claims, build a timeline, and highlight the contradictions with confidence.
        </motion.p>

        <motion.div variants={fadeInUp}>
          <Link 
            href="/case/new" 
            className="mt-10 flex items-center gap-3 bg-[#70bfa3] text-black text-xl px-8 py-4 rounded-full border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all font-semibold"
          >
            Start a new case <ArrowRight weight="bold" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer / Illustration (Bottom Half) */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
        className="flex-1 w-full relative mt-16 min-h-[40vh] md:min-h-[50vh]"
      >
        <div 
          className="absolute inset-0 bg-contain bg-bottom bg-no-repeat w-full"
          style={{ 
            backgroundImage: "url('/bg-sketch.jpg')",
            backgroundSize: "cover",
          }}
        />
        
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#fdfcf8] to-transparent z-0" />
      </motion.div>

    </main>
  );
}
