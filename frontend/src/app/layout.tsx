import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const thaiFont = IBM_Plex_Sans_Thai({
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-thai",
});

export const metadata: Metadata = {
  title: "SME Queue - ระบบจัดการคิวอัจฉริยะ",
  description: "ระบบจองคิวออนไลน์แบบ Real-time สำหรับธุรกิจ SME",
};

import Navbar from "@/components/Navbar";
import BottomNav from "@/components/mobile/BottomNav";

import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${thaiFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50/50 font-thai">
        <AuthProvider>
          <LanguageProvider>
            <div className="hidden md:block">
              <Navbar />
            </div>
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
            <BottomNav />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
