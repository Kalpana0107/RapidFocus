import React, { useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Total duration of cinematic sequence is 3.8s
    const timer = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const name = "RAPID FOCUS";

  return (
    <div className="fixed inset-0 bg-[#000000] z-[9999] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Injecting CSS Keyframe Animations directly to keep it self-contained & bulletproof */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes logoZoom {
          from { transform: scale(0.3); opacity: 0; filter: drop-shadow(0 0 0px rgba(0, 212, 255, 0)); }
          to { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.6)); }
        }

        @keyframes letterSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes flashEffect {
          0% { opacity: 0; }
          50% { opacity: 1; bg-color: rgba(255, 255, 255, 0.95); }
          100% { opacity: 0; }
        }

        @keyframes zoomOutFade {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(1.15); opacity: 0; }
        }

        .animate-logo {
          animation: logoZoom 1.0s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
        }

        .animate-tagline {
          animation: fadeIn 0.5s ease-out 2.5s both;
        }

        .animate-flash {
          animation: flashEffect 0.3s ease-out 3.0s both;
        }

        .animate-splash-container {
          animation: zoomOutFade 0.5s cubic-bezier(0.7, 0, 0.3, 1) 3.3s both;
        }
      `}} />

      {/* Main Animated Wrapper */}
      <div className="animate-splash-container flex flex-col items-center justify-center text-center px-4">
        
        {/* STEP 2: RF Logo Block with glowing effect */}
        <div className="animate-logo mb-8 relative">
          {/* Cyan core glow */}
          <div className="absolute inset-0 bg-[#00D4FF]/30 rounded-2xl filter blur-xl scale-125 opacity-75 animate-pulse" style={{ animationDuration: "3s" }} />
          
          {/* Main geometric logo block */}
          <div className="relative w-20 h-20 bg-gradient-to-tr from-[#00D4FF] to-[#0DFFD4] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.4)] border border-[#00D4FF]/20">
            <span className="font-extrabold text-[#0A0F1E] text-3xl tracking-tighter select-none font-sans">RF</span>
          </div>
        </div>

        {/* STEP 3: Brand Name Characters Sliding Up */}
        <div className="flex items-center justify-center gap-1.5 md:gap-2.5 mb-3 select-none">
          {name.split("").map((char, index) => {
            if (char === " ") {
              return <span key={index} className="w-2.5 md:w-3.5" />;
            }
            return (
              <span
                key={index}
                className="inline-block font-sans font-black text-2xl md:text-4xl tracking-wider text-white"
                style={{
                  textShadow: "0 0 12px rgba(0, 212, 255, 0.5)",
                  animation: "letterSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
                  animationDelay: `${1.5 + index * 0.05}s`
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* STEP 4: Cinematic Tagline Fades In */}
        <p className="animate-tagline font-sans font-bold text-[9px] md:text-xs tracking-[0.25em] text-[#0DFFD4] uppercase select-none opacity-80 mt-1 max-w-xs md:max-w-md leading-relaxed">
          PLAN SMART. FOCUS FAST. MISS NOTHING.
        </p>

      </div>

      {/* STEP 5: Dramatic White/Cyan Cinematic Flash Overlay */}
      <div className="animate-flash absolute inset-0 bg-white z-[99999] pointer-events-none" />

    </div>
  );
};
