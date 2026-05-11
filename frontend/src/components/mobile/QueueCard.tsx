"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface QueueCardProps {
  queueNumber: string;
  waitingCount: number;
  currentServing: string;
  progress: number;
  showButton?: boolean;
}

export default function QueueCard({
  queueNumber,
  waitingCount,
  currentServing,
  progress,
  showButton = true,
}: QueueCardProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-sm mx-auto space-y-6 px-4">
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5 text-center space-y-4">
        <span className="text-muted-foreground font-medium">{t("yourQueue")}</span>
        
        <div className="relative inline-flex items-center justify-center">
          {/* Pulse Animation Background */}
          <div className="absolute inset-0 bg-primary-600/10 rounded-full animate-pulse-live" />
          
          <div className="relative w-32 h-32 rounded-full border-4 border-primary-50 flex items-center justify-center bg-white shadow-inner">
            <span className="queue-number text-primary-600">{queueNumber}</span>
          </div>
        </div>

        <div className="text-slate-600 font-medium">
          {t("waitingBefore")} <span className="text-primary-600 font-bold">{waitingCount}</span> {t("people")}
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-black/5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{t("currentlyServing")}</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-bold text-xl">{currentServing}</span>
          </div>
        </div>

        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full bg-primary-600"
          />
        </div>
      </div>

      {showButton && (
        <button className="w-full h-14 bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-600/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
          จองคิว <span className="text-xl">↗</span>
        </button>
      )}
    </div>
  );
}
