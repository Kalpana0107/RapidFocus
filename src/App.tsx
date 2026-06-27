import React, { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { CustomCursor } from "./components/CustomCursor";
import { SplashScreen } from "./components/SplashScreen";

const AppContent: React.FC = () => {
  const { user, loading, signInWithDemo } = useAuth();
  const [splash, setSplash] = useState(() => !sessionStorage.getItem("rapidfocus_splash_shown"));
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem("rapidfocus_is_demo") === "true");

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

  // Step 1 — Always show splash first
  if (splash) {
    return (
      <SplashScreen onComplete={() => {
        sessionStorage.setItem("rapidfocus_splash_shown", "true");
        setSplash(false);
      }} />
    );
  }

  // Loading firebase auth state
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

  // Step 2 — If not logged in AND not demo → Landing Page
  if (!user && !demoMode) {
    return (
      <LandingPage 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onDemoMode={() => {
          setDemoMode(true);
          signInWithDemo();
        }} 
      />
    );
  }

  // Step 3 — Dashboard (logged in OR demo mode)
  return (
    <Dashboard 
      user={user} 
      isDemo={demoMode}
      onSignOut={() => {
        setDemoMode(false);
      }}
    />
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
