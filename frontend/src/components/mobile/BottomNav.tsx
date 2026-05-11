"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Clock, User, Languages, LogOut, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();

  const NAV_ITEMS = [
    { label: t("home"), icon: Home, href: "/" },
    { label: t("services"), icon: List, href: "/services" },
    { label: t("bookings"), icon: Clock, href: "/status" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-black/5 px-6 pb-8 pt-3 md:hidden">
      <div className="flex items-center justify-between">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-primary-600" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Account / Login Section */}
        {user ? (
          <button
            onClick={() => signOut()}
            className="flex flex-col items-center gap-1 text-red-500 active:scale-95 transition-transform"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-[10px] font-medium">{t("logout")}</span>
          </button>
        ) : (
          <Link
            href="/auth/login"
            className="flex flex-col items-center gap-1 text-muted-foreground active:scale-95 transition-transform"
          >
            <LogIn className="w-6 h-6" />
            <span className="text-[10px] font-medium">{t("login")}</span>
          </Link>
        )}

        {/* Language Toggle for Mobile */}
        <button
          onClick={() => setLanguage(language === "th" ? "en" : "th")}
          className="flex flex-col items-center gap-1 text-muted-foreground active:scale-95 transition-transform"
        >
          <Languages className="w-6 h-6" />
          <span className="text-[10px] font-medium">{language.toUpperCase()}</span>
        </button>
      </div>
    </nav>
  );
}
