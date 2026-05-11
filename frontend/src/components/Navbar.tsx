"use client";

import React from "react";
import Link from "next/link";
import { Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-black/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 transition-transform group-hover:scale-110">
            <img src="/logo.svg" alt="QueueFlow Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Queue<span className="text-primary-600">Flow</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("services")}
          </Link>
          <Link href="/status" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("bookings")}
          </Link>
          {user?.app_metadata?.role === "admin" && (
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("admin")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-6">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setLanguage("th")}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-md transition-all",
                language === "th" ? "bg-white shadow-sm text-primary-600" : "text-slate-500 hover:text-slate-800"
              )}
            >
              TH
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-md transition-all",
                language === "en" ? "bg-white shadow-sm text-primary-600" : "text-slate-500 hover:text-slate-800"
              )}
            >
              EN
            </button>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold truncate max-w-[120px]">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <button 
                    onClick={() => signOut()}
                    className="text-[10px] text-red-500 hover:underline font-bold"
                  >
                    {t("logout")}
                  </button>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 border border-slate-300">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium hover:text-primary-600 transition-colors"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
