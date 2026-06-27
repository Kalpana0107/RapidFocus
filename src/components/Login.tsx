import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "../services/firebase";

export const Login: React.FC = () => {
  const { signInWithGoogle, signInWithDemo } = useAuth();
  const [loading, setLoading] = useState<"google" | "demo" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

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
    <div className="min-h-screen bg-[#faf9f6] text-[#1c1c1c] font-sans md:grid md:grid-cols-[1.2fr_1fr] flex flex-col overflow-y-auto md:overflow-hidden select-none">
      
      {/* Editorial Left Panel */}
      <aside className="relative bg-white p-8 md:p-20 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#1c1c1c]/5 min-h-[300px] md:min-h-screen">
        {/* Border Inset Frame */}
        <div className="absolute inset-4 md:inset-5 border border-[#1c1c1c]/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-1">
          <span className="font-space text-[10px] tracking-[0.2em] text-[#1c1c1c]/50 uppercase">Version 2.0</span>
          <span className="font-space text-[10px] tracking-[0.2em] text-[#1c1c1c]/50 uppercase">Stable Release</span>
        </div>

        <div className="relative z-10 my-8 md:my-0">
          <h1 className="font-serif text-6xl md:text-8xl lg:text-[9rem] font-semibold leading-[0.8] tracking-[-0.06em] italic text-[#1c1c1c]">
            Rapid<br />
            <span className="block ml-6 md:ml-8 lg:ml-10 text-[#d25e5e] transition-colors duration-500">Focus</span>
          </h1>
        </div>

        <div className="relative z-10">
          <p className="max-w-[400px] font-serif text-lg md:text-xl lg:text-2xl italic text-[#1c1c1c]/50 leading-relaxed">
            Turn chaos into clarity, every single day.
          </p>
        </div>

        {/* Rotated Sidebar Stamp */}
        <div className="hidden md:block absolute bottom-12 right-[-50px] transform rotate-[-90deg] font-space text-[10px] tracking-[0.1em] text-[#1c1c1c]/10">
          RapidFocus // 2026
        </div>
      </aside>

      {/* Auth Container Panel */}
      <main className="flex-1 flex items-center justify-center p-8 md:p-20 min-h-[500px] md:min-h-screen relative bg-[#faf9f6]">
        {/* Subtle decorative background detail */}
        <div className="absolute inset-4 md:inset-5 border border-[#1c1c1c]/5 pointer-events-none md:hidden" />
        
        <div className="w-full max-w-[360px] relative z-10">
          
          {/* Header titles */}
          <div className="mb-12">
            <h2 className="font-sans font-light text-3xl tracking-[-0.04em] text-[#1c1c1c]">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-sm text-[#1c1c1c]/50 mt-2 font-light">
              {isSignUp 
                ? "Get started with your smart workspace" 
                : "Sign in to your RapidFocus workspace"}
            </p>
          </div>

          {/* Continue with Google button - Styled beautifully with G logo */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            className="w-full py-3.5 border border-[#1c1c1c]/10 hover:border-[#1c1c1c] bg-transparent text-[#1c1c1c] rounded-none flex items-center justify-center gap-3 text-sm font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm hover:shadow"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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

          {/* HR divider with Space Mono uppercase text */}
          <div className="flex items-center gap-4 my-8 font-space text-[10px] tracking-[0.1em] text-[#1c1c1c]/30">
            <span>EMAIL_AUTH</span>
            <div className="h-[1px] flex-1 bg-[#1c1c1c]/10" />
          </div>

          {/* Interactive Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-6 text-left">
            
            {error && (
              <div className="p-4 border border-[#d25e5e]/30 bg-[#d25e5e]/5 text-[#d25e5e] text-xs font-space tracking-wide leading-relaxed">
                [ERROR] {error}
              </div>
            )}

            <div className="relative">
              <label 
                htmlFor="email-input" 
                className="font-space text-[10px] tracking-[0.1em] text-[#1c1c1c]/50 uppercase mb-1 block"
              >
                Identity / Email
              </label>
              <input 
                id="email-input" 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com" 
                className="w-full bg-transparent border-b border-[#1c1c1c]/10 focus:border-[#1c1c1c] focus:outline-none py-3 text-sm text-[#1c1c1c] placeholder-[#1c1c1c]/25 transition-colors duration-200"
              />
            </div>

            <div className="relative">
              <label 
                htmlFor="password-input" 
                className="font-space text-[10px] tracking-[0.1em] text-[#1c1c1c]/50 uppercase mb-1 block"
              >
                Security / Password
              </label>
              <input 
                id="password-input" 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-transparent border-b border-[#1c1c1c]/10 focus:border-[#1c1c1c] focus:outline-none py-3 text-sm text-[#1c1c1c] placeholder-[#1c1c1c]/25 transition-colors duration-200"
              />
            </div>

            <button 
              id="submit-auth-btn" 
              type="submit" 
              disabled={loading !== null}
              className="w-full bg-[#1c1c1c] hover:bg-[#d25e5e] text-white py-4.5 text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-300 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {loading === "email" 
                ? (isSignUp ? "Creating account..." : "Signing In...") 
                : (isSignUp ? "Create Account" : "Sign In")}
            </button>
          </form>

          {/* Sub Link Toggle Mode */}
          <button 
            id="toggle-auth-mode-btn" 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="w-full text-center mt-5 text-xs text-[#1c1c1c]/50 hover:text-[#1c1c1c] underline cursor-pointer bg-none border-none hover:no-underline font-light transition-colors duration-200"
          >
            {isSignUp 
              ? "Already have an account? Sign In" 
              : "Don't have an account? Create one free"}
          </button>

          {/* Guest Demo Section */}
          <div className="mt-10 pt-8 border-t border-[#1c1c1c]/10">
            <button 
              id="demo-signin-btn" 
              onClick={handleDemoSignIn}
              disabled={loading !== null}
              className="w-full bg-white border border-[#d25e5e] text-[#d25e5e] hover:bg-[#d25e5e] hover:text-white py-3.5 text-xs font-semibold tracking-[0.05em] uppercase transition-all duration-300 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {loading === "demo" ? "Entering..." : "Access Guest Demo"}
            </button>
            <p className="text-[9px] tracking-[0.05em] text-[#1c1c1c]/40 text-center font-space mt-3 uppercase">
              TRY RAPIDFOCUS RIGHT NOW AS A GUEST, PASSWORD-FREE!
            </p>
          </div>

          {/* Footer of card */}
          <footer className="mt-10 pt-5 border-t border-[#1c1c1c]/10">
            <p className="font-space text-[9px] tracking-[0.1em] text-[#1c1c1c]/40 text-center uppercase">
              CREATED FOR STUDENT PRODUCTIVITY
            </p>
          </footer>

        </div>
        
        {/* Absolute Footer Stamp */}
        <div className="absolute bottom-6 right-8 font-space text-[10px] tracking-[0.1em] text-[#1c1c1c]/25 md:hidden">
          RapidFocus // 2026
        </div>
      </main>

    </div>
  );
};
