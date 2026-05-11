"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // The `onAuthStateChange` in AuthProvider will handle the session update automatically,
      // but we need this page to ensure the code exchange happens and redirect the user.
      const { error } = await supabase.auth.getSession();
      
      if (!error) {
        // Redirect to home or a specific page after successful login
        router.push("/");
      } else {
        console.error("Auth callback error:", error.message);
        router.push("/auth/login?error=Authentication failed");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-bold">กำลังเข้าสู่ระบบ...</h2>
      <p className="text-muted-foreground text-sm mt-2">กรุณารอสักครู่ ระบบกำลังยืนยันตัวตนของคุณ</p>
    </div>
  );
}
