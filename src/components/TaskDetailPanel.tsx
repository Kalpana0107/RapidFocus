import React, { useState, useEffect, useRef } from "react";
import { Task } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Tag,
  Activity
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

// Types for in-app popups
interface ExamPopup {
  id: string;
  message: string;
  urgency: "cyan" | "orange" | "pulse-red" | "shake-red";
}

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onToggleComplete: (taskId: string, completed: boolean) => Promise<void>;
}

// Web Audio API beep sound utility as requested
const playBeep = (frequency = 440, duration = 200) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001, ctx.currentTime + duration / 1000
    );
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (err) {
    console.warn("Could not play Web Audio beep:", err);
  }
};

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  onClose,
  onUpdateTask,
  onToggleComplete
}) => {
  const [timerMode, setTimerMode] = useState<"stopwatch" | "timer">("stopwatch");
  
  // Timer running states
  const [isRunning, setIsRunning] = useState(false);
  
  // Stopwatch seconds spent (starts at 0)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  
  // Countdown Timer settings
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(25); // default 25m Pomodoro
  const [countdownSeconds, setCountdownSeconds] = useState(25 * 60);
  const [initialCountdownSeconds, setInitialCountdownSeconds] = useState(25 * 60);

  // Keep track of which seconds remaining we already alerted on to prevent multi-fires
  const alertedSecondsRef = useRef<Set<number>>(new Set());

  // Popup toasts state
  const [popups, setPopups] = useState<ExamPopup[]>([]);

  // Track if countdown is configured/started or in setup mode
  const [isTimerConfigured, setIsTimerConfigured] = useState(false);

  // We accumulate total seconds spent across pauses
  const totalSecondsSpentRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);

  const [isCalDropdownOpen, setIsCalDropdownOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { isDark } = useTheme();

  // Reset timer on task change
  useEffect(() => {
    setIsRunning(false);
    setStopwatchSeconds(task.timeSpent || 0);
    setCountdownSeconds(inputHours * 60 * 60 + inputMinutes * 60);
    setIsTimerConfigured(false);
    alertedSecondsRef.current.clear();
    setPopups([]);
    totalSecondsSpentRef.current = task.timeSpent || 0;
    lastTickRef.current = null;
    setIsCalDropdownOpen(false);
    setIsCopied(false);
  }, [task.id, task.completed, task.timeSpent]);

  // Handle ticking
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      lastTickRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.round((now - (lastTickRef.current || now)) / 1000) || 1;
        lastTickRef.current = now;

        if (timerMode === "stopwatch") {
          setStopwatchSeconds(prev => {
            const next = prev + delta;
            totalSecondsSpentRef.current += delta;
            return next;
          });
        } else {
          // Timer Mode
          setCountdownSeconds(prev => {
            const next = Math.max(0, prev - delta);
            totalSecondsSpentRef.current += Math.min(prev, delta);
            
            // Check for Exam Hall alert triggers
            triggerCountdownAlerts(next);

            if (next === 0) {
              setIsRunning(false);
              playBeep(880, 500); // long beep at end
            }
            return next;
          });
        }
      }, 1000);
    } else {
      lastTickRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode]);

  // Synchronize countdown configuration
  const handleApplyTimerConfig = () => {
    const totalSec = inputHours * 3600 + inputMinutes * 60;
    setCountdownSeconds(totalSec);
    setInitialCountdownSeconds(totalSec);
    setIsTimerConfigured(true);
    alertedSecondsRef.current.clear();
  };

  // Add Toast helper
  const addToastPopup = (message: string, urgency: ExamPopup["urgency"], soundFreq = 440) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newPopup = { id, message, urgency };
    setPopups(prev => [newPopup, ...prev]);
    playBeep(soundFreq, 250);

    // Auto dismiss in 5s
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 5000);
  };

  // Exam-Pattern Alert Trigger System
  const triggerCountdownAlerts = (remSeconds: number) => {
    if (alertedSecondsRef.current.has(remSeconds)) return;
    alertedSecondsRef.current.add(remSeconds);

    const minutesLeft = Math.floor(remSeconds / 60);

    // 0:00:00 -> Time's up
    if (remSeconds === 0) {
      addToastPopup("🎯 Time's up! Did you complete the task?", "shake-red", 880);
      return;
    }

    // 5 minutes remaining
    if (remSeconds === 300) {
      addToastPopup("🚨 5 minutes remaining! Finish up now!", "shake-red", 880);
      return;
    }

    // 10 minutes remaining
    if (remSeconds === 600) {
      addToastPopup("🚨 Only 10 minutes left! Final stretch!", "pulse-red", 880);
      return;
    }

    // 20 minutes remaining
    if (remSeconds === 1200) {
      addToastPopup("⚡ 20 minutes left — start wrapping up!", "orange", 440);
      return;
    }

    // 30 minutes remaining
    if (remSeconds === 1800) {
      addToastPopup("🔔 Only 30 minutes left!", "orange", 440);
      return;
    }

    // Every 30 minutes interval countdown above 30 mins
    if (remSeconds > 1800 && remSeconds % 1800 === 0) {
      const hoursRemaining = remSeconds / 3600;
      let msg = "";
      if (remSeconds % 3600 === 0) {
        if (remSeconds === 3600) {
          msg = "⏰ 1 hour remaining — stay focused!";
        } else {
          msg = `⏰ ${hoursRemaining} hours remaining — keep going!`;
        }
      } else {
        msg = `⏰ ${hoursRemaining.toFixed(1)} hours remaining!`;
      }
      addToastPopup(msg, "cyan", 440);
    }
  };

  // Formatting utility for time display: HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const hStr = hrs.toString().padStart(2, "0");
    const mStr = mins.toString().padStart(2, "0");
    const sStr = secs.toString().padStart(2, "0");
    
    return `${hStr}:${mStr}:${sStr}`;
  };

  // Determine colors based on remaining seconds
  const getTimerStyles = () => {
    if (timerMode === "stopwatch") {
      return {
        colorClass: isDark ? "text-[#00D4FF]" : "text-[#0891B2]",
        glowClass: isDark ? "shadow-[0_0_20px_rgba(0,212,255,0.15)] border-[#00D4FF]/20" : "shadow-[0_0_20px_rgba(8,145,178,0.15)] border-[#BAE6FD]",
        pulseClass: ""
      };
    }

    // Countdown Timer mode color levels
    if (countdownSeconds <= 600) {
      // 10 minutes or less: Red + pulsing
      return {
        colorClass: isDark ? "text-[#FF4444]" : "text-red-600",
        glowClass: isDark ? "shadow-[0_0_30px_rgba(255,68,68,0.3)] border-[#FF4444]/45 bg-red-950/20" : "shadow-[0_0_30px_rgba(239,68,68,0.3)] border-red-300 bg-red-50",
        pulseClass: "animate-pulse duration-1000"
      };
    }
    if (countdownSeconds <= 1800) {
      // 30 minutes or less: Orange
      return {
        colorClass: isDark ? "text-[#FFA500]" : "text-orange-600",
        glowClass: isDark ? "shadow-[0_0_25px_rgba(255,165,0,0.2)] border-[#FFA500]/30 bg-amber-950/10" : "shadow-[0_0_25px_rgba(249,115,22,0.2)] border-orange-300 bg-orange-50",
        pulseClass: ""
      };
    }
    // Normal: Cyan
    return {
      colorClass: isDark ? "text-[#00D4FF]" : "text-[#0891B2]",
      glowClass: isDark ? "shadow-[0_0_20px_rgba(0,212,255,0.15)] border-[#00D4FF]/20 bg-slate-950/40" : "shadow-[0_0_20px_rgba(8,145,178,0.15)] border-[#BAE6FD] bg-[#F8FAFF]",
      pulseClass: ""
    };
  };

  const timerStyles = getTimerStyles();

  // Complete task and save to Firestore
  const handleMarkComplete = async () => {
    setIsRunning(false);
    
    const timeSpent = totalSecondsSpentRef.current;
    const completedAt = new Date().toISOString();
    
    // Check if completed before deadline
    let wasOnTime = true;
    if (task.deadline) {
      const deadlineTime = new Date(task.deadline).getTime();
      wasOnTime = Date.now() <= deadlineTime;
    }

    // Save directly to Firestore via updating task fields
    await onUpdateTask(task.id, {
      completed: true,
      completedAt,
      timeSpent,
      timerMode,
      wasOnTime
    });

    // Close panel
    onClose();
  };

  const formatCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const getEventTimes = () => {
    const start = new Date();
    let end = new Date(task.deadline!);
    if (isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour after start
    }
    return { start, end };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-md ${isDark ? 'bg-black/75' : 'bg-slate-900/40'}`}
      />

      {/* Floating Exam Popup Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {popups.map(p => {
            let borderStyle = isDark ? "border-l-4 border-l-[#00D4FF]" : "border-l-4 border-l-[#0891B2]";
            let bgStyle = isDark ? "bg-[#0A101E]/95 border border-white/5 text-white" : "bg-white border-[#E2E8F0] text-[#0F172A]";
            let animStyle = {};

            if (p.urgency === "orange") {
              borderStyle = "border-l-4 border-l-[#FFA500]";
            } else if (p.urgency === "pulse-red") {
              borderStyle = "border-l-4 border-l-[#FF4444]";
              bgStyle = isDark ? "bg-[#180A0A]/95 border border-[#FF4444]/20 animate-pulse duration-1000 text-white" : "bg-red-50 border-red-200 animate-pulse duration-1000 text-red-900";
            } else if (p.urgency === "shake-red") {
              borderStyle = "border-l-4 border-l-[#FF4444]";
              bgStyle = isDark ? "bg-[#180A0A]/95 border border-[#FF4444]/30 text-white" : "bg-red-50 border-red-300 text-red-900";
              animStyle = {
                x: [0, -6, 6, -6, 6, 0],
                transition: { duration: 0.4 }
              };
            }

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1, ...animStyle }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className={`p-4 rounded-xl shadow-xl flex items-center justify-between gap-3 backdrop-blur-md pointer-events-auto ${borderStyle} ${bgStyle}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-sm font-sans font-medium leading-normal">{p.message}</span>
                </div>
                <button 
                  onClick={() => setPopups(prev => prev.filter(pop => pop.id !== p.id))}
                  className={`p-1 rounded cursor-pointer transition ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detail panel container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full max-w-2xl border rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#0B1120] border-white/10' : 'bg-white border-[#E2E8F0]'
        }`}
      >
        {/* Header Block */}
        <div className={`p-6 border-b flex items-start justify-between ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-[#F8FAFF] border-[#E2E8F0]'}`}>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded border text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'bg-[#0DFFD4]/10 border-[#0DFFD4]/15 text-[#0DFFD4]' : 'bg-teal-50 border-teal-200 text-teal-700'
              }`}>
                {task.category || "General"}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase border ${
                task.priority === "Critical" ? (isDark ? "text-red-400 bg-red-950/40 border-red-500/20" : "text-red-600 bg-red-50 border-red-200") :
                task.priority === "High" ? (isDark ? "text-orange-400 bg-orange-950/40 border-orange-500/20" : "text-orange-600 bg-orange-50 border-orange-200") :
                task.priority === "Medium" ? (isDark ? "text-amber-400 bg-amber-950/40 border-amber-500/20" : "text-amber-600 bg-amber-50 border-amber-200") :
                (isDark ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/20" : "text-emerald-600 bg-emerald-50 border-emerald-200")
              }`}>
                {task.priority} Priority
              </span>
            </div>
            <h2 className={`text-xl md:text-2xl font-black leading-snug tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              {task.title}
            </h2>
          </div>
          
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl cursor-pointer transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description and metadata */}
          <div className={`space-y-3 p-4.5 rounded-2xl border ${isDark ? 'bg-[#0D1425]/40 border-white/3' : 'bg-[#F8FAFF] border-[#E2E8F0]'}`}>
            <h4 className={`text-xs font-mono uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>Task Notes</h4>
            <p className={`text-sm leading-relaxed font-sans ${isDark ? 'text-slate-200' : 'text-[#475569]'}`}>{task.description}</p>
            
            {task.deadline && (
              <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-white/5' : 'border-[#E2E8F0]'}`}>
                <div className={`flex items-center gap-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
                  <Calendar className={`w-4 h-4 ${isDark ? 'text-[#00D4FF]' : 'text-[#0891B2]'}`} />
                  <span>Deadline:</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{new Date(task.deadline).toLocaleString()}</span>
                </div>

                {!task.completed && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCalDropdownOpen(!isCalDropdownOpen)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-mono transition cursor-pointer ${
                        isDark 
                          ? 'bg-slate-900 border-[#00D4FF]/30 hover:border-[#00D4FF]/65 text-[#00D4FF] hover:text-white' 
                          : 'bg-[#F0F9FF] border-[#BAE6FD] hover:bg-[#E0F2FE] text-[#0891B2]'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Add to Calendar
                    </button>

                    <AnimatePresence>
                      {isCalDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className={`absolute left-0 mt-1.5 w-56 rounded-xl border shadow-2xl p-1.5 z-20 space-y-0.5 ${
                            isDark ? 'bg-slate-950 border-white/10' : 'bg-white border-[#E2E8F0]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const { start, end } = getEventTimes();
                              const text = encodeURIComponent(task.title);
                              const details = encodeURIComponent(task.description || "");
                              const dates = `${formatCalDate(start)}/${formatCalDate(end)}`;
                              const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${dates}`;
                              window.open(gCalUrl, "_blank");
                              setIsCalDropdownOpen(false);
                            }}
                            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                              isDark ? 'text-slate-300 hover:bg-[#FF5722]/15 hover:text-[#FF5722]' : 'text-[#475569] hover:bg-[#FFEDD5] hover:text-[#EA580C]'
                            }`}
                          >
                            <span className="text-sm">📅</span>
                            <span>Google Calendar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const { start, end } = getEventTimes();
                              const formattedStart = formatCalDate(start);
                              const formattedEnd = formatCalDate(end);
                              const icsContent = [
                                "BEGIN:VCALENDAR",
                                "VERSION:2.0",
                                "BEGIN:VEVENT",
                                `SUMMARY:${task.title}`,
                                `DESCRIPTION:${task.description || ""}`,
                                `DTSTART:${formattedStart}`,
                                `DTEND:${formattedEnd}`,
                                "END:VEVENT",
                                "END:VCALENDAR"
                              ].join("\r\n");

                              const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `${task.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                              setIsCalDropdownOpen(false);
                            }}
                            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                              isDark ? 'text-slate-300 hover:bg-[#0078D4]/15 hover:text-[#0078D4]' : 'text-[#475569] hover:bg-[#DBEAFE] hover:text-[#2563EB]'
                            }`}
                          >
                            <span className="text-sm">💻</span>
                            <span>Apple / Outlook (.ics)</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const formattedDeadline = new Date(task.deadline!).toLocaleString();
                              const copyText = `📅 EVENT: ${task.title}\n📝 NOTES: ${task.description || ""}\n⏰ DEADLINE: ${formattedDeadline}`;
                              try {
                                await navigator.clipboard.writeText(copyText);
                                setIsCopied(true);
                                setTimeout(() => setIsCopied(false), 2000);
                              } catch (err) {
                                console.error("Failed to copy details to clipboard:", err);
                              }
                            }}
                            className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                              isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">📋</span>
                              <span>Copy Event Details</span>
                            </div>
                            {isCopied && <span className="text-emerald-400 font-bold font-mono">✓</span>}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOCUS ENGINE TIMER ZONE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
                <Activity className={`w-4 h-4 ${isDark ? 'text-[#00D4FF]' : 'text-[#0891B2]'}`} />
                Focus Timer
              </h3>

              {/* Timer Mode Selectors */}
              <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-slate-950/60 border-white/5' : 'bg-[#F8FAFF] border-[#E2E8F0]'}`}>
                <button
                  onClick={() => {
                    setTimerMode("stopwatch");
                    setIsRunning(false);
                    setIsTimerConfigured(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition cursor-pointer ${
                    timerMode === "stopwatch"
                      ? (isDark ? "bg-[#00D4FF]/20 text-[#00D4FF] font-bold border border-[#00D4FF]/20" : "bg-[#F0F9FF] text-[#0891B2] font-bold border border-[#BAE6FD]")
                      : (isDark ? "text-gray-400 hover:text-white" : "text-[#64748B] hover:text-[#0F172A]")
                  }`}
                >
                  ⏱ Stopwatch
                </button>
                <button
                  onClick={() => {
                    setTimerMode("timer");
                    setIsRunning(false);
                    setIsTimerConfigured(false);
                    setCountdownSeconds(inputHours * 3600 + inputMinutes * 60);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition cursor-pointer ${
                    timerMode === "timer"
                      ? (isDark ? "bg-[#00D4FF]/20 text-[#00D4FF] font-bold border border-[#00D4FF]/20" : "bg-[#F0F9FF] text-[#0891B2] font-bold border border-[#BAE6FD]")
                      : (isDark ? "text-gray-400 hover:text-white" : "text-[#64748B] hover:text-[#0F172A]")
                  }`}
                >
                  ⏳ Set Timer
                </button>
              </div>
            </div>

            {/* Config Mode for Timer */}
            {timerMode === "timer" && !isTimerConfigured && !task.completed && (
              <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-950/40 border-white/5' : 'bg-[#F8FAFF] border-[#E2E8F0]'}`}>
                <span className={`text-[10px] font-mono tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>Configure Exam Target Countdown</span>
                
                <div className="flex items-center justify-center gap-6 py-2">
                  {/* Hours controller */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-[#94A3B8]'}`}>Hours</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setInputHours(prev => Math.max(0, prev - 1))}
                        className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center cursor-pointer text-xs ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]'
                        }`}
                      >
                        -
                      </button>
                      <span className={`w-12 text-center text-lg font-mono font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{inputHours}</span>
                      <button 
                        onClick={() => setInputHours(prev => Math.min(24, prev + 1))}
                        className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center cursor-pointer text-xs ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Minutes controller */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-[#94A3B8]'}`}>Minutes</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setInputMinutes(prev => Math.max(0, prev - 5))}
                        className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center cursor-pointer text-xs ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]'
                        }`}
                      >
                        -
                      </button>
                      <span className={`w-12 text-center text-lg font-mono font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{inputMinutes}</span>
                      <button 
                        onClick={() => setInputMinutes(prev => Math.min(59, prev + 5))}
                        className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center cursor-pointer text-xs ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pre-sets triggers */}
                <div className={`flex flex-wrap items-center justify-center gap-2 pt-2 border-t ${isDark ? 'border-white/5' : 'border-[#E2E8F0]'}`}>
                  {[15, 25, 30, 45, 60, 120].map((mins) => {
                    const hrs = Math.floor(mins / 60);
                    const remMins = mins % 60;
                    const label = hrs > 0 ? `${hrs}h${remMins > 0 ? ` ${remMins}m` : ""}` : `${mins}m`;
                    return (
                      <button
                        key={mins}
                        onClick={() => {
                          setInputHours(hrs);
                          setInputMinutes(remMins);
                        }}
                        className={`px-3 py-1 rounded-full border text-[10px] font-mono cursor-pointer transition ${
                          isDark 
                            ? 'bg-white/5 border-white/5 hover:border-[#00D4FF]/30 text-slate-300 hover:text-[#00D4FF]' 
                            : 'bg-white border-[#E2E8F0] hover:border-[#0891B2] text-[#64748B] hover:text-[#0891B2]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleApplyTimerConfig}
                  disabled={inputHours === 0 && inputMinutes === 0}
                  className={`w-full py-2 font-bold text-xs tracking-wider uppercase rounded-xl cursor-pointer transition disabled:opacity-50 ${
                    isDark 
                      ? 'bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] disabled:from-slate-800 disabled:to-slate-800 text-[#0A0F1E] disabled:text-slate-500 hover:shadow-[0_0_15px_rgba(0,212,255,0.25)]' 
                      : 'bg-gradient-to-r from-[#0891B2] to-cyan-600 disabled:from-slate-200 disabled:to-slate-200 text-white disabled:text-slate-400 hover:shadow-lg'
                  }`}
                >
                  Apply Exam Clock
                </button>
              </div>
            )}

            {/* Completed Task Warning Message inside the timer panel */}
            {task.completed && (
              <div className={`p-4 border rounded-2xl text-xs leading-relaxed text-center ${isDark ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                ✅ You already completed this task!<br />
                Mark it incomplete first if you want to work on it again.
              </div>
            )}

            {/* Active Display Panel */}
            {(timerMode === "stopwatch" || isTimerConfigured || task.completed) && (
              <div className={`p-6 md:p-8 rounded-3xl border text-center flex flex-col items-center justify-center space-y-5 transition-all duration-500 ${timerStyles.glowClass} ${timerStyles.pulseClass}`}>
                
                <span className={`text-[10px] font-mono tracking-widest uppercase flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
                  {!task.completed && <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isDark ? 'bg-[#0DFFD4]' : 'bg-teal-500'}`} />}
                  {task.completed ? "✅ Completed Task" : timerMode === "stopwatch" ? "⏱ Stopwatch Mode" : "⏳ Countdown Mode"}
                </span>

                {/* Main digital clock styled numbers */}
                <div 
                  className={`text-5.5xl md:text-6xl font-black tracking-widest select-none ${task.completed ? (isDark ? "text-emerald-500" : "text-emerald-600") : timerStyles.colorClass}`}
                  style={{ fontFamily: "'Courier New', Courier, monospace", textShadow: "0 0 20px currentColor" }}
                >
                  {formatTime(timerMode === "stopwatch" ? stopwatchSeconds : countdownSeconds)}
                </div>

                {/* Progress Indicators for Countdown timer mode */}
                {timerMode === "timer" && !task.completed && (
                  <div className={`w-full max-w-xs h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-[#E2E8F0]'}`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        countdownSeconds <= 600 ? "bg-red-500" : countdownSeconds <= 1800 ? "bg-orange-500" : (isDark ? "bg-[#00D4FF]" : "bg-[#0891B2]")
                      }`}
                      style={{ width: `${(countdownSeconds / initialCountdownSeconds) * 100}%` }}
                    />
                  </div>
                )}

                {/* Controls buttons row */}
                <div className="flex items-center gap-4">
                  {/* Start / Pause or Mark Incomplete */}
                  {task.completed ? (
                    <button
                      onClick={async () => {
                        await onUpdateTask(task.id, { completed: false, completedAt: undefined });
                      }}
                      className={`px-4 py-2 rounded-xl border font-bold text-xs tracking-wider uppercase transition cursor-pointer animate-pulse ${
                        isDark 
                          ? 'border-red-500/30 hover:border-red-500/50 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300' 
                          : 'border-red-300 hover:border-red-400 bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                    >
                      Mark Incomplete
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsRunning(!isRunning)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all border ${
                        isRunning 
                          ? (isDark ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/20" : "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200") 
                          : (isDark ? "bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] border-[#00D4FF]/20" : "bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0891B2] border-[#BAE6FD]")
                      }`}
                    >
                      {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                  )}

                  {/* Reset (hidden if completed) */}
                  {!task.completed && (
                    <button
                      onClick={() => {
                        setIsRunning(false);
                        if (timerMode === "stopwatch") {
                          setStopwatchSeconds(0);
                          totalSecondsSpentRef.current = 0;
                        } else {
                          setCountdownSeconds(initialCountdownSeconds);
                        }
                        alertedSecondsRef.current.clear();
                      }}
                      className={`w-12 h-12 rounded-full border flex items-center justify-center cursor-pointer transition ${
                        isDark 
                          ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5' 
                          : 'bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0]'
                      }`}
                      title="Reset clock"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls footer */}
        <div className={`p-6 border-t flex flex-col md:flex-row gap-3 items-center justify-between ${
          isDark ? 'border-white/5 bg-slate-900/40' : 'border-[#E2E8F0] bg-[#F8FAFF]'
        }`}>
          <span className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-[#64748B]'}`}>
            Total Time Spent: <strong className={isDark ? "text-[#00D4FF]" : "text-[#0891B2]"}>{formatTime(totalSecondsSpentRef.current)}</strong>
          </span>

          {task.completed ? (
            <button
              onClick={async () => {
                await onUpdateTask(task.id, { completed: false, completedAt: undefined });
              }}
              className={`w-full md:w-auto px-6 py-3 border font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 transition ${
                isDark 
                  ? 'border-red-500/30 hover:border-red-500/50 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300' 
                  : 'border-red-300 hover:border-red-400 bg-red-50 hover:bg-red-100 text-red-600'
              }`}
            >
              Mark Incomplete ↺
            </button>
          ) : (
            <button
              onClick={handleMarkComplete}
              className={`w-full md:w-auto px-6 py-3 font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 hover:scale-102 transition ${
                isDark 
                  ? 'bg-[#0DFFD4] text-[#0A0F1E] shadow-[0_0_15px_rgba(13,255,212,0.15)] hover:shadow-[0_0_25px_rgba(13,255,212,0.35)]' 
                  : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg'
              }`}
            >
              <CheckCircle className="w-4.5 h-4.5 stroke-[3]" />
              Mark as Complete ✓
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
