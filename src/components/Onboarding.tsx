import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { motion } from "motion/react";
import { UserRole } from "../types";
import { GraduationCap, Briefcase, Award, ArrowRight, User } from "lucide-react";

export const Onboarding: React.FC = () => {
  const { user, saveProfile } = useAuth();
  const [name, setName] = useState(user?.displayName || "Alpha Planner");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError("Please choose your role to personalize your workspace.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveProfile(name, selectedRole);
    } catch (err: any) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const roles: { role: UserRole; title: string; desc: string; icon: any }[] = [
    {
      role: "Student",
      title: "Academic / Scholar",
      desc: "Optimize exam prep, papers, and assignment pile-ups.",
      icon: GraduationCap,
    },
    {
      role: "Professional",
      title: "Team / Corporate Lead",
      desc: "Secure work sprints, reports, slide decks, and operations.",
      icon: Briefcase,
    },
    {
      role: "Entrepreneur",
      title: "Founder / Innovator",
      desc: "Keep up with investor briefs, milestones, pitches, and product releases.",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#0A0F1E] overflow-hidden">
      {/* Decorative Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      {/* Dynamic light bursts */}
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-[#00D4FF]/5 rounded-full filter blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass p-8 md:p-10 rounded-3xl glow-shadow relative">
          <div className="absolute top-0 right-10 left-10 h-[2px] bg-gradient-to-r from-transparent via-[#0DFFD4]/40 to-transparent" />

          <h1 className="text-3xl font-extrabold text-white text-center mb-1">
            Set Up Your Profile
          </h1>
          <p className="text-gray-400 text-xs font-mono tracking-widest text-center uppercase mb-8">
            Your personalized dashboard
          </p>

          {error && (
            <div className="p-3 mb-6 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono tracking-wider uppercase text-gray-400 block">
                Enter your name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="w-4 h-4 text-[#00D4FF]" />
                </span>
                <input
                  type="text"
                  id="onboarding-name-input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alice Vance"
                  className="w-full pl-10 pr-4 py-3 bg-[#0E152F] border border-white/5 rounded-xl focus:border-[#00D4FF] focus:outline-none text-sm text-white placeholder-gray-600 transition"
                />
              </div>
            </div>

            {/* Role Picker */}
            <div className="space-y-3">
              <label className="text-xs font-mono tracking-wider uppercase text-gray-400 block">
                Choose your main focus
              </label>
              
              <div className="grid grid-cols-1 gap-3.5">
                {roles.map(({ role, title, desc, icon: Icon }) => {
                  const isSelected = selectedRole === role;
                  return (
                    <div
                      key={role}
                      id={`role-btn-${role.toLowerCase()}`}
                      onClick={() => {
                        setSelectedRole(role);
                        setError(null);
                      }}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-4 text-left border task-card-hover ${
                        isSelected
                          ? "border-[#00D4FF] bg-[#00D4FF]/5 shadow-lg shadow-[#00D4FF]/5 font-medium"
                          : "border-white/5 bg-[#0A0F1E] hover:border-white/10 hover:bg-[#0F162F]"
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected 
                          ? "bg-[#00D4FF]/20 text-[#00D4FF]" 
                          : "bg-white/5 text-gray-400"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white">{title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? "border-[#00D4FF]" : "border-gray-600"
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Launch Button */}
            <button
              type="submit"
              id="confirm-onboarding-btn"
              disabled={saving}
              className="w-full mt-6 py-4 px-4 bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] text-[#0A0F1E] font-bold rounded-xl text-sm transition-all tracking-wider uppercase hover:shadow-lg hover:shadow-[#00D4FF]/10 hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? "Setting things up..." : "Let's Go!"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
