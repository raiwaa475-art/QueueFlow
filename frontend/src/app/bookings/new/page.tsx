"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL } from "@/lib/constants";

function NewBookingContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get("serviceId");
  const { session, user } = useAuth();
  
  const [service, setService] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [bookingStatus, setBookingStatus] = React.useState<'idle' | 'loading' | 'success'>('idle');

  React.useEffect(() => {
    if (!serviceId) return;

    // Fetch service details from NestJS API
    const fetchService = async () => {
      try {
        const res = await fetch(`${API_URL}/services/${serviceId}`);
        const data = await res.json();
        setService(data);
      } catch (err) {
        console.error("Failed to fetch service:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  const handleConfirm = async () => {
    if (!session) {
      router.push("/auth/login?redirect=/bookings/new?serviceId=" + serviceId);
      return;
    }

    setBookingStatus('loading');
    
    try {
      // Call NestJS API to join queue with Token
      const res = await fetch(`${API_URL}/bookings/join`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          serviceId,
        }),
      });

      if (res.ok) {
        setBookingStatus('success');
        setTimeout(() => {
          router.push("/status");
        }, 2000);
      } else {
        const errData = await res.json();
        alert(errData.message || "Booking failed");
        setBookingStatus('idle');
      }
    } catch (err) {
      console.error("Booking failed:", err);
      setBookingStatus('idle');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!service) return (
    <div className="p-10 text-center">
      <h1 className="text-xl font-bold">{t("serviceNotFound")}</h1>
      <Link href="/services" className="text-primary-600 underline mt-4 block">{t("backToServices")}</Link>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <header className="p-6 flex items-center gap-4 bg-white border-b border-black/5">
        <Link href="/services" className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold">{t("confirmBookingTitle")}</h1>
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-6">
        {/* Service Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm"
        >
          <div className="w-16 h-16 bg-primary-600/10 rounded-2xl flex items-center justify-center text-primary-600 mb-6">
            <Users className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{service.name}</h2>
          <p className="text-muted-foreground mb-8">
            {service.description}
          </p>

        </motion.div>

        {/* Action Section */}
        <div className="space-y-4">
          <button
            onClick={handleConfirm}
            disabled={bookingStatus !== 'idle'}
            className={cn(
              "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95",
              bookingStatus === 'success' 
                ? "bg-green-500 text-white" 
                : "bg-primary-600 text-white shadow-xl shadow-primary-600/20"
            )}
          >
            {bookingStatus === 'loading' ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : bookingStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-6 h-6" /> {t("bookingSuccess")}
              </>
            ) : (
              t("bookNow")
            )}
          </button>
          
          <p className="text-center text-sm text-muted-foreground">
            {t("bookingNotice")}
          </p>
        </div>
      </main>

      {/* Success Animation Overlay */}
      {bookingStatus === 'success' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-8">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-bold mb-4">{t("bookingSuccess")}</h2>
          <p className="text-muted-foreground max-w-xs mb-8">
            {t("redirectingStatus")}
          </p>
          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2 }}
              className="h-full bg-green-500"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewBookingContent />
    </Suspense>
  );
}
