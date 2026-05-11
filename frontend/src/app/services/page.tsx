"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Clock, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL } from "@/lib/constants";

export default function ServicesPage() {
  const [services, setServices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedService, setSelectedService] = React.useState<any>(null);
  const { t } = useLanguage();

  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/services`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setServices(data);
        } else {
          throw new Error("Invalid data format");
        }
      } catch (err: any) {
        console.error("Error fetching services:", err);
        setError(err.message || "Something went wrong while fetching services.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const ErrorState = () => (
    <div className="col-span-full py-20 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="text-2xl font-bold mb-2">{t("connectionError")}</h3>
      <p className="text-muted-foreground mb-8 max-w-xs">
        {t("connectionErrorDesc")}
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold"
      >
        {t("retryConnection")}
      </button>
    </div>
  );

  const ServiceSkeleton = () => (
    <div className="glass rounded-3xl p-6 border border-white/5 animate-pulse">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-200" />
        <div className="w-16 h-6 bg-slate-200 rounded-full" />
      </div>
      <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-full mb-6" />
      <div className="flex items-center justify-between py-4 border-t border-white/5 mb-6">
        <div className="w-16 h-8 bg-slate-100 rounded" />
        <div className="w-16 h-8 bg-slate-100 rounded" />
      </div>
      <div className="h-12 bg-slate-200 rounded-xl w-full" />
    </div>
  );

  const EmptyState = () => (
    <div className="col-span-full py-20 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <Users className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-2xl font-bold mb-2">{t("noServicesYet")}</h3>
      <p className="text-muted-foreground mb-8 max-w-xs">
        {t("noServicesDesc")}
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold flex items-center gap-2"
      >
        {t("refresh")} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 pb-32">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{t("availableServices")}</h1>
        <p className="text-muted-foreground max-w-2xl">
          {t("servicesDescription")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => <ServiceSkeleton key={i} />)
        ) : error ? (
          <ErrorState />
        ) : services.length === 0 ? (
          <EmptyState />
        ) : (
          services.map((service, index) => {
            const todayQueue = service.queues?.[0] || { currentNumber: 0, status: "closed" };
            const isOpen = todayQueue.status === "open";
            
            // Calculate estimated wait time (mock logic: 5 mins per person in queue)
            // In a real app, this would come from the backend based on actual throughput
            const waitingCount = service._count?.bookings || 0;
            const waitTime = waitingCount * 8; // 8 minutes per person

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "glass group rounded-[40px] p-8 border border-black/5 hover:border-primary-600/20 transition-all duration-300 relative overflow-hidden bg-white",
                  !isOpen && "opacity-60 grayscale-[0.5] bg-slate-50/50"
                )}
              >
                <div className="flex justify-between items-start mb-8">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                    isOpen ? "bg-primary-600/10 text-primary-600" : "bg-slate-200 text-slate-400"
                  )}>
                    <Users className="w-7 h-7" />
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm border",
                    isOpen ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-100 text-slate-400 border-slate-200"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
                    {isOpen ? t("open") : t("closed")}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-2 group-hover:text-primary-600 transition-colors">
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  {service.description || t("noDescription")}
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("currentQueue")}</span>
                    <span className="font-black text-lg flex items-center gap-2">
                      {isOpen ? (
                        <>
                          <div className="w-1.5 h-1.5 bg-primary-600 rounded-full" />
                          {service.name.charAt(0).toUpperCase()}{(todayQueue.currentNumber || 0).toString().padStart(3, '0')}
                        </>
                      ) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("waitEstimate")}</span>
                    <span className="font-black text-lg text-primary-600">
                      {isOpen ? `~${waitTime > 0 ? waitTime : 10} ${t("minutes")}` : "—"}
                    </span>
                  </div>
                </div>

                {isOpen ? (
                  <button
                    onClick={() => setSelectedService(service)}
                    className="w-full py-5 bg-white border-2 border-slate-100 hover:border-primary-600 text-slate-900 rounded-[24px] font-black flex items-center justify-center gap-3 transition-all hover:bg-primary-600 hover:text-white active:scale-95 shadow-sm"
                  >
                    {t("joinQueue")} <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-5 bg-slate-100 text-slate-400 rounded-[24px] font-black cursor-not-allowed border-2 border-transparent"
                  >
                    {t("currentlyClosed")}
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedService(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden" />
            <h3 className="text-2xl font-black mb-2">{t("confirmBooking")}</h3>
            <p className="text-muted-foreground mb-8">
              {t("confirmBookingDesc")} <span className="font-bold text-slate-900">{selectedService.name}</span>
            </p>
            
            <div className="flex flex-col gap-3">
              <Link
                href={`/bookings/new?serviceId=${selectedService.id}`}
                className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 active:scale-95 transition-transform"
              >
                {t("confirmBtn")} <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setSelectedService(null)}
                className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold active:scale-95 transition-transform"
              >
                {t("cancelBtn")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
