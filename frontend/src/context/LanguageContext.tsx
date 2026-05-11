"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "th" | "en";

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { th: "หน้าหลัก", en: "Home" },
  services: { th: "บริการ", en: "Services" },
  bookings: { th: "คิวของฉัน", en: "My Bookings" },
  admin: { th: "แอดมิน", en: "Admin" },
  login: { th: "เข้าสู่ระบบ", en: "Sign In" },
  register: { th: "ลงทะเบียน", en: "Get Started" },
  logout: { th: "ออกจากระบบ", en: "Logout" },

  // Landing Page
  heroTitle: { th: "จัดการคิวของคุณ", en: "Manage your queue" },
  heroSubtitle: { th: "ในรูปแบบ Real-time", en: "in real-time." },
  heroDesc: { th: "ระบบจัดการคิวระดับพรีเมียมสำหรับธุรกิจ SME ยุคใหม่ สัมผัสประสบการณ์การบริการที่ไหลลื่นและรวดเร็ว", en: "A premium, low-latency booking system designed for modern businesses. Experience seamless flow." },
  getStarted: { th: "เริ่มต้นใช้งาน", en: "Get Started" },
  adminDash: { th: "หน้าแอดมิน", en: "Admin Dashboard" },
  yourCurrentQueue: { th: "คิวของคุณตอนนี้", en: "Your Current Queue" },
  nextGenQueue: { th: "ระบบจัดการคิวรุ่นใหม่", en: "Next-Gen Queue Management" },
  instantUpdates: { th: "อัปเดตทันใจ", en: "Instant Updates" },
  instantUpdatesDesc: { th: "รองรับด้วย Supabase Realtime สำหรับการเปลี่ยนแปลงสถานะคิวในระดับเสี้ยววินาที", en: "Powered by Supabase Realtime for sub-second latency in queue status changes." },
  smartScheduling: { th: "ระบบจัดตารางอัจฉริยะ", en: "Smart Scheduling" },
  smartSchedulingDesc: { th: "ระบบจัดการความจุอัตโนมัติและรีเซ็ตคิวรายวันเพื่อความสะดวกในการดำเนินงาน", en: "Automated capacity management and daily queue resets for effortless operation." },
  secureRobust: { th: "ปลอดภัยและแข็งแกร่ง", en: "Secure & Robust" },
  secureRobustDesc: { th: "ความปลอดภัยระดับองค์กรด้วย Supabase Auth และ Row Level Security", en: "Enterprise-grade security with Supabase Auth and Row Level Security." },

  // Services Page
  availableServices: { th: "บริการที่เปิดรับ", en: "Available Services" },
  servicesDescription: { th: "เลือกบริการเพื่อดูสถานะคิวหรือจองคิวออนไลน์", en: "Select a service to check status or book a queue." },
  currentQueue: { th: "คิวปัจจุบัน", en: "Current Queue" },
  waitEstimate: { th: "รอประมาณ", en: "Wait Time" },
  currentlyClosed: { th: "ปิดให้บริการ", en: "Currently Closed" },
  open: { th: "เปิด", en: "Open" },
  closed: { th: "ปิด", en: "Closed" },
  joinQueue: { th: "จองคิว", en: "Join Queue" },
  confirmBooking: { th: "ยืนยันการจองคิว?", en: "Confirm Booking?" },
  confirmBookingDesc: { th: "คุณกำลังจะจองคิวสำหรับ", en: "You are booking for" },
  confirmBtn: { th: "ยืนยันการจอง", en: "Confirm" },
  cancelBtn: { th: "ยกเลิก", en: "Cancel" },
  connectionError: { th: "การเชื่อมต่อขัดข้อง", en: "Connection Error" },
  connectionErrorDesc: { th: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตและลองอีกครั้ง", en: "We couldn't connect to the server. Please check your internet connection and try again." },
  retryConnection: { th: "ลองใหม่อีกครั้ง", en: "Retry Connection" },
  noServicesYet: { th: "ยังไม่มีบริการในขณะนี้", en: "No services available yet" },
  noServicesDesc: { th: "เป็นคนแรกที่เริ่มจองคิววันนี้เลย! ทุกอย่างพร้อมให้บริการคุณแล้ว", en: "Be the first to join the queue today! We are ready to serve you." },
  refresh: { th: "รีเฟรช", en: "Refresh" },
  noDescription: { th: "ยังไม่มีคำอธิบายบริการ", en: "No description available" },
  minutes: { th: "นาที", en: "mins" },

  // Status Page
  statusTitle: { th: "หน้าสถานะ (realtime)", en: "Status (Real-time)" },
  yourQueue: { th: "คิวของคุณ", en: "Your Queue" },
  waitingBefore: { th: "รอก่อนคุณ", en: "Waiting before you" },
  people: { th: "คน", en: "people" },
  currentlyServing: { th: "คิวที่กำลังให้บริการ", en: "Currently serving" },
  youAreHere: { th: "คุณอยู่ที่นี่", en: "You are here" },
  waitEstimateStatus: { th: "รอโดยประมาณ", en: "Est. Wait Time" },
  location: { th: "สถานที่", en: "Location" },
  allQueueOrder: { th: "ลำดับคิวทั้งหมด", en: "All Queues" },
  reachedYourQueue: { th: "ถึงคิวของคุณแล้ว!", en: "It's your turn!" },
  syncingData: { th: "กำลังซิงค์ข้อมูล...", en: "Syncing real-time data..." },
  pleaseLogin: { th: "กรุณาเข้าสู่ระบบ", en: "Please Sign In" },
  loginToTrack: { th: "เพื่อติดตามสถานะคิวของคุณแบบ Real-time กรุณาลงชื่อเข้าใช้งานก่อน", en: "To track your queue status in real-time, please sign in first." },
  loginNow: { th: "เข้าสู่ระบบตอนนี้", en: "Sign In Now" },
  noBookings: { th: "ยังไม่มีคิวของคุณ", en: "You have no bookings" },
  noBookingsDesc: { th: "จองคิวแรกของคุณเพื่อรับบริการที่รวดเร็วและสะดวกสบาย", en: "Book your first queue to receive fast and convenient service." },
  goToServices: { th: "ไปที่หน้าบริการ", en: "Go to Services" },
  waitingMore: { th: "รออีก", en: "Waiting more" },
  queuesCount: { th: "คิว", en: "queues" },
  counter1: { th: "เคาน์เตอร์บริการชั้น 1", en: "Service Counter 1st Floor" },
  servingStatus: { th: "กำลังให้บริการ", en: "Serving" },
  completedStatus: { th: "เสร็จสิ้นแล้ว", en: "Completed" },
  waitingStatus: { th: "รอคิว", en: "Waiting" },
  cancelledStatus: { th: "ยกเลิก", en: "Cancelled" },
  you: { th: "คุณ", en: "You" },

  // New Booking Page
  confirmBookingTitle: { th: "ยืนยันการจองคิว", en: "Confirm Queue" },
  bookingSuccess: { th: "จองคิวเรียบร้อย!", en: "Booking Successful!" },
  redirectingStatus: { th: "เรากำลังนำคุณไปยังหน้าติดตามสถานะคิว เพื่อดูความคืบหน้าแบบ Real-time", en: "We're redirecting you to the status page to track real-time progress." },
  bookNow: { th: "จองคิวตอนนี้", en: "Book Now" },
  serviceNotFound: { th: "ไม่พบบริการ", en: "Service not found" },
  backToServices: { th: "กลับไปหน้าบริการ", en: "Back to services" },
  bookingNotice: { th: "เมื่อกดจองคิว คุณจะได้รับเลขคิวทันทีผ่านหน้ารายงานสถานะ", en: "Upon booking, you will receive your queue number on the status page." },

  // Admin
  nextQueue: { th: "เรียกคิวถัดไป", en: "Next Queue" },
  overview: { th: "ภาพรวม", en: "Overview" },
  allQueues: { th: "คิวทั้งหมด", en: "All Queues" },
  users: { th: "ผู้ใช้", en: "Users" },
  reports: { th: "รายงาน", en: "Reports" },
  settings: { th: "ตั้งค่า", en: "Settings" },
  adminTitle: { th: "ภาพรวมการดำเนินงาน", en: "Operational Overview" },
  manageQueues: { th: "จัดการคิวทั้งหมด", en: "Manage All Queues" },
  userList: { th: "รายชื่อผู้ใช้และสิทธิ์", en: "User List & Permissions" },
  statsReports: { th: "สถิติและรายงาน", en: "Stats & Reports" },
  systemSettings: { th: "ตั้งค่าระบบ", en: "System Settings" },
  waiting: { th: "รอคิว", en: "Waiting" },
  serving: { th: "กำลังให้บริการ", en: "Serving" },
  completed: { th: "เสร็จแล้ววันนี้", en: "Completed Today" },
  avgWait: { th: "เฉลี่ย (นาที)", en: "Avg Wait (mins)" },
  currentWaiting: { th: "คิวที่รออยู่ตอนนี้", en: "Current Waiting Queues" },
  noWaiting: { th: "ยังไม่มีคิวที่กำลังรอหรือให้บริการ", en: "No queues waiting or being served" },
  searchPlaceholder: { th: "ค้นหาเลขคิว / บริการ / ชื่อผู้ใช้...", en: "Search queue / service / user..." },
  allStatus: { th: "ทั้งหมด", en: "All" },
  noResults: { th: "ไม่พบข้อมูลที่ตรงกับการค้นหา", en: "No matching results found" },
  addAdmin: { th: "+ เพิ่ม Admin", en: "+ Add Admin" },
  promoteAdmin: { th: "ตั้งเป็น Admin", en: "Promote Admin" },
  removeAdmin: { th: "ยกเลิก Admin", en: "Remove Admin" },
  addService: { th: "+ เพิ่มบริการใหม่", en: "+ Add New Service" },
  edit: { th: "แก้ไข", en: "Edit" },
  resetTime: { th: "ล้างคิวอัตโนมัติ", en: "Reset Time" },
  capacity: { th: "จำนวนคิวสูงสุดต่อวัน", en: "Daily Capacity" },
  notifications: { th: "การแจ้งเตือน", en: "Notifications" },
  soundNotify: { th: "เปิดเสียงแจ้งเตือนอัตโนมัติเมื่อมีการเรียกคิวหรือจองคิวใหม่", en: "Enable sound notifications for new bookings or calls." },
  save: { th: "บันทึกข้อมูล", en: "Save Changes" },
  serviceName: { th: "ชื่อบริการ", en: "Service Name" },
  description: { th: "คำอธิบาย", en: "Description" },
  serviceDescPlaceholder: { th: "รายละเอียดสั้นๆ เกี่ยวกับบริการนี้", en: "Brief description of this service" },
  account: { th: "บัญชี", en: "Account" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("th");

  // Load from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language;
    if (saved && (saved === "th" || saved === "en")) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
