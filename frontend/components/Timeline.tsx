"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Event = {
  id: string;
  date: string;
  description: string;
  isContradiction?: boolean;
  sourceText?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Timeline({ onEventClick }: { onEventClick: (e: Event) => void }) {
  const [timeline, setTimeline] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/timeline")
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setTimeline(data);
        }
      })
      .catch(err => console.error("Error fetching timeline:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <h2 className="text-2xl font-semibold mb-8 sticky top-0 bg-[#fdfcf8]/90 backdrop-blur-md pb-4 z-10 border-b border-black font-serif">
        Investigation Timeline
      </h2>

      {loading ? (
        <div className="text-center text-[#4a4a4a]">Loading timeline data...</div>
      ) : timeline.length === 0 ? (
        <div className="text-center text-[#4a4a4a]">No timeline events found. Upload some documents!</div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative pl-6 border-l-2 border-[#1a1a1a] space-y-10"
        >
          {timeline.map((item) => (
            <motion.div 
              variants={itemVariants}
              key={item.id} 
              className="relative group cursor-pointer" 
              onClick={() => onEventClick(item)}
            >
              {/* Timeline dot */}
              <div className={cn(
                "absolute -left-[35px] w-4 h-4 rounded-full border-2 bg-background transition-all duration-300",
                item.isContradiction 
                  ? "border-red-500 bg-red-500 animate-pulse shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                  : "border-black group-hover:bg-primary group-hover:scale-125 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              )} />
              
              <div className={cn(
                "p-6 rounded-2xl border-2 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
                item.isContradiction 
                  ? "bg-white border-red-500" 
                  : "bg-white border-black hover:border-primary"
              )}>
                <div className={cn(
                  "text-sm font-bold mb-2 uppercase tracking-wider",
                  item.isContradiction ? "text-red-500" : "text-primary"
                )}>
                  {item.date}
                </div>
                <p className="text-black text-lg font-medium">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
          <motion.div 
            variants={itemVariants}
            key={item.id} 
            className="relative group cursor-pointer" 
            onClick={() => onEventClick(item)}
          >
            {/* Timeline dot */}
            <div className={cn(
              "absolute -left-[35px] w-4 h-4 rounded-full border-2 bg-background transition-all duration-300",
              item.isContradiction 
                ? "border-red-500 bg-red-500 animate-pulse shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                : "border-black group-hover:bg-primary group-hover:scale-125 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            )} />
            
            <div className={cn(
              "p-6 rounded-2xl border-2 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
              item.isContradiction 
                ? "bg-white border-red-500" 
                : "bg-white border-black hover:border-primary"
            )}>
              <div className={cn(
                "text-sm font-bold mb-2 uppercase tracking-wider",
                item.isContradiction ? "text-red-500" : "text-primary"
              )}>
                {item.date}
              </div>
              <p className="text-black text-lg font-medium">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
