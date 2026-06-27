import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "../services/firebase";
import { Footer } from "./Footer";
import { 
  Menu, 
  X, 
  Github, 
  Sparkles, 
  Brain, 
  Clock, 
  MessageSquare, 
  Calendar, 
  Bell, 
  BarChart, 
  ChevronRight, 
  Play, 
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export const Login: React.FC = () => {
  const { signInWithGoogle, signInWithDemo } = useAuth();
  
  // Auth Form State
  const [loading, setLoading] = useState<"google" | "demo" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Mobile menu control state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading("google");
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Google Authentication was interrupted. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading("demo");
    setError(null);
    try {
      await signInWithDemo();
    } catch (err: any) {
      console.error(err);
      setError("Demo access failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading("email");
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = err?.message || "Authentication failed.";
      if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password. Please try again or create an account.";
      } else if (err?.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already in use. Try signing in instead.";
      } else if (err?.code === "auth/weak-password") {
        friendlyMessage = "Password should be at least 6 characters.";
      } else if (err?.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-100 font-sans overflow-x-hidden selection:bg-[#00D4FF]/30 selection:text-white">
      {/* Inline styles for custom premium elements and animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
        .floating-hero {
          animation: float 5s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .live-dot {
          animation: pulse-dot 1.8s infinite ease-in-out;
        }
      `}</style>

      {/* ====================================================================== */}
      {/* 1. TOP ANNOUNCEMENT BAR */}
      {/* ====================================================================== */}
      <div className="w-full bg-[#030712] border-b border-white/5 py-2 px-4 flex items-center justify-between gap-3 text-xs relative z-50">
        <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
          <span className="relative flex h-2 w-2">
            <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 font-medium">
            🏆 Built for <span className="text-white font-bold">BlockseBlock Hackathon 2026</span>
          </span>
        </div>
        <button 
          onClick={handleDemoSignIn}
          className="hidden sm:flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-[11px] font-black uppercase tracking-wider bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20 hover:bg-cyan-400/20 transition-all duration-150 cursor-pointer"
        >
          Try Demo →
        </button>
      </div>

      {/* ====================================================================== */}
      {/* 2. STICKY NAVBAR */}
      {/* ====================================================================== */}
      <header className="sticky top-0 z-40 w-full bg-[#0A0F1E]/80 backdrop-blur-md border-b border-[#00D4FF]/15 h-16 flex items-center transition-all duration-200">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#00D4FF] to-[#0DFFD4] rounded-lg flex items-center justify-center font-black text-[#0A0F1E] text-lg shadow-[0_0_15px_rgba(0,212,255,0.35)]">
              RF
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Rapid<span className="text-[#00D4FF]">Focus</span>
            </span>
          </div>

          {/* Desktop Navigation Links (15px font) */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-slate-300">
            <button 
              onClick={() => scrollToSection("features")} 
              className="hover:text-white transition duration-150 cursor-pointer text-left"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection("how-it-works")} 
              className="hover:text-white transition duration-150 cursor-pointer text-left"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection("footer")} 
              className="hover:text-white transition duration-150 cursor-pointer text-left"
            >
              About
            </button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-white transition duration-150 flex items-center gap-1.5"
            >
              <Github className="w-4.5 h-4.5" />
            </a>
          </nav>

          {/* Far Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => scrollToSection("auth-section")}
              className="px-4 py-2 text-sm font-bold text-cyan-400 hover:text-white border border-cyan-400/30 hover:border-cyan-400 rounded-xl transition duration-150 cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => scrollToSection("auth-section")}
              className="px-5 py-2 text-sm font-black text-[#0A0F1E] bg-[#00D4FF] hover:bg-cyan-300 rounded-xl transition shadow-[0_0_15px_rgba(0,212,255,0.25)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] flex items-center gap-1 cursor-pointer"
            >
              Get Started →
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Collapse */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden w-full bg-[#0D1425] border-b border-[#00D4FF]/10"
          >
            <div className="px-6 py-6 flex flex-col gap-5 text-base font-semibold">
              <button onClick={() => scrollToSection("features")} className="text-left text-slate-300 hover:text-white">Features</button>
              <button onClick={() => scrollToSection("how-it-works")} className="text-left text-slate-300 hover:text-white">How It Works</button>
              <button onClick={() => scrollToSection("footer")} className="text-left text-slate-300 hover:text-white">About</button>
              <div className="h-[1px] bg-white/5 w-full my-1" />
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => scrollToSection("auth-section")} 
                  className="px-4 py-2.5 text-center text-sm font-bold text-cyan-400 border border-cyan-400/30 rounded-xl"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => scrollToSection("auth-section")} 
                  className="px-4 py-2.5 text-center text-sm font-black text-[#0A0F1E] bg-[#00D4FF] rounded-xl"
                >
                  Get Started →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================== */}
      {/* 3. HERO SECTION */}
      {/* ====================================================================== */}
      <section className="relative w-full py-20 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-[1.1fr_0.9fr] items-center gap-16 relative overflow-hidden">
        {/* Subtle backdrop purple ambient glow */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Hero Left Content */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6 relative z-10">
          
          {/* TOP BADGE */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1425] border border-[#00D4FF]/30 text-xs text-cyan-300 font-semibold shadow-[0_0_15px_rgba(0,212,255,0.05)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Powered by Gemini 2.0 Flash</span>
          </div>

          {/* HEADLINE */}
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] leading-[1.1] font-extrabold tracking-tight text-white">
            Stop Missing Deadlines.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4]">
              Start Achieving Goals.
            </span>
          </h1>

          {/* SUBHEADLINE */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-[580px] leading-relaxed font-light">
            Your AI-powered productivity companion that prioritizes tasks, schedules your day based on your mood, and coaches you to the finish line.
          </p>

          {/* CTA BUTTONS ROW */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
            <button
              onClick={() => scrollToSection("auth-section")}
              className="w-full sm:w-auto px-8 py-4 bg-[#00D4FF] hover:bg-cyan-300 text-[#0A0F1E] font-black text-sm tracking-wider uppercase rounded-xl shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_25px_rgba(0,212,255,0.45)] transition duration-200 cursor-pointer"
            >
              Get Started Free →
            </button>
            <button
              onClick={handleDemoSignIn}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-cyan-400/30 hover:border-cyan-400 text-cyan-400 hover:text-white font-black text-sm tracking-wider uppercase rounded-xl transition duration-200 cursor-pointer"
            >
              Try Demo Mode
            </button>
          </div>

          {/* STATS ROW */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 mt-8 pt-8 border-t border-white/5 w-full text-slate-400 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[#00D4FF]">⚡</span> AI Prioritization
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#00D4FF]">⏱️</span> Focus Timer
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#00D4FF]">🎯</span> Habit Tracking
            </div>
          </div>

        </div>

        {/* Hero Right Visual Mockup (Floating Dashboard Panel) */}
        <div className="w-full relative flex items-center justify-center relative z-10">
          <div className="absolute inset-0 bg-[#00D4FF]/5 rounded-3xl blur-[50px] pointer-events-none translate-y-6" />
          
          {/* Mock Dashboard Preview Container */}
          <div className="floating-hero w-full max-w-md bg-[#0D1425] border border-white/10 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 relative">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00D4FF]/40 to-transparent" />
            
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 tracking-wider">RAPIDFOCUS_CONTROL_SYS</span>
            </div>

            {/* AI Briefing Segment */}
            <div className="bg-cyan-500/5 border border-cyan-500/15 p-3.5 rounded-2xl flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-xs font-black text-cyan-400 tracking-wider uppercase font-mono">Gemini AI Briefing</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-light mt-1">
                Good morning! You have <strong className="text-red-400 font-bold">1 Critical</strong> and <strong className="text-cyan-400 font-semibold">2 High</strong> priority tasks. I recommend focusing on the "Onboarding" first.
              </p>
            </div>

            {/* Mock Task List */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1">TODAY'S WORKLOAD</span>
              
              {/* Task Item 1 */}
              <div className="bg-white/[0.02] border border-red-500/20 p-3 rounded-2xl flex items-center justify-between gap-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500" />
                <div className="flex flex-col gap-0.5 pl-1.5">
                  <span className="text-xs font-bold text-white leading-snug">Complete RapidFocus Onboarding</span>
                  <span className="text-[10px] text-slate-400">Due in 1 hour • Eisenhower Focus</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-[9px] text-red-400 font-black rounded-md tracking-wider uppercase">
                    CRITICAL
                  </span>
                  <div className="flex flex-col items-center justify-center bg-red-500/5 border border-red-500/20 rounded-md w-8 h-8 font-mono">
                    <span className="text-[11px] font-black text-red-400">98</span>
                  </div>
                </div>
              </div>

              {/* Task Item 2 */}
              <div className="bg-white/[0.02] border border-cyan-500/20 p-3 rounded-2xl flex items-center justify-between gap-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-cyan-500" />
                <div className="flex flex-col gap-0.5 pl-1.5">
                  <span className="text-xs font-bold text-white leading-snug">Draft project proposal</span>
                  <span className="text-[10px] text-slate-400">Due tomorrow • Focus blocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-[9px] text-cyan-400 font-black rounded-md tracking-wider uppercase">
                    HIGH
                  </span>
                  <div className="flex flex-col items-center justify-center bg-cyan-500/5 border border-cyan-500/20 rounded-md w-8 h-8 font-mono">
                    <span className="text-[11px] font-black text-cyan-400">84</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam style Focus Timer widget */}
            <div className="bg-[#111827] border border-white/5 p-3.5 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                  <Clock className="w-4 h-4 animate-spin-slow" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-none">Focus Session Active</span>
                  <span className="text-[10px] text-slate-400 mt-1">Exam Mode • Alarms at 20, 10, 5m</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-black text-cyan-400 tracking-wider">24:58</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 4. FEATURES SECTION */}
      {/* ====================================================================== */}
      <section id="features" className="w-full py-20 lg:py-28 bg-[#0D1425]/40 border-y border-white/5 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center flex flex-col items-center gap-3 mb-16">
            <span className="text-xs font-black text-[#00D4FF] tracking-[0.2em] uppercase font-mono">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Everything you need to stay on track
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mt-1 font-light">
              Powered by Google's Gemini AI to rescue you from last-minute deadlines and structure your day beautifully.
            </p>
          </div>

          {/* 3x2 Grid of Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Card 1 */}
            <div className="group bg-[#111827] border border-[#1f2937] hover:border-[#00D4FF]/50 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col gap-4 shadow-lg">
              <span className="text-3xl" role="img" aria-label="AI brain">🧠</span>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00D4FF] transition-colors duration-150">
                AI Task Prioritization
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Gemini AI ranks your tasks using Eisenhower Matrix metrics — so you always know exactly what to work on first without decision paralysis.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-[#111827] border border-[#1f2937] hover:border-[#00D4FF]/50 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col gap-4 shadow-lg">
              <span className="text-3xl" role="img" aria-label="timer">⏱️</span>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00D4FF] transition-colors duration-150">
                Exam-Style Focus Timer
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Set a timer and get notified every 30 mins, at 20, 10, and 5 minutes left — mimicking exam hall pressure to drive massive urgency.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-[#111827] border border-[#1f2937] hover:border-[#00D4FF]/50 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col gap-4 shadow-lg">
              <span className="text-3xl" role="img" aria-label="chat bubble">💬</span>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00D4FF] transition-colors duration-150">
                AI Coach Chat
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Ask your AI coach anything about your tasks, schedule, or habits. Offers personalized strategies and answers 24/7.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group bg-[#111827] border border-[#1f2937] hover:border-[#00D4FF]/50 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col gap-4 shadow-lg">
              <span className="text-3xl" role="img" aria-label="smiley">😊</span>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00D4FF] transition-colors duration-150">
                Mood-Based Scheduling
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Tell AI how you feel about each task — it dynamically schedules your daily blocks around your physical & mental energy levels.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group bg-[#111827] border border-[#1f2937] hover:border-[#00D4FF]/50 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col gap-4 shadow-lg">
              <span className="text-3xl" role="img" aria-label="bell">🔔</span>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00D4FF] transition-colors duration-150">
                Smart Reminders
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Never lose track with browser notification triggers when deadlines approach. Work peacefully knowing we'll nudge you.
              </p>
            </div>

            {/* Card 6 */}
            <div className="group bg-[#111827] border border-[#1f2937] hover:border-[#00D4FF]/50 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col gap-4 shadow-lg">
              <span className="text-3xl" role="img" aria-label="charts">📊</span>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00D4FF] transition-colors duration-150">
                Productivity Analytics
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Visualize your productive times, completion percentage, and weekly streak progress inside clean, high-contrast charts.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================================== */}
      {/* 5. HOW IT WORKS SECTION */}
      {/* ====================================================================== */}
      <section id="how-it-works" className="w-full py-20 lg:py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="text-center flex flex-col items-center gap-3 mb-20">
          <span className="text-xs font-black text-[#00D4FF] tracking-[0.2em] uppercase font-mono">
            Onboarding Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Get productive in 3 simple steps
          </h2>
        </div>

        {/* 3 Step Row with Dotted Connection Line */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          
          {/* Background Connecting Dotted Track (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] border-t border-dashed border-[#00D4FF]/25 -z-10" />

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center gap-4 group">
            <div className="w-20 h-20 bg-[#0D1425] border border-[#00D4FF]/25 group-hover:border-[#00D4FF] rounded-full flex items-center justify-center font-black text-3xl text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.25)] transition duration-300">
              1
            </div>
            <h3 className="text-lg font-bold text-white mt-2">Sign In</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] font-light">
              Create your free account with Google in one single click, or continue password-free inside Demo Mode instantly.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center gap-4 group">
            <div className="w-20 h-20 bg-[#0D1425] border border-[#00D4FF]/25 group-hover:border-[#00D4FF] rounded-full flex items-center justify-center font-black text-3xl text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.25)] transition duration-300">
              2
            </div>
            <h3 className="text-lg font-bold text-white mt-2">Add Your Tasks</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] font-light">
              Simply input tasks with deadlines and quick mood labels. Let Gemini instantly construct a strategic priority hierarchy.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center gap-4 group">
            <div className="w-20 h-20 bg-[#0D1425] border border-[#00D4FF]/25 group-hover:border-[#00D4FF] rounded-full flex items-center justify-center font-black text-3xl text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.25)] transition duration-300">
              3
            </div>
            <h3 className="text-lg font-bold text-white mt-2">Stay Focused</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] font-light">
              Utilize the Exam Focus Timer, our friendly Chat Coach, and approach milestones step-by-step to achieve high performance.
            </p>
          </div>

        </div>
      </section>

      {/* ====================================================================== */}
      {/* 6. LOGIN/SIGNUP CARD SECTION */}
      {/* ====================================================================== */}
      <section id="auth-section" className="w-full py-20 lg:py-28 bg-[#0D1425]/30 border-t border-white/5 scroll-mt-16 flex flex-col items-center relative overflow-hidden">
        {/* Subtle decorative target lights */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full px-4 relative z-10">
          
          {/* Card Titles */}
          <div className="text-center flex flex-col gap-2 mb-10">
            <span className="text-xs font-black text-[#00D4FF] tracking-[0.2em] uppercase font-mono">
              Workspace Access
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Start for free today
            </h2>
            <p className="text-xs text-slate-400 font-light">
              No credit card required. Sync across all devices safely.
            </p>
          </div>

          {/* Original Login/Auth Card inside beautiful glow wrapper */}
          <div className="bg-[#0D1425] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4FF] via-[#0DFFD4] to-transparent" />
            
            {/* Login Mode Titles */}
            <div className="mb-6">
              <h3 className="text-xl font-black text-white">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 font-light">
                {isSignUp 
                  ? "Initialize your cloud workspace in seconds" 
                  : "Sign in to resume tracking your goals"}
              </p>
            </div>

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading !== null}
              className="w-full py-3 border border-white/10 hover:border-[#00D4FF]/50 hover:bg-[#00D4FF]/5 bg-transparent text-white rounded-xl flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <svg className="w-4.5 h-4.5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Email Divider */}
            <div className="flex items-center gap-4 my-6 text-[10px] tracking-[0.15em] text-slate-500 font-mono font-bold uppercase">
              <span className="bg-[#0D1425] px-1 relative z-10">EMAIL SECURITY GATEWAY</span>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
              
              {error && (
                <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs rounded-xl font-mono leading-relaxed">
                  ⚠️ [ERROR]: {error}
                </div>
              )}

              <div className="space-y-1">
                <label 
                  htmlFor="email-input" 
                  className="font-mono text-[9px] tracking-[0.15em] text-slate-400 uppercase font-black"
                >
                  Email Address
                </label>
                <input 
                  id="email-input" 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com" 
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-[#00D4FF]/60 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors duration-150"
                />
              </div>

              <div className="space-y-1">
                <label 
                  htmlFor="password-input" 
                  className="font-mono text-[9px] tracking-[0.15em] text-slate-400 uppercase font-black"
                >
                  Secret Password
                </label>
                <input 
                  id="password-input" 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-[#00D4FF]/60 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors duration-150"
                />
              </div>

              <button 
                id="submit-auth-btn" 
                type="submit" 
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-cyan-500 to-[#00D4FF] hover:from-cyan-600 hover:to-cyan-500 text-[#0A0F1E] py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading === "email" 
                  ? (isSignUp ? "Creating account..." : "Signing In...") 
                  : (isSignUp ? "Create Account" : "Sign In")}
              </button>
            </form>

            {/* Toggle Mode */}
            <button 
              id="toggle-auth-mode-btn" 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="w-full text-center mt-4 text-xs text-slate-400 hover:text-white underline cursor-pointer bg-none border-none transition-colors font-light"
            >
              {isSignUp 
                ? "Already have an account? Sign In" 
                : "Don't have an account? Create one free"}
            </button>

            {/* Direct Guest Access */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <button 
                id="demo-signin-btn" 
                onClick={handleDemoSignIn}
                disabled={loading !== null}
                className="w-full bg-white/5 hover:bg-[#00D4FF]/10 border border-white/10 hover:border-[#00D4FF]/30 text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                {loading === "demo" ? "Launching Sandbox..." : "🚀 Launch Instant Demo Mode"}
              </button>
              <p className="text-[9px] tracking-wider text-slate-500 text-center font-mono mt-3 uppercase">
                Explore entire interface password-free with local sandbox
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 7. FOOTER */}
      {/* ====================================================================== */}
      <Footer />
    </div>
  );
};
