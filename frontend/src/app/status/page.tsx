"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/constants";

export default function StatusPage() {
  const { t } = useLanguage();
  const { session, user } = useAuth();
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchMyBookings = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/bookings/my`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMyBookings();
    const interval = setInterval(fetchMyBookings, 5000);
    return () => clearInterval(interval);
  }, [session]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <span className="font-black text-slate-400 uppercase tracking-widest text-xs">{t("syncingData")}</span>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm border border-black/5 flex items-center justify-center mb-8">
        <AlertCircle className="w-12 h-12 text-slate-300" />
      </div>
      <h3 className="text-2xl font-black mb-4">{t("pleaseLogin")}</h3>
      <p className="text-muted-foreground mb-10 max-w-xs">{t("loginToTrack")}</p>
      <Link href="/auth/login" className="px-10 py-5 bg-primary-600 text-white rounded-3xl font-black shadow-xl shadow-primary-600/20 active:scale-95 transition-transform">
        {t("loginNow")}
      </Link>
    </div>
  );

  if (bookings.length === 0) return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm border border-black/5 flex items-center justify-center mb-8">
        <Clock className="w-12 h-12 text-slate-300" />
      </div>
      <h3 className="text-2xl font-black mb-4">{t("noBookings")}</h3>
      <p className="text-muted-foreground mb-10 max-w-xs">{t("noBookingsDesc")}</p>
      <Link href="/services" className="px-10 py-5 bg-primary-600 text-white rounded-3xl font-black shadow-xl shadow-primary-600/20 active:scale-95 transition-transform">
        {t("goToServices")}
      </Link>
    </div>
  );

  const mainBooking = bookings[0]; // Assuming most recent/active
  const isServing = mainBooking.status === "serving";
  const progress = isServing ? 100 : Math.max(10, 100 - (mainBooking.waitingBefore * 20));

  return (
    <div className="bg-slate-50/50 min-h-screen pb-32">
      <header className="p-6 md:p-10 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-white rounded-2xl border border-black/5 shadow-sm hover:scale-105 transition-transform">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              {t("bookings")}
              <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full border border-green-200 animate-pulse">LIVE</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-10 max-w-4xl mx-auto space-y-8 md:space-y-12">
        {/* Top Section: Highlighted Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
          {/* Your Queue Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary-600 rounded-[48px] p-10 text-white shadow-2xl shadow-primary-600/30 space-y-8 relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60">{t("yourQueue")}</span>
              <div className="text-8xl font-black tracking-tighter">
                {mainBooking.queue.service.name.charAt(0).toUpperCase()}{mainBooking.bookingNumber.toString().padStart(3, '0')}
              </div>
              <div className="text-xl font-bold opacity-80">{mainBooking.queue.service.name}</div>
              
              <div className="w-full space-y-4 pt-4">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                  />
                </div>
                <div className="text-sm font-black uppercase tracking-widest opacity-80">
                  {isServing ? t("reachedYourQueue") : `${t("waitingMore")} ${mainBooking.waitingBefore} ${t("queuesCount")} · ~${mainBooking.waitingBefore * 8} ${t("minutes")}`}
                </div>
              </div>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl" />
          </motion.div>

          {/* Current Serving Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-8 border border-black/5 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("currentlyServing")}</span>
                  <div className="text-4xl font-black">
                    {mainBooking.queue.service.name.charAt(0).toUpperCase()}{(mainBooking.currentServingNumber || 0).toString().padStart(3, '0')}
                  </div>
                </div>
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-primary-600 border border-black/5">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>
              <div className="pt-6 border-t border-black/5 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("waitEstimateStatus")}</span>
                  <div className="text-2xl font-black text-primary-600">~{mainBooking.waitingBefore * 8} {t("minutes")}</div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-900 rounded-[40px] text-white flex items-center justify-between shadow-xl shadow-slate-900/10">
              <div className="space-y-1">
                <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">{t("location")}</span>
                <div className="font-bold">{t("counter1")}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* All Queues List */}
        <section className="space-y-6">
          <h2 className="text-xl font-black px-2">{t("allQueueOrder")}</h2>
          <div className="bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-sm">
            <div className="divide-y divide-black/5">
              {mainBooking.serviceQueues.map((q: any) => {
                const isMe = q.id === mainBooking.id;
                const serving = q.status === 'serving';
                
                return (
                  <div key={q.id} className={cn(
                    "p-8 flex items-center justify-between transition-colors",
                    isMe ? "bg-primary-50/50" : "hover:bg-slate-50"
                  )}>
                    <div className="flex items-center gap-8">
                      <div className={cn(
                        "w-16 h-16 rounded-[24px] flex flex-col items-center justify-center font-black text-lg",
                        serving ? "bg-green-100 text-green-600 border border-green-200" : 
                        isMe ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" :
                        "bg-slate-50 text-slate-400 border border-black/5"
                      )}>
                        {mainBooking.queue.service.name.charAt(0).toUpperCase()}{q.bookingNumber.toString().padStart(3, '0')}
                      </div>
                      <div className="space-y-1">
                        <div className="font-black text-lg flex items-center gap-3">
                          {mainBooking.queue.service.name}
                          {isMe && <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">← {t("youAreHere")}</span>}
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">
                          {serving ? t("servingStatus") : q.status === 'completed' ? t("completedStatus") : t("waitingStatus")}
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                      serving ? "bg-green-500 text-white" : 
                      isMe ? "bg-primary-600 text-white" :
                      "bg-slate-100 text-slate-400"
                    )}>
                      {serving ? "serving" : isMe ? t("you") : q.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
