import React, { useState, useEffect, useRef } from "react";
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
  CheckCircle2,
  Sun,
  Moon
} from "lucide-react";

interface LoginProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const Login: React.FC<LoginProps> = ({ theme, toggleTheme }) => {
  const { signInWithGoogle, signInWithDemo } = useAuth();
  
  // Auth Form State
  const [loading, setLoading] = useState<"google" | "demo" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Mobile menu control state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Preview section intersection observer
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsPreviewVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (previewRef.current) {
      observer.observe(previewRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

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
        @keyframes float-preview {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .floating-preview {
          animation: float-preview 4s ease-in-out infinite;
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
            🏆 Built for <span className="text-white font-bold">Vibe2Ship Hackathon 2026</span>
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
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white transition duration-150 cursor-pointer bg-slate-900/50 border border-white/5 rounded-xl flex items-center justify-center hover:bg-slate-900"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="w-4 h-4 text-[#00D4FF]" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

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
              <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
                <button 
                  onClick={() => scrollToSection("auth-section")} 
                  className="px-4 py-2.5 text-center text-sm font-bold text-cyan-400 border border-cyan-400/30 rounded-xl"
                >
                  Sign In
                </button>
                <button
                  onClick={toggleTheme}
                  className="p-2.5 text-slate-400 hover:text-white transition duration-150 cursor-pointer bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center"
                  title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                >
                  {theme === "light" ? <Moon className="w-5 h-5 text-[#00D4FF]" /> : <Sun className="w-5 h-5 text-amber-400" />}
                </button>
              </div>
              <button 
                onClick={() => scrollToSection("auth-section")} 
                className="px-4 py-2.5 text-center text-sm font-black text-[#0A0F1E] bg-[#00D4FF] rounded-xl"
              >
                Get Started →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================== */}
      {/* 3. HERO SECTION */}
      {/* ====================================================================== */}
      <section id="auth-section" className="relative w-full py-20 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-[1.1fr_0.9fr] items-center gap-16 relative overflow-hidden">
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

        {/* Hero Right Side: Floating Login Card */}
        <div className="w-full relative flex items-center justify-center lg:justify-end relative z-10">
          <div className="absolute inset-0 bg-[#00D4FF]/5 rounded-3xl blur-[50px] pointer-events-none translate-y-6" />
          
          <div 
            className="floating-hero w-full md:w-[420px] bg-[#111827] border border-[#00D4FF]/20 rounded-[20px] p-8 flex flex-col gap-5 relative z-10 text-left"
            style={{ boxShadow: "0 0 60px rgba(0,212,255,0.15)" }}
          >
            {/* Header Content */}
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Get Started Free
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Join thousands staying on track
              </p>
            </div>

            {/* Divider Line */}
            <div className="h-[1px] bg-white/10 w-full" />

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading !== null}
              className="w-full py-3 bg-white hover:bg-slate-100 text-[#0A0F1E] rounded-xl flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
              <span className="text-slate-900 font-bold">Continue with Google</span>
            </button>

            {/* OR Divider */}
            <div className="flex items-center gap-4 text-[10px] tracking-[0.15em] text-slate-500 font-mono font-bold uppercase my-1">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span>OR</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {error && (
                <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs rounded-xl font-mono leading-relaxed text-left">
                  ⚠️ [ERROR]: {error}
                </div>
              )}

              <div className="space-y-1 text-left">
                <label 
                  htmlFor="hero-email-input" 
                  className="font-mono text-[9px] tracking-[0.15em] text-slate-400 uppercase font-black"
                >
                  Email Address
                </label>
                <input 
                  id="hero-email-input" 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com" 
                  className="w-full bg-[#1e293b]/40 border border-white/10 focus:border-[#00D4FF]/60 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors duration-150"
                />
              </div>

              <div className="space-y-1 text-left">
                <label 
                  htmlFor="hero-password-input" 
                  className="font-mono text-[9px] tracking-[0.15em] text-slate-400 uppercase font-black"
                >
                  Password
                </label>
                <input 
                  id="hero-password-input" 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#1e293b]/40 border border-white/10 focus:border-[#00D4FF]/60 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors duration-150"
                />
              </div>

              {/* Sign In / Create Account button (cyan) */}
              <button 
                id="hero-submit-auth-btn" 
                type="submit" 
                disabled={loading !== null}
                className="w-full bg-[#00D4FF] hover:bg-cyan-300 text-[#0A0F1E] py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading === "email" 
                  ? (isSignUp ? "Creating account..." : "Signing In...") 
                  : (isSignUp ? "Create Account" : "Sign In")}
              </button>
            </form>

            {/* Toggle: "Don't have account? Create one free" */}
            <button 
              id="hero-toggle-auth-mode-btn" 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white underline cursor-pointer bg-none border-none transition-colors font-light"
            >
              {isSignUp 
                ? "Already have an account? Sign In" 
                : "Don't have account? Create one free"}
            </button>

            {/* Small text at bottom */}
            <div className="text-center text-[11px] text-[#00D4FF]/80 font-mono mt-1">
              ✨ No credit card required • Free forever
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* DASHBOARD PREVIEW SECTION */}
      {/* ====================================================================== */}
      <section 
        ref={previewRef}
        className={`hidden md:block w-full py-20 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-200 ${
          theme === "light" 
            ? "bg-[#F8FAFC] border-slate-200 text-slate-900" 
            : "bg-[#0d1117] border-white/5 text-slate-100"
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-4 mb-12">
          {/* Small Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-xs font-bold text-cyan-400">
            <span>✨ See it in action</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-[36px] font-extrabold tracking-tight">
            Your productivity command center
          </h2>

          {/* Subtext */}
          <p className="text-sm text-slate-400 max-w-lg font-light leading-relaxed">
            Everything you need to beat deadlines in one beautiful dashboard
          </p>
        </div>

        {/* MOCKUP DISPLAY */}
        <div 
          className={`max-w-4xl mx-auto transition-all duration-1000 ease-out transform ${
            isPreviewVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[30px]"
          }`}
        >
          {/* Browser-style Frame */}
          <div 
            className="w-full bg-[#0D1425] border border-[#00D4FF]/30 rounded-2xl overflow-hidden shadow-2xl floating-preview"
            style={{ boxShadow: "0 0 80px rgba(0,212,255,0.2)" }}
          >
            {/* Browser Chrome Header */}
            <div className="bg-[#111827] px-4 py-3 border-b border-white/5 flex items-center justify-between">
              {/* 3 Colored Dots */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              {/* Fake URL Bar */}
              <div className="bg-slate-900/60 border border-white/5 text-[11px] font-mono text-slate-400 py-1 px-8 rounded-lg w-1/2 max-w-[320px] text-center truncate">
                rapidfocus.app/dashboard
              </div>
              <div className="w-12" /> {/* Spacing spacer */}
            </div>

            {/* Simulated Dashboard Content */}
            <div className="grid grid-cols-[80px_1fr] bg-[#0A0F1E] min-h-[500px]">
              
              {/* LEFT PANEL (sidebar simulation) */}
              <div className="bg-[#0D1425] border-r border-white/5 py-6 flex flex-col items-center gap-8">
                {/* RF Logo */}
                <div className="w-8 h-8 bg-gradient-to-br from-[#00D4FF] to-[#0DFFD4] rounded-lg flex items-center justify-center font-black text-[#0A0F1E] text-sm">
                  RF
                </div>
                {/* 4 Icon Dots Stacked */}
                <div className="flex flex-col gap-6 mt-4">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400/90 shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-700 hover:bg-slate-600 transition" />
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-700 hover:bg-slate-600 transition" />
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-700 hover:bg-slate-600 transition" />
                </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="p-6 flex flex-col gap-5 text-left">
                {/* Top Bar inside main content */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                    My Dashboard
                  </h3>
                  <button className="px-3 py-1.5 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/30 text-[#00D4FF] text-[10px] font-bold rounded-lg uppercase tracking-wider transition">
                    + Add New Task
                  </button>
                </div>

                {/* DAILY BRIEFING Card */}
                <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-4 flex flex-col gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-400 text-xs">✨</span>
                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest font-mono">
                      Daily Briefing
                    </h4>
                  </div>
                  <p className="text-xs font-bold text-white leading-relaxed mt-0.5">
                    ✅ All Clear for Today
                  </p>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside mt-1 font-light">
                    <li>You have 2 tasks due this week</li>
                    <li>Your most productive time is 9-11am</li>
                  </ul>
                </div>

                {/* Two Column Grid below */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  {/* LEFT — URGENCY METER card */}
                  <div className="bg-[#0D1425] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1.5">
                      Urgency Meter
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-red-400 font-bold">LATE TASKS</span>
                        <span className="text-slate-400">0 Tasks</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full w-0" />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-400 font-bold">DUE WITHIN 24H</span>
                        <span className="text-slate-400">1 Task</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[30%]" />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-bold">ON TRACK</span>
                        <span className="text-slate-400">3 Tasks</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[75%]" />
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Overall Progress</span>
                      <span className="text-[#00D4FF] font-bold">60% Complete</span>
                    </div>
                  </div>

                  {/* RIGHT — MY TASKS */}
                  <div className="bg-[#0D1425] border border-white/5 rounded-xl p-4 flex flex-col gap-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1.5">
                      My Tasks
                    </h4>

                    {/* Task 1 */}
                    <div className="bg-slate-900/50 border border-red-500/20 rounded-lg p-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-white truncate">Finish project report</span>
                        <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/30 text-[8px] text-red-400 font-black rounded uppercase">
                          CRITICAL
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span>WORK</span>
                        <span>Today, 6:00 PM</span>
                      </div>
                      <p className="text-[9px] text-cyan-400/90 font-mono mt-0.5">
                        💡 "Highest urgency — deadline today"
                      </p>
                    </div>

                    {/* Task 2 */}
                    <div className="bg-slate-900/50 border border-amber-500/20 rounded-lg p-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-white truncate">Team standup meeting</span>
                        <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-[8px] text-amber-400 font-black rounded uppercase">
                          HIGH
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span>WORK</span>
                        <span>Tomorrow, 10:00 AM</span>
                      </div>
                    </div>

                    {/* Task 3 */}
                    <div className="bg-slate-900/50 border border-[#00D4FF]/20 rounded-lg p-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-white truncate">Review quarterly goals</span>
                        <span className="px-1.5 py-0.5 bg-cyan-400/10 border border-cyan-400/30 text-[8px] text-cyan-400 font-black rounded uppercase">
                          MEDIUM
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span>PERSONAL</span>
                        <span>In 3 days</span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* FOCUS TIMER preview at bottom */}
                <div className="mt-2 bg-[#111827] border border-white/5 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 text-xs">⏱</span>
                    <span className="text-[11px] font-bold text-white">Focus Session Active</span>
                  </div>
                  <span className="text-xs font-mono font-black text-cyan-400 tracking-wider">
                    24:58
                  </span>
                </div>

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
      {/* 7. FOOTER */}
      {/* ====================================================================== */}
      <Footer />
    </div>
  );
};
