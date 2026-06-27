import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "goals" | "stats">("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const { tasks } = useTasks();
  const { goals } = useGoalsAndHabits();

  // Dark/Light theme manager
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  React.useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

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
    <div className="min-h-screen bg-[#0A0F1E] font-sans text-slate-200 flex overflow-hidden w-full">
      
      {/* LEFT SIDEBAR: Immersive UI Navigation Rail */}
      <aside className="hidden md:flex w-20 flex-shrink-0 border-r border-white/10 flex-col items-center py-6 bg-[#0D1425] z-30">
        
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
                ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 glow-shadow shadow-[#00D4FF]/10"
                : "text-slate-500 hover:text-white"
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
                ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 glow-shadow shadow-[#00D4FF]/10"
                : "text-slate-500 hover:text-white"
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
                ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 glow-shadow shadow-[#00D4FF]/10"
                : "text-slate-500 hover:text-white"
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
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer bg-slate-900 border clickable-tab ${
              isChatOpen 
                ? "border-[#00D4FF] text-[#00D4FF] animate-pulse" 
                : "border-white/5 text-slate-400 hover:text-white"
            }`}
            title="Ask Your AI Coach"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Sidebar Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            id="nav-btn-theme"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer bg-slate-900 border border-white/5 text-slate-400 hover:text-white clickable-tab"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-5 h-5 text-[#00D4FF]" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>

           {/* User Profile Avatar with Popup States */}
          <div className="relative">
            <button 
              onClick={handleAvatarClick}
              className="relative focus:outline-none transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center"
              title="My Profile"
            >
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0D1425] rounded-full z-10 animate-pulse" />
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={profile.name} 
                  className="w-10 h-10 rounded-full border border-[#00D4FF]/40 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0E152F] border border-[#00D4FF]/40 flex items-center justify-center text-xs font-extrabold text-white uppercase select-none">
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
                  className="absolute bottom-12 left-16 z-50 w-72 bg-[#0D1425] border border-[#00D4FF]/25 rounded-2xl p-5 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={profile.name} 
                        className="w-16 h-16 rounded-full border border-[#00D4FF]/30 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#00D4FF]/20 to-[#0DFFD4]/20 border border-[#00D4FF]/30 flex items-center justify-center text-xl font-bold text-[#0DFFD4] uppercase">
                        {getInitials(profile.name)}
                      </div>
                    )}

                    <div className="space-y-1 w-full">
                      <h4 className="text-sm font-bold text-white tracking-tight">{profile.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono break-all">{profile.email || user?.email}</p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[10px] font-mono text-[#00D4FF] uppercase tracking-wider mt-1.5">
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
            className="group w-11 h-11 mt-2 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
            <span className="text-[8px] font-bold uppercase tracking-wider group-hover:text-red-400 mt-0.5">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="h-20 px-4 md:px-8 flex-shrink-0 flex items-center justify-between border-b border-white/5 bg-[#0D1425]/50 z-20">
          
          {/* Desktop Only Header Info */}
          <div className="hidden md:block">
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Welcome back, <span className="text-[#00D4FF]">{profile.name}</span>.
              <span className="text-xs bg-[#00D4FF]/15 text-[#00D4FF] font-mono select-none uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#00D4FF]/15 ml-2 hidden sm:inline-block">
                Live
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono font-semibold uppercase tracking-widest mt-0.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[#0DFFD4]" />
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
              <h1 className="text-sm xs:text-base font-extrabold text-white whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                Welcome, <span className="text-[#00D4FF]">{profile.name}</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Habit Streak Badge */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-600/10 to-red-600/10 px-2.5 py-1.5 rounded-xl border border-orange-500/15">
                <Flame className="w-4 h-4 text-orange-400 fill-current animate-pulse" />
                <span className="font-bold text-orange-400 font-mono text-xs">{globalStreak}</span>
              </div>

              {/* User Profile Avatar with Popup States on Mobile */}
              <div className="relative">
                <button 
                  onClick={handleAvatarClick}
                  className="relative focus:outline-none transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center"
                  title="My Profile"
                >
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0D1425] rounded-full z-10 animate-pulse" />
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={profile.name} 
                      className="w-8 h-8 rounded-full border border-[#00D4FF]/40 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0E152F] border border-[#00D4FF]/40 flex items-center justify-center text-[10px] font-extrabold text-white uppercase select-none">
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
                      className="absolute right-0 mt-3.5 z-50 w-64 bg-[#0D1425] border border-[#00D4FF]/25 rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        {user?.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={profile.name} 
                            className="w-12 h-12 rounded-full border border-[#00D4FF]/30 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00D4FF]/20 to-[#0DFFD4]/20 border border-[#00D4FF]/30 flex items-center justify-center text-md font-bold text-[#0DFFD4] uppercase">
                            {getInitials(profile.name)}
                          </div>
                        )}

                        <div className="space-y-0.5 w-full">
                          <h4 className="text-xs font-bold text-white tracking-tight">{profile.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono break-all">{profile.email || user?.email}</p>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[9px] font-mono text-[#00D4FF] uppercase tracking-wider mt-1">
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
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-600/10 to-red-600/10 px-4 py-2 rounded-xl border border-orange-500/15">
              <span className="text-xs text-slate-400 font-medium font-sans">Habit Streak:</span>
              <span className="font-bold text-orange-400 flex items-center gap-1 font-mono text-sm leading-none animate-pulse">
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
        />
      )}

      {/* Bottom Navigation Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0D1425]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around z-40 px-4">
        {/* Dashboard button */}
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setIsChatOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === "dashboard" && !isChatOpen ? "text-[#00D4FF]" : "text-slate-550"
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
            activeTab === "goals" && !isChatOpen ? "text-[#00D4FF]" : "text-slate-550"
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
            activeTab === "stats" && !isChatOpen ? "text-[#00D4FF]" : "text-slate-550"
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
            isChatOpen ? "text-[#00D4FF]" : "text-slate-550"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Chat</span>
        </button>
      </div>
    </div>
  );
};
