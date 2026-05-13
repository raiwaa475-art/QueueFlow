"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Users, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
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
  const [bookingStatus, setBookingStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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
    setErrorMessage(null);
    
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
        setErrorMessage(errData.message || "Queue is currently unavailable or has reached full capacity.");
        setBookingStatus('error');
      }
    } catch (err) {
      console.error("Booking failed:", err);
      setErrorMessage("Network error occurred. Please try again.");
      setBookingStatus('error');
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

      {/* Premium Error Handling UI Overlay for Full Capacity / Closed Queue */}
      {bookingStatus === 'error' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
        >
          <motion.div 
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-black/5 flex flex-col items-center relative overflow-hidden"
          >
            {/* Soft decorative header glow */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 to-amber-500" />
            
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-6 shadow-inner border border-red-100">
              <AlertTriangle className="w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-black mb-3 text-slate-900">Queue Unavailable</h2>
            <p className="text-muted-foreground text-base max-w-sm mb-8 leading-relaxed font-medium">
              {errorMessage}
            </p>
            
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => setBookingStatus('idle')}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black tracking-wide shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
              >
                Try Again
              </button>
              <Link
                href="/services"
                className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-all"
              >
                Back to Services
              </Link>
            </div>
          </motion.div>
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
