"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Shield, Zap } from "lucide-react";
import Link from "next/link";
import QueueCard from "@/components/mobile/QueueCard";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL } from "@/lib/constants";

export default function LandingPage() {
  const { user, session } = useAuth();
  const { t } = useLanguage();

  return (
    <main className="flex-1 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
        </div>

        <div className="container px-4 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium tracking-wider uppercase rounded-full glass text-primary-foreground/80 border-primary/20">
              {t("nextGenQueue")}
            </span>
            <h1 className="mb-8 text-5xl md:text-7xl font-bold tracking-tight">
              {t("heroTitle")} <br />
              <span className="gradient-text">{t("heroSubtitle")}</span>
            </h1>
            <p className="max-w-2xl mx-auto mb-10 text-lg text-muted-foreground">
              {t("heroDesc")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/services"
                className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full transition-transform group-hover:translate-y-0" />
                <span className="relative flex items-center gap-2">
                  {t("getStarted")} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <Link
                href="/admin"
                className="px-8 py-4 glass text-foreground rounded-xl font-semibold transition-all hover:bg-white/5 active:scale-95"
              >
                {t("adminDash")}
              </Link>
            </div>
          </motion.div>

          {/* Live Booking Section (Mobile Style) */}
          {user && (
            <CurrentBookingSection session={session} />
          )}

          {/* Desktop Feature Grid (Existing) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 hidden md:block relative max-w-4xl mx-auto"
          >
            <div className="glass rounded-3xl p-8 md:p-12 border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{t("instantUpdates")}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t("instantUpdatesDesc")}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{t("smartScheduling")}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t("smartSchedulingDesc")}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{t("secureRobust")}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t("secureRobustDesc")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

function CurrentBookingSection({ session }: { session: any }) {
  const { t } = useLanguage();
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!session) return;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_URL}/bookings/my`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const active = data.find((b: any) => b.status === "waiting" || b.status === "serving");
          setBooking(active);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [session]);

  if (loading) return (
    <div className="mt-24 md:hidden flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );
  
  if (!booking) return null;

  return (
    <section className="mt-24 md:hidden">
      <h2 className="text-2xl font-bold mb-8 text-center">{t("yourCurrentQueue")}</h2>
      <QueueCard 
        queueNumber={booking.bookingNumber.toString()}
        waitingCount={0} 
        currentServing="-" 
        progress={booking.status === 'serving' ? 100 : 50}
        showButton={false}
      />
    </section>
  );
}
