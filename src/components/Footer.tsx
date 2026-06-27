import React from "react";
import { Github, Linkedin, Twitter } from "lucide-react";

export const Footer: React.FC = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer id="footer" className="w-full bg-[#0A0F1E] border-t border-[#00D4FF]/20 pt-16 pb-8 px-4 sm:px-6 lg:px-8 mt-20 relative overflow-hidden">
      {/* Decorative subtle ambient blue light overlay */}
      <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        
        {/* Column 1: Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#00D4FF] to-[#0DFFD4] rounded-lg flex items-center justify-center font-black text-[#0A0F1E] text-lg shadow-[0_0_15px_rgba(0,212,255,0.3)]">
              RF
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Rapid<span className="text-[#00D4FF]">Focus</span>
            </span>
          </div>
          
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono mt-1">
            "Plan Smart. Focus Fast. Miss Nothing."
          </p>
          
          <p className="text-xs text-slate-400 leading-relaxed mt-2">
            Your AI-powered productivity companion. Beat deadlines, build habits, and stay focused — powered by Gemini AI.
          </p>

          <div className="flex items-center gap-4 mt-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 bg-white/5 hover:bg-[#00D4FF]/20 text-slate-400 hover:text-white rounded-lg transition-all duration-200"
            >
              <Github className="w-4 h-4" />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 bg-white/5 hover:bg-[#00D4FF]/20 text-slate-400 hover:text-white rounded-lg transition-all duration-200"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 bg-white/5 hover:bg-[#00D4FF]/20 text-slate-400 hover:text-white rounded-lg transition-all duration-200"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Column 2: PRODUCT */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-black text-[#00D4FF] tracking-[0.15em] uppercase font-mono">
            PRODUCT
          </h4>
          <ul className="flex flex-col gap-3 text-xs text-slate-400">
            <li>
              <button 
                onClick={() => scrollToSection("features")} 
                className="hover:text-white hover:translate-x-1 transition-all duration-200 text-left"
              >
                Features
              </button>
            </li>
            <li>
              <button 
                onClick={() => scrollToSection("how-it-works")} 
                className="hover:text-white hover:translate-x-1 transition-all duration-200 text-left"
              >
                How it Works
              </button>
            </li>
            <li>
              <button 
                onClick={() => scrollToSection("features")} 
                className="hover:text-white hover:translate-x-1 transition-all duration-200 text-left"
              >
                AI Scheduling
              </button>
            </li>
            <li>
              <button 
                onClick={() => scrollToSection("features")} 
                className="hover:text-white hover:translate-x-1 transition-all duration-200 text-left"
              >
                Focus Timer
              </button>
            </li>
            <li>
              <button 
                onClick={() => scrollToSection("features")} 
                className="hover:text-white hover:translate-x-1 transition-all duration-200 text-left"
              >
                Goals & Habits
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: BUILT WITH */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-black text-[#00D4FF] tracking-[0.15em] uppercase font-mono">
            BUILT WITH
          </h4>
          <ul className="flex flex-col gap-3 text-xs text-slate-400">
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default">
              Google AI Studio
            </li>
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default">
              Gemini 2.0 Flash
            </li>
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default">
              Firebase & Firestore
            </li>
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default">
              React + TypeScript
            </li>
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default">
              Tailwind CSS
            </li>
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default">
              Cloud Run
            </li>
          </ul>
        </div>

        {/* Column 4: HACKATHON */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-black text-[#00D4FF] tracking-[0.15em] uppercase font-mono">
            HACKATHON
          </h4>
          <ul className="flex flex-col gap-3 text-xs text-slate-400">
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default">
              BlockseBlock Hackathon 2026
            </li>
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default">
              Problem Statement 1
            </li>
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default font-semibold text-cyan-400/80">
              "The Last-Minute Life Saver"
            </li>
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-default">
              Submitted: 29th June 2026
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-mono relative z-10">
        <div>
          © 2026 RapidFocus. Built for BlockseBlock Hackathon.
        </div>
        <div>
          Made with 💙 by <span className="text-slate-300 font-bold">Kalpana Naikodi</span> — VESIT Mumbai
        </div>
      </div>
    </footer>
  );
};
