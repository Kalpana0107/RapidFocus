import React, { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { Onboarding } from "./Onboarding";
import { TaskDashboard } from "./TaskDashboard";
import { useTasks } from "../hooks/useTasks";
import { AICoachPanel } from "./AICoachPanel";
import { GoalsTab } from "./GoalsTab";
import { StatsTab } from "./StatsTab";
import { useGoalsAndHabits } from "../hooks/useGoalsAndHabits";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { 
  LogOut, 
  LayoutDashboard, 
  TrendingUp, 
  Award, 
  MessageSquare, 
  Flame,
  UserCheck,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  user: any;
  isDemo: boolean;
  onSignOut: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, isDemo, onSignOut }) => {
  const { profile, signOutUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"dashboard" | "goals" | "stats">("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const { tasks } = useTasks();
  const { goals } = useGoalsAndHabits();

  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('chatPanelWidth');
    return saved ? parseInt(saved) : 360;
  });
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(360);

  const startResize = (e: React.MouseEvent) => {
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = startX.current - moveEvent.clientX;
      const newWidth = Math.min(
        600, // MAX_WIDTH
        Math.max(280, startWidth.current + diff) // MIN_WIDTH
      );
      setPanelWidth(newWidth);
      localStorage.setItem('chatPanelWidth', newWidth.toString());
    };
    
    const onMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Run real-time browser push notifications checking daemon
  usePushNotifications(tasks);

  // Listen for custom event to open the AI Coach Chat panel
  React.useEffect(() => {
    const handleOpenChat = () => {
      setIsChatOpen(true);
    };
    window.addEventListener("rapidfocus_open_chat", handleOpenChat);
    return () => {
      window.removeEventListener("rapidfocus_open_chat", handleOpenChat);
    };
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "GU";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  };

  const handleAvatarClick = () => {
    setIsProfilePopupOpen(prev => !prev);
  };

  const handleLogout = async () => {
    if (isDemo) {
      localStorage.removeItem("demo_tasks");
      localStorage.removeItem("demo_goals");
      localStorage.removeItem("demo_habits");
      localStorage.removeItem("rapidfocus_demo_profile");
      localStorage.removeItem("rapidfocus_is_demo");
      onSignOut();
      await signOutUser();
    } else {
      await signOutUser();
    }
  };

  const dailyHabits = goals.filter(g => g.type === "habit");
  const globalStreak = dailyHabits.length > 0 
    ? Math.max(...dailyHabits.map(h => h.streak || 0), 0)
    : 0;

  // Logged in but missing Onboarding Profile -> Show Onboarding Screen
  if (!profile) {
    return <Onboarding />;
  }

  return (
    <div className={`min-h-screen font-sans flex overflow-hidden w-full ${isDark ? 'bg-[#0A0F1E] text-slate-200' : 'bg-[#F8FAFF] text-[#0F172A]'}`}>
      
      {/* LEFT SIDEBAR: Immersive UI Navigation Rail */}
      <aside className={`hidden md:flex w-20 flex-shrink-0 border-r flex-col items-center py-6 z-30 ${isDark ? 'border-white/10 bg-[#0D1425]' : 'border-[#E2E8F0] bg-[#FFFFFF]'}`}>
        
        {/* Brand Hex Logo */}
        <div className="w-11 h-11 bg-gradient-to-tr from-[#00D4FF] to-[#0DFFD4] rounded-xl mb-12 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
          <span className="font-extrabold text-[#0A0F1E] text-lg tracking-tight select-none">RF</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-7 flex-1">
          {/* Dashboard Icon */}
          <button
            onClick={() => setActiveTab("dashboard")}
            id="nav-btn-dashboard"
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer clickable-tab ${
              activeTab === "dashboard"
                ? (isDark ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 glow-shadow shadow-[#00D4FF]/10" : "bg-[#F0F9FF] text-[#0891B2] border border-[#BAE6FD]")
                : (isDark ? "text-slate-500 hover:text-white" : "text-[#94A3B8] hover:text-[#0F172A]")
            }`}
            title="My Dashboard"
          >
            <LayoutDashboard className="w-5.5 h-5.5" />
          </button>

          {/* Goals Icon */}
          <button
            onClick={() => setActiveTab("goals")}
            id="nav-btn-goals"
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer clickable-tab ${
              activeTab === "goals"
                ? (isDark ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 glow-shadow shadow-[#00D4FF]/10" : "bg-[#F0F9FF] text-[#0891B2] border border-[#BAE6FD]")
                : (isDark ? "text-slate-500 hover:text-white" : "text-[#94A3B8] hover:text-[#0F172A]")
            }`}
            title="Goals & Habits"
          >
            <Award className="w-5.5 h-5.5" />
          </button>

          {/* Stats/Analytics Icon */}
          <button
            onClick={() => setActiveTab("stats")}
            id="nav-btn-stats"
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer clickable-tab ${
              activeTab === "stats"
                ? (isDark ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 glow-shadow shadow-[#00D4FF]/10" : "bg-[#F0F9FF] text-[#0891B2] border border-[#BAE6FD]")
                : (isDark ? "text-slate-500 hover:text-white" : "text-[#94A3B8] hover:text-[#0F172A]")
            }`}
            title="My Stats"
          >
            <TrendingUp className="w-5.5 h-5.5" />
          </button>
        </nav>

        {/* User context trigger & exit controls */}
        <div className="mt-auto flex flex-col items-center gap-5">
          {/* Trigger Chat button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            id="nav-btn-chat"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer border clickable-tab ${
              isChatOpen 
                ? (isDark ? "bg-slate-900 border-[#00D4FF] text-[#00D4FF] animate-pulse" : "bg-[#F0F9FF] border-[#0891B2] text-[#0891B2] animate-pulse")
                : (isDark ? "bg-slate-900 border-white/5 text-slate-400 hover:text-white" : "bg-[#F1F5F9] border-[#CBD5E1] text-[#94A3B8] hover:text-[#0F172A]")
            }`}
            title="Ask Your AI Coach"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Sidebar Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            id="nav-btn-theme"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer border clickable-tab ${isDark ? 'bg-slate-900 border-white/5 text-slate-400 hover:text-white' : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#94A3B8] hover:text-[#0F172A]'}`}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-5 h-5 text-[#0891B2]" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>

           {/* User Profile Avatar with Popup States */}
          <div className="relative">
            <button 
              onClick={handleAvatarClick}
              className="relative focus:outline-none transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center"
              title="My Profile"
            >
              <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full z-10 animate-pulse ${isDark ? 'border-[#0D1425]' : 'border-[#FFFFFF]'}`} />
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={profile.name} 
                  className={`w-10 h-10 rounded-full border object-cover ${isDark ? 'border-[#00D4FF]/40' : 'border-[#0891B2]'}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-extrabold uppercase select-none ${isDark ? 'bg-[#0E152F] border-[#00D4FF]/40 text-white' : 'bg-[#F0F9FF] border-[#0891B2] text-[#0891B2]'}`}>
                  {getInitials(profile?.name)}
                </div>
              )}
            </button>

            {/* Profile Dropdown / Popup */}
            {isProfilePopupOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsProfilePopupOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={`absolute bottom-12 left-16 z-50 w-72 border rounded-2xl p-5 shadow-2xl backdrop-blur-xl ${isDark ? 'bg-[#0D1425] border-[#00D4FF]/25' : 'bg-[#FFFFFF] border-[#E2E8F0]'}`}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={profile.name} 
                        className={`w-16 h-16 rounded-full border object-cover ${isDark ? 'border-[#00D4FF]/30' : 'border-[#0891B2]'}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-xl font-bold uppercase ${isDark ? 'bg-gradient-to-tr from-[#00D4FF]/20 to-[#0DFFD4]/20 border-[#00D4FF]/30 text-[#0DFFD4]' : 'bg-[#F0F9FF] border-[#0891B2] text-[#0891B2]'}`}>
                        {getInitials(profile.name)}
                      </div>
                    )}

                    <div className="space-y-1 w-full">
                      <h4 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{profile.name}</h4>
                      <p className={`text-[11px] font-mono break-all ${isDark ? 'text-slate-400' : 'text-[#475569]'}`}>{profile.email || user?.email}</p>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider mt-1.5 ${isDark ? 'bg-[#00D4FF]/10 border-[#00D4FF]/20 text-[#00D4FF]' : 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0891B2]'}`}>
                        <UserCheck className="w-3 h-3" />
                        Role: {profile.role || "Professional"}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfilePopupOpen(false);
                        handleLogout();
                      }}
                      className="w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      SIGN OUT
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Desktop Sign Out Button with Lift and Red Hover Animation */}
          <button
            onClick={handleLogout}
            className={`group w-11 h-11 mt-2 rounded-xl flex flex-col items-center justify-center hover:text-[#DC2626] hover:bg-red-500/10 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${isDark ? 'text-slate-500' : 'text-[#94A3B8]'}`}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 group-hover:text-[#DC2626] transition-colors" />
            <span className="text-[8px] font-bold uppercase tracking-wider group-hover:text-[#DC2626] mt-0.5">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <div 
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden"
        style={{
          marginRight: (!isMobile && isChatOpen) ? `${panelWidth}px` : '0px',
          transition: isResizing 
            ? 'none'  // no transition while dragging
            : 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        
        {/* TOP STATUS HEADER BAR */}
        <header className={`h-20 px-4 md:px-8 flex-shrink-0 flex items-center justify-between border-b z-20 ${isDark ? 'border-white/5 bg-[#0D1425]/50' : 'border-[#E2E8F0] bg-[#FFFFFF]'}`}>
          
          {/* Desktop Only Header Info */}
          <div className="hidden md:block">
            <h1 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Welcome back, <span className={isDark ? "text-[#00D4FF]" : "text-[#0891B2]"}>{profile.name}</span>.
              <span className={`text-xs font-mono select-none uppercase tracking-wider px-2 py-0.5 rounded-md border ml-2 hidden sm:inline-block ${isDark ? 'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/15' : 'bg-[#DCFCE7] text-[#166534] border-[#166534]/20'}`}>
                Live
              </span>
            </h1>
            <p className={`text-[10px] font-mono font-semibold uppercase tracking-widest mt-0.5 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
              <UserCheck className={`w-3.5 h-3.5 ${isDark ? 'text-[#0DFFD4]' : 'text-[#0891B2]'}`} />
              Role: {profile.role || "Professional"}
            </p>
          </div>

          {/* Mobile Only Header Info: ONE clean row of RF logo + Welcome + Streak + ⋮ Dropdown */}
          <div className="flex md:hidden items-center justify-between w-full gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* RF logo */}
              <div className="w-8 h-8 bg-gradient-to-tr from-[#00D4FF] to-[#0DFFD4] rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(0,212,255,0.2)] flex-shrink-0">
                <span className="font-extrabold text-[#0A0F1E] text-xs">RF</span>
              </div>
              {/* Welcome text on one line */}
              <h1 className={`text-sm xs:text-base font-extrabold whitespace-nowrap overflow-hidden text-ellipsis min-w-0 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                Welcome, <span className={isDark ? "text-[#00D4FF]" : "text-[#0891B2]"}>{profile.name}</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Habit Streak Badge */}
              <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border ${isDark ? 'bg-gradient-to-r from-orange-600/10 to-red-600/10 border-orange-500/15' : 'bg-[#FEF3C7] border-[#FDE68A]'}`}>
                <Flame className={`w-4 h-4 fill-current animate-pulse ${isDark ? 'text-orange-400' : 'text-[#B45309]'}`} />
                <span className={`font-bold font-mono text-xs ${isDark ? 'text-orange-400' : 'text-[#B45309]'}`}>{globalStreak}</span>
              </div>

              {/* User Profile Avatar with Popup States on Mobile */}
              <div className="relative">
                <button 
                  onClick={handleAvatarClick}
                  className="relative focus:outline-none transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center"
                  title="My Profile"
                >
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 rounded-full z-10 animate-pulse ${isDark ? 'border-[#0D1425]' : 'border-[#FFFFFF]'}`} />
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={profile.name} 
                      className={`w-8 h-8 rounded-full border object-cover ${isDark ? 'border-[#00D4FF]/40' : 'border-[#0891B2]'}`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-extrabold uppercase select-none ${isDark ? 'bg-[#0E152F] border-[#00D4FF]/40 text-white' : 'bg-[#F0F9FF] border-[#0891B2] text-[#0891B2]'}`}>
                      {getInitials(profile?.name)}
                    </div>
                  )}
                </button>

                {/* Profile Dropdown / Popup for Mobile */}
                {isProfilePopupOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsProfilePopupOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className={`absolute right-0 mt-3.5 z-50 w-64 border rounded-2xl p-4 shadow-2xl backdrop-blur-xl ${isDark ? 'bg-[#0D1425] border-[#00D4FF]/25' : 'bg-[#FFFFFF] border-[#E2E8F0]'}`}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        {user?.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={profile.name} 
                            className={`w-12 h-12 rounded-full border object-cover ${isDark ? 'border-[#00D4FF]/30' : 'border-[#0891B2]'}`}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full border flex items-center justify-center text-md font-bold uppercase ${isDark ? 'bg-gradient-to-tr from-[#00D4FF]/20 to-[#0DFFD4]/20 border-[#00D4FF]/30 text-[#0DFFD4]' : 'bg-[#F0F9FF] border-[#0891B2] text-[#0891B2]'}`}>
                            {getInitials(profile.name)}
                          </div>
                        )}

                        <div className="space-y-0.5 w-full">
                          <h4 className={`text-xs font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{profile.name}</h4>
                          <p className={`text-[10px] font-mono break-all ${isDark ? 'text-slate-400' : 'text-[#475569]'}`}>{profile.email || user?.email}</p>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-wider mt-1 ${isDark ? 'bg-[#00D4FF]/10 border-[#00D4FF]/20 text-[#00D4FF]' : 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0891B2]'}`}>
                            <UserCheck className="w-2.5 h-2.5" />
                            Role: {profile.role || "Professional"}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsProfilePopupOpen(false);
                            handleLogout();
                          }}
                          className="w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-red-500/20 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          SIGN OUT
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Only Streak Badge */}
          <div className="hidden md:flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isDark ? 'bg-gradient-to-r from-orange-600/10 to-red-600/10 border-orange-500/15' : 'bg-[#FEF3C7] border-[#FDE68A]'}`}>
              <span className={`text-xs font-medium font-sans ${isDark ? 'text-slate-400' : 'text-[#B45309]'}`}>Habit Streak:</span>
              <span className={`font-bold flex items-center gap-1 font-mono text-sm leading-none animate-pulse ${isDark ? 'text-orange-400' : 'text-[#B45309]'}`}>
                <Flame className="w-4.5 h-4.5 fill-current" />
                {globalStreak} {globalStreak === 1 ? "Day" : "Days"}
              </span>
            </div>
          </div>
        </header>

        {/* CORE CONTAINER FOR DYNAMIC VIEWS */}
        <div className="flex-1 overflow-y-auto p-2 pb-24 md:p-8 relative">
          
          {/* Animated View Transitions */}
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <TaskDashboard />
              </motion.div>
            )}

            {activeTab === "goals" && (
              <motion.div
                key="goals"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="max-w-5xl mx-auto py-2"
              >
                <GoalsTab />
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="max-w-5xl mx-auto py-2"
              >
                <StatsTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Schedule Assistant Side Panel */}
      {profile && (
        <AICoachPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          tasks={tasks}
          profile={profile}
          panelWidth={panelWidth}
          isResizing={isResizing}
          startResize={startResize}
        />
      )}

      {/* Bottom Navigation Bar for Mobile */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 backdrop-blur-md border-t flex items-center justify-around z-40 px-4 ${isDark ? 'bg-[#0D1425]/95 border-white/10' : 'bg-white/95 border-[#E2E8F0]'}`}>
        {/* Dashboard button */}
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setIsChatOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === "dashboard" && !isChatOpen 
              ? (isDark ? "text-[#00D4FF]" : "text-[#0891B2]") 
              : (isDark ? "text-slate-550" : "text-[#94A3B8]")
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Dashboard</span>
        </button>

        {/* Goals button */}
        <button
          onClick={() => {
            setActiveTab("goals");
            setIsChatOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === "goals" && !isChatOpen 
              ? (isDark ? "text-[#00D4FF]" : "text-[#0891B2]") 
              : (isDark ? "text-slate-550" : "text-[#94A3B8]")
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Goals</span>
        </button>

        {/* Stats button */}
        <button
          onClick={() => {
            setActiveTab("stats");
            setIsChatOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === "stats" && !isChatOpen 
              ? (isDark ? "text-[#00D4FF]" : "text-[#0891B2]") 
              : (isDark ? "text-slate-550" : "text-[#94A3B8]")
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Stats</span>
        </button>

        {/* Chat button */}
        <button
          onClick={() => {
            setIsChatOpen(!isChatOpen);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            isChatOpen 
              ? (isDark ? "text-[#00D4FF]" : "text-[#0891B2]") 
              : (isDark ? "text-slate-550" : "text-[#94A3B8]")
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Chat</span>
        </button>
      </div>
    </div>
  );
};

