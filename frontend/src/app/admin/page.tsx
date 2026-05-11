"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Search,
  Calendar,
  Filter,
  Clock,
  Download,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ChevronDown,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion } from "framer-motion";
import { API_URL } from "@/lib/constants";

export default function AdminDashboard() {
  const { user, session, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = React.useState<any>(null);
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [services, setServices] = React.useState<any[]>([]);
  const [systemConfig, setSystemConfig] = React.useState<any>(null);
  const [reportData, setReportData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeView, setActiveView] = React.useState<string>("overview");
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const fetchData = async () => {
    if (!session) return;
    try {
      const [statsRes, bookingsRes, usersRes, servicesRes, configRes, reportRes] = await Promise.all([
        fetch(`${API_URL}/services/stats`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${API_URL}/bookings/all`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${API_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${API_URL}/services`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${API_URL}/services/config`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${API_URL}/bookings/reports`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);
      
      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json();
      const usersData = await usersRes.json();
      const servicesData = await servicesRes.json();
      const configData = await configRes.json();
      const reportData = await reportRes.json();
      
      setStats(statsData && !statsData.statusCode ? statsData : null);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setUsersList(Array.isArray(usersData) ? usersData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setSystemConfig(configData);
      setReportData(reportData);
    } catch (err) {
      console.error("Admin data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading && (!user || user.app_metadata?.role !== "admin")) {
      router.push("/");
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [session, user, authLoading]);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    if (!session) return;
    try {
      await fetch(`http://localhost:3005/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleCallNext = async (serviceId: string) => {
    if (!session) return;
    try {
      await fetch("http://localhost:3005/bookings/next", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ serviceId })
      });
      fetchData();
    } catch (err) {
      console.error("Failed to call next:", err);
    }
  };

  const handleToggleAdmin = async (targetUserId: string, isAdmin: boolean) => {
    if (!session) return;
    try {
      await fetch(`http://localhost:3005/auth/users/${targetUserId}/role`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ isAdmin })
      });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle admin:", err);
    }
  };

  const handleUpdateConfig = async (data: any) => {
    if (!session) return;
    try {
      await fetch(`${API_URL}/services/config`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update config:", err);
    }
  };

  const handleToggleService = async (serviceId: string, currentStatus: string) => {
    if (!session) return;
    const newStatus = currentStatus === "open" ? "closed" : "open";
    try {
      await fetch(`${API_URL}/bookings/${serviceId}/queue-status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle service status:", err);
    }
  };

  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<any>(null);

  const handleSaveService = async (data: any) => {
    if (!session) return;
    try {
      const url = editingService 
        ? `http://localhost:3005/services/${editingService.id}`
        : "http://localhost:3005/services";
      
      await fetch(url, {
        method: editingService ? "PATCH" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });
      setIsServiceModalOpen(false);
      setEditingService(null);
      fetchData();
    } catch (err) {
      console.error("Failed to save service:", err);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.bookingNumber.toString().includes(searchTerm) || 
      b.queue.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statsList = [
    { label: t("waiting"), value: stats?.waiting || "0", color: "bg-slate-50" },
    { label: t("serving"), value: stats?.serving || "0", color: "bg-blue-50 text-blue-600" },
    { label: t("completed"), value: stats?.completed || "0", color: "bg-green-50 text-green-600" },
    { label: t("avgWait"), value: stats?.avgWaitTime || "0", color: "bg-orange-50 text-orange-600" },
  ];

  // Real data for charts from reportData
  const dailyData = [
    { name: 'วันนี้', bookings: reportData?.total || 0 },
  ];

  const serviceDistribution = services.map(s => ({
    name: s.name,
    value: bookings.filter(b => b.queue.serviceId === s.id).length
  })).filter(s => s.value > 0);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="flex min-h-screen bg-slate-50/50 flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-black/5 p-6 flex-col gap-8">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 shadow-lg shadow-primary-600/20" />
          <span className="font-bold text-lg tracking-tight">Queue Admin</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem 
            icon={LayoutDashboard} 
            label={t("overview")} 
            active={activeView === "overview"} 
            onClick={() => setActiveView("overview")}
          />
          <NavItem 
            icon={FileText} 
            label={t("allQueues")} 
            active={activeView === "queues"} 
            onClick={() => setActiveView("queues")}
          />
          <NavItem 
            icon={Users} 
            label={t("users")} 
            active={activeView === "users"} 
            onClick={() => setActiveView("users")}
          />
          <NavItem 
            icon={FileText} 
            label={t("reports")} 
            active={activeView === "reports"} 
            onClick={() => setActiveView("reports")}
          />
          <NavItem 
            icon={Settings} 
            label={t("settings")} 
            active={activeView === "settings"} 
            onClick={() => setActiveView("settings")}
          />
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-black/5 p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600" />
          <span className="font-bold">Admin</span>
        </div>
        <button onClick={() => setActiveView("settings")} className="p-2 bg-slate-50 rounded-lg">
          <Settings className="w-5 h-5 text-slate-500" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 pb-32 md:pb-8 overflow-x-hidden">
        <header className="hidden md:flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tight">
            {activeView === "overview" && t("adminTitle")}
            {activeView === "queues" && t("manageQueues")}
            {activeView === "users" && t("userList")}
            {activeView === "reports" && t("statsReports")}
            {activeView === "settings" && t("systemSettings")}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold px-4 py-2 bg-white border border-black/5 rounded-2xl flex items-center gap-2 shadow-sm">
              <Calendar className="w-4 h-4 text-primary-600" />
              {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {activeView === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {statsList.map((stat) => (
                <div key={stat.label} className={cn("p-4 md:p-8 rounded-[32px] border border-black/5 bg-white shadow-sm hover:shadow-md transition-shadow", stat.color)}>
                  <span className="text-xs md:text-sm font-bold uppercase tracking-wider opacity-60">{stat.label}</span>
                  <div className="text-2xl md:text-4xl font-black mt-1 md:mt-2">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Recent/Waiting Queues */}
            <section className="bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-black text-xl">{t("currentWaiting")} ({bookings.filter(b => b.status === 'waiting').length})</h2>
                <button 
                  onClick={() => setActiveView("queues")}
                  className="px-4 py-2 text-sm text-primary-600 font-bold hover:bg-primary-50 rounded-xl transition-colors"
                >
                  {t("manageQueues")} →
                </button>
              </div>

              <div className="divide-y divide-black/5">
                {bookings.filter(b => b.status === 'waiting' || b.status === 'serving').length === 0 ? (
                  <div className="p-20 text-center text-muted-foreground">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-10 h-10 opacity-20" />
                    </div>
                    <p className="font-bold">{t("noWaiting")}</p>
                  </div>
                ) : (
                  bookings
                    .filter(b => b.status === 'waiting' || b.status === 'serving')
                    .map((item) => (
                      <BookingItem 
                        key={item.id} 
                        item={item} 
                        onUpdateStatus={handleUpdateStatus}
                        onCallNext={handleCallNext}
                      />
                    ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeView === "queues" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-black/5 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-primary-600/5 transition-all text-lg"
                />
              </div>
              <div className="flex gap-2 bg-white p-2 border border-black/5 rounded-[24px] overflow-x-auto shadow-sm">
                {["all", "waiting", "serving", "completed", "cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-6 py-2.5 rounded-[18px] text-sm font-bold whitespace-nowrap transition-all",
                      statusFilter === status 
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {status === "all" ? t("allStatus") : 
                     status === "waiting" ? t("waitingStatus") : 
                     status === "serving" ? t("servingStatus") : 
                     status === "completed" ? t("completedStatus") : t("cancelledStatus")}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Queue Table */}
            <div className="bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-sm">
              <div className="divide-y divide-black/5">
                {filteredBookings.length === 0 ? (
                  <div className="p-32 text-center text-muted-foreground flex flex-col items-center gap-6">
                    <Filter className="w-16 h-16 opacity-10" />
                    <span className="text-xl font-bold opacity-30">{t("noResults")}</span>
                  </div>
                ) : (
                  filteredBookings.map((item) => (
                    <BookingItem 
                      key={item.id} 
                      item={item} 
                      onUpdateStatus={handleUpdateStatus}
                      onCallNext={handleCallNext}
                      showActions={true}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === "users" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="ค้นหาชื่อ / อีเมล / ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-primary-600/5 shadow-sm"
                />
              </div>
              <button className="px-8 py-4 bg-slate-900 text-white rounded-[24px] font-bold shadow-xl shadow-slate-900/10 active:scale-95 transition-transform w-full md:w-auto">
                {t("addAdmin")}
              </button>
            </div>

            <div className="bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-sm">
              <div className="divide-y divide-black/5">
                {usersList
                  .filter(u => 
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    u.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.id.includes(searchTerm)
                  )
                  .map((u) => {
                    const isAdmin = u.app_metadata?.role === "admin";
                    return (
                      <div key={u.id} className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400 border border-black/5">
                            {(u.user_metadata?.full_name?.charAt(0) || u.email?.charAt(0) || "?").toUpperCase()}
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className="font-black text-lg">{u.user_metadata?.full_name || "Unknown User"}</span>
                            <span className="text-sm text-muted-foreground font-medium">{u.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest",
                            isAdmin ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" : "bg-slate-100 text-slate-500"
                          )}>
                            {isAdmin ? "Admin Role" : "User Role"}
                          </div>
                          <button 
                            onClick={() => handleToggleAdmin(u.id, !isAdmin)}
                            disabled={u.id === user?.id}
                            className={cn(
                              "px-6 py-3 rounded-2xl text-sm font-black transition-all",
                              isAdmin 
                                ? "text-red-500 hover:bg-red-50" 
                                : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                            )}
                          >
                            {isAdmin ? t("removeAdmin") : t("promoteAdmin")}
                          </button>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        )}

        {activeView === "settings" && (
          <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
            {/* Section A: Services */}
            <section className="bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-black text-xl">Section A — {t("services")}</h2>
                <button 
                  onClick={() => {
                    setEditingService(null);
                    setIsServiceModalOpen(true);
                  }}
                  className="px-6 py-3 bg-primary-600 text-white rounded-2xl text-sm font-black active:scale-95 transition-transform shadow-lg shadow-primary-600/20"
                >
                  {t("addService")}
                </button>
              </div>
              <div className="divide-y divide-black/5">
                {services.map(s => {
                  const isOpen = s.queues?.[0]?.status === 'open';
                  return (
                    <div key={s.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col space-y-1">
                        <span className="font-black text-lg">{s.name}</span>
                        <span className="text-sm text-muted-foreground font-medium">{s.description || t("noDescription")}</span>
                      </div>
                      <div className="flex items-center gap-8">
                        <button 
                          onClick={() => handleToggleService(s.id, isOpen ? "open" : "closed")}
                          className="flex items-center gap-3 group"
                        >
                          <div className={cn(
                            "w-12 h-6 rounded-full transition-all relative shadow-inner",
                            isOpen ? "bg-green-500" : "bg-slate-300"
                          )}>
                            <div className={cn(
                              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md",
                              isOpen ? "right-1" : "left-1"
                            )} />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider w-16">{isOpen ? "Open" : "Closed"}</span>
                        </button>
                        <button 
                          onClick={() => {
                            setEditingService(s);
                            setIsServiceModalOpen(true);
                          }}
                          className="text-sm text-primary-600 font-black hover:underline px-4 py-2 hover:bg-primary-50 rounded-xl transition-all"
                        >
                          {t("edit")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section B: Queue Settings */}
            <section className="bg-white rounded-[40px] border border-black/5 p-10 shadow-sm space-y-8">
              <h2 className="font-black text-xl border-l-4 border-primary-600 pl-4">Section B — {t("manageQueues")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t("resetTime")}</label>
                  <div className="relative">
                    <select 
                      value={systemConfig?.resetTime || "00:00"}
                      onChange={(e) => handleUpdateConfig({ resetTime: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none font-bold appearance-none cursor-pointer"
                    >
                      <option value="00:00">ทุกวัน เที่ยงคืน (00:00)</option>
                      <option value="06:00">ทุกวัน 6 โมงเช้า (06:00)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t("capacity")}</label>
                  <input 
                    type="number"
                    value={systemConfig?.maxCapacity || 100}
                    onChange={(e) => handleUpdateConfig({ maxCapacity: parseInt(e.target.value) })}
                    className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none font-bold"
                  />
                </div>
              </div>
            </section>

            {/* Section C: Notifications */}
            <section className="bg-white rounded-[40px] border border-black/5 p-10 shadow-sm space-y-8">
              <h2 className="font-black text-xl border-l-4 border-primary-600 pl-4">Section C — {t("notifications")}</h2>
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-black/5">
                <div className="flex flex-col space-y-1">
                  <span className="font-black text-lg">Sound notification</span>
                  <span className="text-sm text-muted-foreground font-medium">{t("soundNotify")}</span>
                </div>
                <button 
                  onClick={() => handleUpdateConfig({ soundEnabled: !systemConfig?.soundEnabled })}
                  className={cn(
                    "w-16 h-8 rounded-full transition-all relative shadow-inner",
                    systemConfig?.soundEnabled ? "bg-primary-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-md",
                    systemConfig?.soundEnabled ? "right-1.5" : "left-1.5"
                  )} />
                </button>
              </div>
            </section>
          </div>
        )}

        {activeView === "reports" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with Export */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-black/5 shadow-sm">
              <div className="flex items-center gap-4">
                <select className="bg-slate-50 border border-black/5 p-3 rounded-2xl font-bold text-sm outline-none">
                  <option>สัปดาห์นี้</option>
                  <option>เดือนนี้</option>
                  <option>ปีนี้</option>
                </select>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl shadow-slate-900/10">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ReportCard title="จองทั้งหมด" value={reportData?.total || 0} icon={BarChartIcon} color="text-blue-600" bg="bg-blue-50" />
              <ReportCard title="เสร็จสิ้น" value={reportData?.completed || 0} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
              <ReportCard title="ยกเลิก" value={reportData?.cancelled || 0} icon={XCircle} color="text-red-600" bg="bg-red-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Queue Trend */}
              <div className="bg-white p-10 rounded-[40px] border border-black/5 shadow-sm space-y-6">
                <h3 className="font-black text-xl">{t("statsReports")}</h3>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                        cursor={{fill: '#f8fafc', radius: 12}}
                      />
                      <Bar dataKey="bookings" fill="#2563eb" radius={[12, 12, 12, 12]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Service Distribution */}
              <div className="bg-white p-10 rounded-[40px] border border-black/5 shadow-sm space-y-6">
                <h3 className="font-black text-xl">สัดส่วนแต่ละบริการ</h3>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={10}
                        dataKey="value"
                      >
                        {serviceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 'bold'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Service Add/Edit Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsServiceModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl space-y-8"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-black">{editingService ? t("edit") : t("addService")}</h3>
              <p className="text-muted-foreground">{t("serviceDescPlaceholder")}</p>
            </div>

            <form 
              onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleSaveService({
                  name: formData.get("name"),
                  description: formData.get("description"),
                  maxCapacity: parseInt(formData.get("maxCapacity") as string) || 50
                });
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("serviceName")}</label>
                <input 
                  name="name"
                  defaultValue={editingService?.name}
                  required
                  className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-600/5"
                  placeholder="เช่น ตรวจสอบสุขภาพทั่วไป"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("description")}</label>
                <textarea 
                  name="description"
                  defaultValue={editingService?.description}
                  className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-600/5 min-h-[100px]"
                  placeholder={t("serviceDescPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("capacity")}</label>
                <input 
                  name="maxCapacity"
                  type="number"
                  defaultValue={editingService?.maxCapacity || 50}
                  className="w-full p-4 bg-slate-50 border border-black/5 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-600/5"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-xl shadow-primary-600/20 active:scale-95 transition-all"
                >
                  {t("save")}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black active:scale-95 transition-all"
                >
                  {t("cancelBtn")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ReportCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className={cn("p-10 rounded-[40px] border border-black/5 shadow-sm flex items-center justify-between bg-white overflow-hidden relative group")}>
      <div className="space-y-2 relative z-10">
        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{title}</span>
        <div className={cn("text-5xl font-black", color)}>{value}</div>
      </div>
      <div className={cn("p-6 rounded-[32px] relative z-10", bg, color)}>
        <Icon className="w-10 h-10" />
      </div>
      <div className={cn("absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700", bg)} />
    </div>
  );
}

function NavItem({ 
  icon: Icon, 
  label, 
  active = false, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-6 py-4 rounded-[20px] text-sm font-black transition-all w-full text-left",
        active 
          ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-2" 
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-primary-400" : "text-slate-400")} />
      {label}
    </button>
  );
}

function BookingItem({ 
  item, 
  onUpdateStatus, 
  onCallNext,
  showActions = true
}: { 
  item: any; 
  onUpdateStatus: (id: string, status: string) => void;
  onCallNext: (serviceId: string) => void;
  showActions?: boolean;
}) {
  const isServing = item.status === "serving";
  const isWaiting = item.status === "waiting";
  const isCompleted = item.status === "completed";
  const isCancelled = item.status === "cancelled";

  return (
    <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-all group">
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center justify-center w-24 h-24 rounded-[32px] bg-white border border-black/5 shadow-sm group-hover:scale-105 transition-transform">
          <span className="text-3xl font-black text-slate-900">
            {item.queue.service.name.charAt(0).toUpperCase()}{item.bookingNumber.toString().padStart(3, '0')}
          </span>
          <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-1">Number</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <h3 className="font-black text-xl text-slate-900">{item.queue.service.name}</h3>
            <span className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
              isServing ? "bg-blue-600 text-white" :
              isWaiting ? "bg-orange-500 text-white" :
              isCompleted ? "bg-green-500 text-white" :
              "bg-red-500 text-white"
            )}>
              {item.status === 'serving' ? 'Serving' : item.status}
            </span>
          </div>
          <div className="flex flex-col text-sm text-muted-foreground font-medium">
            <span className="flex items-center gap-2 font-black text-slate-900">
              <User className="w-4 h-4 text-primary-600" />
              {item.user?.user_metadata?.full_name || item.user?.email || item.userId}
            </span>
            <div className="flex items-center gap-6 mt-1.5">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-600" />
                {new Date(item.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              </span>
              {isWaiting && (
                <span className="text-primary-600 font-bold opacity-60">
                  รอมาแล้ว {Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 60000)} นาที
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-4">
          {isWaiting && (
            <>
              <button 
                onClick={() => onCallNext(item.queue.serviceId)}
                className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                เรียกคิว <ArrowUpRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onUpdateStatus(item.id, "cancelled")}
                className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                title="ยกเลิกการจอง"
              >
                <XCircle className="w-7 h-7" />
              </button>
            </>
          )}
          
          {isServing && (
            <button 
              onClick={() => onUpdateStatus(item.id, "completed")}
              className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-green-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              เสร็จสิ้นภารกิจ <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {(isCompleted || isCancelled) && (
            <div className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
              {isCompleted ? "Completed" : "Cancelled"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListItemsIcon(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
