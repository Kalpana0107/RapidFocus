import React, { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Login } from "./components/Login";
import { Onboarding } from "./components/Onboarding";
import { TaskDashboard } from "./components/TaskDashboard";
import { CustomCursor } from "./components/CustomCursor";
import { useTasks } from "./hooks/useTasks";
import { AICoachPanel } from "./components/AICoachPanel";
import { GoalsTab } from "./components/GoalsTab";
import { StatsTab } from "./components/StatsTab";
import { SplashScreen } from "./components/SplashScreen";
import { useGoalsAndHabits } from "./hooks/useGoalsAndHabits";
import { usePushNotifications } from "./hooks/usePushNotifications";
import {   LogOut, 
  LayoutDashboard, 
  TrendingUp, 
  Award, 
  MessageSquare, 
  ShieldAlert,
  Flame,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const AppContent: React.FC = () => {
  const { user, profile, loading, isDemoMode, signInWithGoogle, signOutUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "goals" | "stats">("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isGuestPopupOpen, setIsGuestPopupOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { tasks } = useTasks();
  const { goals } = useGoalsAndHabits();

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
    if (isDemoMode) {
      setIsGuestPopupOpen(true);
    } else {
      setIsProfilePopupOpen(prev => !prev);
    }
  };

  const dailyHabits = goals.filter(g => g.type === "habit");
  const globalStreak = dailyHabits.length > 0 
    ? Math.max(...dailyHabits.map(h => h.streak || 0), 0)
    : 0;

  // Show cinematic splash screen on first load
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Full Screen Load Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00D4FF]/5 rounded-full filter blur-[80px]" />
        
        <div className="relative text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-t-[#00D4FF] border-r-transparent border-b-[#0DFFD4] border-l-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border border-dashed border-white/10 animate-reverse-spin" />
          </div>
          <p className="text-sm font-mono tracking-widest text-[#00D4FF] uppercase animate-pulse">
            Loading your workspace...
          </p>
          <p className="text-gray-500 text-xs font-mono mt-1">
            SETTING UP YOUR DASHBOARD
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return <Login />;
  }

  // Logged in but missing Onboarding Profile -> Show Onboarding Screen
  if (!profile) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] font-sans text-slate-200 flex overflow-hidden">
      
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

          {/* User Profile Avatar with Popup States */}
          <div className="relative">
            <button 
              onClick={handleAvatarClick}
              className="relative focus:outline-none transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center"
              title={isDemoMode ? "Guest Options" : "My Profile"}
            >
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0D1425] rounded-full z-10 animate-pulse" />
              {isDemoMode ? (
                <div className="w-10 h-10 rounded-full bg-[#0E152F] border border-slate-700/60 flex items-center justify-center text-xs font-bold text-slate-400 uppercase select-none">
                  DE
                </div>
              ) : user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={profile.name} 
                  className="w-10 h-10 rounded-full border border-[#00D4FF]/40 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0E152F] border border-[#00D4FF]/40 flex items-center justify-center text-xs font-extrabold text-white uppercase select-none">
                  {getInitials(profile.name)}
                </div>
              )}
            </button>

            {/* Profile Dropdown / Popup */}
            {isProfilePopupOpen && !isDemoMode && (
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
                        Role: {profile.role}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfilePopupOpen(false);
                        signOutUser();
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
            onClick={() => signOutUser()}
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
              Role: {profile.role}
            </p>
          </div>

          {/* Mobile Only Header Info: ONE clean row of RF logo + Welcome + Streak + ⋮ Dropdown */}
          <div className="flex md:hidden items-center justify-between w-full gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* RF logo */}
              <div className="w-8 h-8 bg-gradient-to-tr from-[#00D4FF] to-[#0DFFD4] rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(0,212,255,0.2)] flex-shrink-0">
                <span className="font-extrabold text-[#0A0F1E] text-xs">RF</span>
              </div>
              {/* Welcome text on one line, no wrapping, 14px size (sm is 14px) or 16px (base is 16px) */}
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
                  title={isDemoMode ? "Guest Options" : "My Profile"}
                >
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0D1425] rounded-full z-10 animate-pulse" />
                  {isDemoMode ? (
                    <div className="w-8 h-8 rounded-full bg-[#0E152F] border border-slate-700/60 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase select-none">
                      DE
                    </div>
                  ) : user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={profile.name} 
                      className="w-8 h-8 rounded-full border border-[#00D4FF]/40 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0E152F] border border-[#00D4FF]/40 flex items-center justify-center text-[10px] font-extrabold text-white uppercase select-none">
                      {getInitials(profile.name)}
                    </div>
                  )}
                </button>

                {/* Profile Dropdown / Popup for Mobile */}
                {isProfilePopupOpen && !isDemoMode && (
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
                            Role: {profile.role}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsProfilePopupOpen(false);
                            signOutUser();
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <TaskDashboard />
              </motion.div>
            )}

            {activeTab === "goals" && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-5xl mx-auto py-2"
              >
                <GoalsTab />
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-5xl mx-auto py-2"
              >
                <StatsTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Schedule Assistant Side Panel - Powered by Gemini in Step 4 */}
      {profile && (
        <AICoachPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          tasks={tasks}
          profile={profile}
        />
      )}

      {/* Guest Mode Sign-In CTA Modal */}
      {isGuestPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-[#0D1425] border border-[#00D4FF]/30 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
          >
            {/* Background design glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[#00D4FF]/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-[#0DFFD4]/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-[#0DFFD4]">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  You're exploring as a Guest
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Sign up to save your tasks, track habits, and get personalized AI recommendations.
                </p>
              </div>

              {/* Action and dismiss buttons */}
              <div className="w-full space-y-3 pt-2">
                <button
                  onClick={async () => {
                    setIsGuestPopupOpen(false);
                    await signInWithGoogle();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] text-[#0A0F1E] font-bold text-sm rounded-xl hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  SIGN IN WITH GOOGLE
                </button>

                <button
                  onClick={() => setIsGuestPopupOpen(false)}
                  className="w-full py-2.5 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer"
                >
                  CONTINUE AS GUEST
                </button>
              </div>
            </div>
          </motion.div>
        </div>
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

export default function App() {
  return (
    <AuthProvider>
      <CustomCursor />
      <AppContent />
    </AuthProvider>
  );
}
