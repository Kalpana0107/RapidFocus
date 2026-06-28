import React from "react";
import { motion } from "motion/react";

export const SkeletonCard: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3 w-2/3">
        <div className="w-5 h-5 bg-slate-800 rounded-md flex-shrink-0" />
        <div className="space-y-2 w-full">
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-800 rounded w-3/4" />
        </div>
      </div>
      <div className="w-16 h-6 bg-slate-800 rounded-full" />
    </motion.div>
  );
};
