"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ShojiDoors({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Wooden texture styles
  const woodMain = "#6b3416";
  const woodDark = "#421f0a";
  
  const woodStyle = {
    backgroundColor: woodMain,
    backgroundImage: `linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.05) 50%), linear-gradient(0deg, transparent 50%, rgba(0,0,0,0.05) 50%)`,
    backgroundSize: "20px 100px, 100px 20px",
    boxShadow: `inset 0 0 10px ${woodDark}, 0 4px 6px rgba(0,0,0,0.3)`,
    border: `1px solid ${woodDark}`,
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* The content underneath */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>

      {/* Left Door */}
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: isOpen ? "-100%" : "0%" }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 left-0 w-1/2 h-full z-50 flex"
      >
        {/* Door Frame */}
        <div className="w-full h-full relative" style={woodStyle}>
           {/* Inner cutout with slats */}
           <div className="absolute inset-4 sm:inset-8 flex flex-row justify-evenly bg-black/40 backdrop-blur-sm border-[4px]" style={{ borderColor: woodDark }}>
             {/* Vertical Slats */}
             {[...Array(6)].map((_, i) => (
               <div key={i} className="h-full w-4 sm:w-6" style={woodStyle} />
             ))}
             {/* Horizontal Mid Rail */}
             <div className="absolute top-1/2 left-0 w-full h-8 sm:h-12 -translate-y-1/2" style={woodStyle} />
             
             {/* Handle */}
             <div className="absolute top-1/2 right-0 w-8 h-16 sm:w-10 sm:h-20 -translate-y-1/2 rounded-l-full translate-x-1" style={{...woodStyle, backgroundColor: woodDark}} />
           </div>
        </div>
      </motion.div>

      {/* Right Door */}
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: isOpen ? "100%" : "0%" }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 right-0 w-1/2 h-full z-50 flex"
      >
        {/* Door Frame */}
        <div className="w-full h-full relative" style={woodStyle}>
           {/* Inner cutout with slats */}
           <div className="absolute inset-4 sm:inset-8 flex flex-row justify-evenly bg-black/40 backdrop-blur-sm border-[4px]" style={{ borderColor: woodDark }}>
             {/* Vertical Slats */}
             {[...Array(6)].map((_, i) => (
               <div key={i} className="h-full w-4 sm:w-6" style={woodStyle} />
             ))}
             {/* Horizontal Mid Rail */}
             <div className="absolute top-1/2 left-0 w-full h-8 sm:h-12 -translate-y-1/2" style={woodStyle} />
             
             {/* Handle */}
             <div className="absolute top-1/2 left-0 w-8 h-16 sm:w-10 sm:h-20 -translate-y-1/2 rounded-r-full -translate-x-1" style={{...woodStyle, backgroundColor: woodDark}} />
           </div>
        </div>
      </motion.div>
    </div>
  );
}
