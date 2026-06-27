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
        colorClass: "text-[#00D4FF]",
        glowClass: "shadow-[0_0_20px_rgba(0,212,255,0.15)] border-[#00D4FF]/20",
        pulseClass: ""
      };
    }

    // Countdown Timer mode color levels
    if (countdownSeconds <= 600) {
      // 10 minutes or less: Red + pulsing
      return {
        colorClass: "text-[#FF4444]",
        glowClass: "shadow-[0_0_30px_rgba(255,68,68,0.3)] border-[#FF4444]/45 bg-red-950/20",
        pulseClass: "animate-pulse duration-1000"
      };
    }
    if (countdownSeconds <= 1800) {
      // 30 minutes or less: Orange
      return {
        colorClass: "text-[#FFA500]",
        glowClass: "shadow-[0_0_25px_rgba(255,165,0,0.2)] border-[#FFA500]/30 bg-amber-950/10",
        pulseClass: ""
      };
    }
    // Normal: Cyan
    return {
      colorClass: "text-[#00D4FF]",
      glowClass: "shadow-[0_0_20px_rgba(0,212,255,0.15)] border-[#00D4FF]/20 bg-slate-950/40",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* Floating Exam Popup Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {popups.map(p => {
            let borderStyle = "border-l-4 border-l-[#00D4FF]";
            let bgStyle = "bg-[#0A101E]/95 border border-white/5";
            let animStyle = {};

            if (p.urgency === "orange") {
              borderStyle = "border-l-4 border-l-[#FFA500]";
            } else if (p.urgency === "pulse-red") {
              borderStyle = "border-l-4 border-l-[#FF4444]";
              bgStyle = "bg-[#180A0A]/95 border border-[#FF4444]/20 animate-pulse duration-1000";
            } else if (p.urgency === "shake-red") {
              borderStyle = "border-l-4 border-l-[#FF4444]";
              bgStyle = "bg-[#180A0A]/95 border border-[#FF4444]/30";
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
                  <span className="text-sm font-sans text-white font-medium leading-normal">{p.message}</span>
                </div>
                <button 
                  onClick={() => setPopups(prev => prev.filter(pop => pop.id !== p.id))}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition"
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
        className="relative w-full max-w-2xl bg-[#0B1120] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header Block */}
        <div className="p-6 border-b border-white/5 flex items-start justify-between bg-slate-900/40">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-[#0DFFD4]/10 border border-[#0DFFD4]/15 text-[10px] font-mono uppercase tracking-wider text-[#0DFFD4]">
                {task.category || "General"}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase border ${
                task.priority === "Critical" ? "text-red-400 bg-red-950/40 border-red-500/20" :
                task.priority === "High" ? "text-orange-400 bg-orange-950/40 border-orange-500/20" :
                task.priority === "Medium" ? "text-amber-400 bg-amber-950/40 border border-amber-500/20" :
                "text-emerald-400 bg-emerald-950/40 border border-emerald-500/20"
              }`}>
                {task.priority} Priority
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white leading-snug tracking-tight">
              {task.title}
            </h2>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description and metadata */}
          <div className="space-y-3 bg-[#0D1425]/40 p-4.5 rounded-2xl border border-white/3">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Task Notes</h4>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">{task.description}</p>
            
            {task.deadline && (
              <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-xs font-mono text-slate-400">
                <Calendar className="w-4 h-4 text-[#00D4FF]" />
                <span>Deadline:</span>
                <span className="text-white font-bold">{new Date(task.deadline).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* FOCUS ENGINE TIMER ZONE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#00D4FF]" />
                Focus Timer
              </h3>

              {/* Timer Mode Selectors */}
              <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => {
                    setTimerMode("stopwatch");
                    setIsRunning(false);
                    setIsTimerConfigured(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition cursor-pointer ${
                    timerMode === "stopwatch"
                      ? "bg-[#00D4FF]/20 text-[#00D4FF] font-bold border border-[#00D4FF]/20"
                      : "text-gray-400 hover:text-white"
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
                      ? "bg-[#00D4FF]/20 text-[#00D4FF] font-bold border border-[#00D4FF]/20"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  ⏳ Set Timer
                </button>
              </div>
            </div>

            {/* Config Mode for Timer */}
            {timerMode === "timer" && !isTimerConfigured && !task.completed && (
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 space-y-4">
                <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Configure Exam Target Countdown</span>
                
                <div className="flex items-center justify-center gap-6 py-2">
                  {/* Hours controller */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Hours</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setInputHours(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-lg font-mono font-bold text-white">{inputHours}</span>
                      <button 
                        onClick={() => setInputHours(prev => Math.min(24, prev + 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Minutes controller */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Minutes</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setInputMinutes(prev => Math.max(0, prev - 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-lg font-mono font-bold text-white">{inputMinutes}</span>
                      <button 
                        onClick={() => setInputMinutes(prev => Math.min(59, prev + 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pre-sets triggers */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-white/5">
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
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/5 hover:border-[#00D4FF]/30 text-[10px] font-mono text-slate-300 hover:text-[#00D4FF] cursor-pointer transition"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleApplyTimerConfig}
                  disabled={inputHours === 0 && inputMinutes === 0}
                  className="w-full py-2 bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] disabled:from-slate-800 disabled:to-slate-800 text-[#0A0F1E] disabled:text-slate-500 font-bold text-xs tracking-wider uppercase rounded-xl hover:shadow-[0_0_15px_rgba(0,212,255,0.25)] cursor-pointer transition"
                >
                  Apply Exam Clock
                </button>
              </div>
            )}

            {/* Completed Task Warning Message inside the timer panel */}
            {task.completed && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-xs text-slate-300 leading-relaxed text-center">
                ✅ You already completed this task!<br />
                Mark it incomplete first if you want to work on it again.
              </div>
            )}

            {/* Active Display Panel */}
            {(timerMode === "stopwatch" || isTimerConfigured || task.completed) && (
              <div className={`p-6 md:p-8 rounded-3xl border text-center flex flex-col items-center justify-center space-y-5 transition-all duration-500 ${timerStyles.glowClass} ${timerStyles.pulseClass}`}>
                
                <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase flex items-center gap-1">
                  {!task.completed && <span className="w-1.5 h-1.5 rounded-full bg-[#0DFFD4] animate-ping" />}
                  {task.completed ? "✅ Completed Task" : timerMode === "stopwatch" ? "⏱ Stopwatch Mode" : "⏳ Countdown Mode"}
                </span>

                {/* Main digital clock styled numbers */}
                <div 
                  className={`text-5.5xl md:text-6xl font-black tracking-widest select-none ${task.completed ? "text-emerald-500" : timerStyles.colorClass}`}
                  style={{ fontFamily: "'Courier New', Courier, monospace", textShadow: "0 0 20px currentColor" }}
                >
                  {formatTime(timerMode === "stopwatch" ? stopwatchSeconds : countdownSeconds)}
                </div>

                {/* Progress Indicators for Countdown timer mode */}
                {timerMode === "timer" && !task.completed && (
                  <div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        countdownSeconds <= 600 ? "bg-red-500" : countdownSeconds <= 1800 ? "bg-orange-500" : "bg-[#00D4FF]"
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
                      className="px-4 py-2 rounded-xl border border-red-500/30 hover:border-red-500/50 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-bold text-xs tracking-wider uppercase transition cursor-pointer animate-pulse"
                    >
                      Mark Incomplete
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsRunning(!isRunning)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                        isRunning 
                          ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20" 
                          : "bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] border border-[#00D4FF]/20"
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
                      className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 flex items-center justify-center cursor-pointer transition"
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
        <div className="p-6 border-t border-white/5 bg-slate-900/40 flex flex-col md:flex-row gap-3 items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Total Time Spent: <strong className="text-[#00D4FF]">{formatTime(totalSecondsSpentRef.current)}</strong>
          </span>

          {task.completed ? (
            <button
              onClick={async () => {
                await onUpdateTask(task.id, { completed: false, completedAt: undefined });
              }}
              className="w-full md:w-auto px-6 py-3 border border-red-500/30 hover:border-red-500/50 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-extrabold text-xs tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 transition"
            >
              Mark Incomplete ↺
            </button>
          ) : (
            <button
              onClick={handleMarkComplete}
              className="w-full md:w-auto px-6 py-3 bg-[#0DFFD4] text-[#0A0F1E] font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-[0_0_15px_rgba(13,255,212,0.15)] hover:shadow-[0_0_25px_rgba(13,255,212,0.35)] cursor-pointer flex items-center justify-center gap-2 hover:scale-102 transition"
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
