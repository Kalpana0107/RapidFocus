import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, X, AlertCircle, Calendar, Smile, Clock, Save, Play } from "lucide-react";
import { Task } from "../types";
import { db } from "../services/firebase";
import { collection, addDoc } from "firebase/firestore";

interface AIScheduleQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  user: any;
  isDemoMode: boolean;
  userRole: string;
  userName: string;
  updateTask: (taskId: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => Promise<void>;
  onSuccess: () => void;
  onStartTask?: (task: Task) => void;
}

type MoodType = "Excited" | "Good" | "Neutral" | "Tired" | "Anxious";

interface MoodOption {
  type: MoodType;
  emoji: string;
  label: string;
  desc: string;
  color: string;
  glowColor: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    type: "Excited",
    emoji: "😄",
    label: "Excited",
    desc: "Ready to crush it!",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400",
    glowColor: "rgba(16,185,129,0.15)",
  },
  {
    type: "Good",
    emoji: "🙂",
    label: "Good",
    desc: "I can handle this",
    color: "from-[#00D4FF]/20 to-[#0DFFD4]/20 border-[#00D4FF]/40 text-[#00D4FF]",
    glowColor: "rgba(0,212,255,0.15)",
  },
  {
    type: "Neutral",
    emoji: "😐",
    label: "Neutral",
    desc: "Will do it anyway",
    color: "from-slate-700/30 to-slate-600/30 border-slate-500/40 text-slate-300",
    glowColor: "rgba(148,163,184,0.1)",
  },
  {
    type: "Tired",
    emoji: "😩",
    label: "Tired",
    desc: "Low energy right now",
    color: "from-amber-600/20 to-orange-500/20 border-amber-500/40 text-amber-400",
    glowColor: "rgba(245,158,11,0.15)",
  },
  {
    type: "Anxious",
    emoji: "😰",
    label: "Anxious",
    desc: "Feeling stressed about this",
    color: "from-rose-500/20 to-red-500/20 border-rose-500/40 text-rose-400",
    glowColor: "rgba(244,63,94,0.15)",
  },
];

export const AIScheduleQuizModal: React.FC<AIScheduleQuizModalProps> = ({
  isOpen,
  onClose,
  tasks,
  user,
  isDemoMode,
  userRole,
  userName,
  updateTask,
  onSuccess,
  onStartTask,
}) => {
  const pendingTasks = tasks.filter((t) => !t.completed);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskMoods, setTaskMoods] = useState<Record<string, MoodType>>({});
  const [freeTime, setFreeTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSlowResponse, setIsSlowResponse] = useState(false);
  const [freeTimeError, setFreeTimeError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Structured schedule result from Step 2
  const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);

  // Success Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  if (!isOpen) return null;

  const currentTask = pendingTasks[currentTaskIndex];
  const hasPendingTasks = pendingTasks.length > 0;

  const handleSelectMood = (mood: MoodType) => {
    if (!currentTask) return;
    setTaskMoods((prev) => ({
      ...prev,
      [currentTask.id]: mood,
    }));
  };

  const handleNextTask = () => {
    if (currentTaskIndex < pendingTasks.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1);
    } else {
      setStep(2);
    }
  };

  const handlePrevTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex((prev) => prev - 1);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!freeTime.trim()) {
      setFreeTimeError(true);
      setError("Please enter your free time slots. Example: 9am-11am, 2pm-5pm");
      return;
    }

    setFreeTimeError(false);
    setIsGenerating(true);
    setIsSlowResponse(false);
    setError(null);

    // Set a timer to catch slow response (>10 seconds)
    const timer = setTimeout(() => {
      setIsSlowResponse(true);
    }, 10000);

    try {
      // 1. Save mood data per task
      for (const task of pendingTasks) {
        const mood = taskMoods[task.id] || "Neutral";
        await updateTask(task.id, {
          mood,
          moodUpdatedAt: new Date().toISOString(),
        } as any);
      }

      // 2. Call backend schedule endpoint with automatic single-retry
      let attempts = 0;
      const maxAttempts = 2;
      let responseData: any = null;

      while (attempts < maxAttempts) {
        try {
          const response = await fetch("/api/tasks/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tasks: pendingTasks.map((t) => ({
                id: t.id,
                title: t.title,
                category: t.category,
                priority: t.priority,
                deadline: t.deadline,
              })),
              moods: taskMoods,
              freeTime,
              userName: userName,
            }),
          });

          if (!response.ok) {
            throw new Error(`API returned HTTP status ${response.status}`);
          }

          const responseText = await response.text();
          responseData = JSON.parse(responseText);
          break; // Successful parse, exit loop
        } catch (retryErr) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw retryErr; // Bubble up on second failure
          }
          console.warn(`Attempt ${attempts} failed to generate schedule, retrying once...`);
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }

      clearTimeout(timer);

      // Save schedule object in state and transition to Step 3
      setGeneratedSchedule(responseData);
      setStep(3);

      // Formulate markdown version of schedule to save as a chat message for Assistant Coach
      const formattedMarkdown = `===================================
📅 MY AI FOCUS SCHEDULE FOR TODAY
===================================
${responseData.overallTip || "Here is your custom timeline."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕒 TIME BLOCK | 📝 TASK DETAILS & COGNITIVE FIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${responseData.schedule
  .map(
    (item: any) =>
      `${item.time} | ${item.taskTitle}\nCategory: General | Priority: High | Mood: ${
        item.mood || "Neutral"
      }\n💡 AI Tip: ${item.tip || "Keep up your momentum!"}`
  )
  .join("\n\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      // 3. Save the schedule message to Firestore/local messages subcollection
      if (isDemoMode || (user && user.uid === "demo-sandbox-uid")) {
        const localMsgStr = localStorage.getItem("rapidfocus_demo_messages");
        const currentMessages = localMsgStr ? JSON.parse(localMsgStr) : [];
        const updated = [
          ...currentMessages,
          {
            id: `m-${Date.now()}-coach`,
            role: "assistant",
            content: formattedMarkdown,
            timestamp: new Date().toISOString(),
          },
        ];
        localStorage.setItem("rapidfocus_demo_messages", JSON.stringify(updated));
      } else if (user) {
        await addDoc(collection(db, "users", user.uid, "messages"), {
          role: "assistant",
          content: formattedMarkdown,
          timestamp: new Date(),
        });
      }

    } catch (err: any) {
      console.error("AI Schedule generation failure after retry:", err);
      clearTimeout(timer);
      setError("Unable to synthesize AI Schedule. Please check your network and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartFirstTask = () => {
    if (pendingTasks.length > 0) {
      const firstTask = pendingTasks[0];
      if (onStartTask) {
        onStartTask(firstTask);
      }
    }
    onClose();
  };

  const handleSaveToNotes = async () => {
    if (!generatedSchedule) return;

    // Formulate a beautifully readable text schedule
    const scheduleText = `===================================
📅 MY AI FOCUS SCHEDULE FOR TODAY
===================================
TOTAL FOCUS TIME: ${generatedSchedule.totalFocusTime}

💡 COACH RECOMMENDATION:
"${generatedSchedule.overallTip}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕒 TIME BLOCK | 📝 TASK DETAILS & COGNITIVE FIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedSchedule.schedule
  .map(
    (item: any) =>
      `${item.time} (${item.duration}) | ${item.taskTitle}\nMood Context: ${item.mood}\nAI Tip: ${item.tip}`
  )
  .join("\n\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(scheduleText);
    } catch (e) {
      console.warn("Clipboard save failed:", e);
    }

    // Save to local storage note storage
    localStorage.setItem("rapidfocus_saved_schedule_notes", scheduleText);

    // Save/append to the description (notes panel) of the first pending task
    if (pendingTasks.length > 0) {
      const firstTask = pendingTasks[0];
      const newDescription = firstTask.description
        ? `${firstTask.description}\n\n--- AI SCHEDULE NOTE ---\n${scheduleText}`
        : `--- AI SCHEDULE NOTE ---\n${scheduleText}`;
      try {
        await updateTask(firstTask.id, { description: newDescription });
      } catch (err) {
        console.warn("Failed to append note to task description:", err);
      }
    }

    setToastMessage("Saved schedule to Notes & Clipboard! 📋");
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleCloseStep3 = () => {
    onSuccess(); // Close modal, slide open the AI coach panel
  };

  const progressPercentage = hasPendingTasks
    ? ((currentTaskIndex + (step === 2 ? 1 : step === 3 ? 2 : 0)) / pendingTasks.length) * 100
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Animated Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isGenerating ? undefined : onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Main Content Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl bg-[#0D1425] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl z-10 overflow-hidden"
      >
        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4 bg-emerald-500 text-[#0A0F1E] font-bold text-xs font-mono py-2 px-4 rounded-xl text-center shadow-lg z-50 flex items-center justify-center gap-1.5"
            >
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-48 h-48 bg-[#00D4FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-48 h-48 bg-[#0DFFD4]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#00D4FF]/10 text-[#00D4FF] rounded-xl">
              <Sparkles className="w-5 h-5 text-[#0DFFD4]" />
            </div>
            <div>
              <h3 className="text-md md:text-lg font-black text-white tracking-tight uppercase font-mono">
                AI Focus Planner
              </h3>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                {step === 1
                  ? "Step 1: Mood Diagnostics"
                  : step === 2
                  ? "Step 2: Available Capacity"
                  : "Step 3: Custom Focus Schedule"}
              </p>
            </div>
          </div>

          {!isGenerating && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Global Progress Bar */}
        {hasPendingTasks && step !== 3 && (
          <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden relative z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] h-full"
            />
          </div>
        )}

        {/* Error Callout */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 mb-4 relative z-10">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Step Views */}
        <div className="relative z-10 min-h-[280px] flex flex-col justify-between">
          {!hasPendingTasks ? (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mb-2">
                <Smile className="w-8 h-8" />
              </div>
              <h4 className="text-md font-bold text-white">No active tasks found</h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                You have no tasks to schedule! Add some tasks first, then use AI Schedule to plan your day. 📋
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs tracking-wider uppercase border border-white/10 transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
              <div className="relative w-16 h-16">
                <Loader2 className="w-16 h-16 text-[#00D4FF] animate-spin stroke-[2]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#0DFFD4] animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-mono font-black text-white tracking-widest uppercase">
                  🤖 AI is building your personalized schedule...
                </h4>
                <p className="text-xs text-[#0DFFD4]/80 font-mono max-w-xs animate-pulse">
                  {isSlowResponse
                    ? "Taking longer than usual... still working on your schedule 🤖"
                    : "Tailoring focus block intervals, matching task difficulties to your energy level, and organizing your timeline..."}
                </p>
              </div>
            </div>
          ) : step === 1 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTaskIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Task Context Card */}
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl relative">
                  <span className="absolute top-3 right-4 text-[10px] font-mono text-[#00D4FF]/80 font-bold bg-[#00D4FF]/5 px-2 py-0.5 rounded border border-[#00D4FF]/10">
                    Task {currentTaskIndex + 1} of {pendingTasks.length}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Pending Task
                  </div>
                  <h4 className="text-sm font-black text-white leading-snug tracking-tight">
                    {currentTask?.title}
                  </h4>
                  {currentTask?.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 font-sans leading-relaxed">
                      {currentTask.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                    <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-slate-300">
                      Category: <span className="text-white font-bold">{currentTask?.category}</span>
                    </span>
                    <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-slate-300">
                      Priority: <span className={`font-bold ${
                        currentTask?.priority === "Critical" ? "text-red-400" :
                        currentTask?.priority === "High" ? "text-orange-400" :
                        currentTask?.priority === "Medium" ? "text-[#00D4FF]" : "text-slate-400"
                      }`}>{currentTask?.priority}</span>
                    </span>
                  </div>
                </div>

                {/* Mood Selector Options */}
                <div className="space-y-3">
                  <p className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase mb-1">
                    How do you feel about working on this?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                    {MOOD_OPTIONS.map((option) => {
                      const isSelected = taskMoods[currentTask.id] === option.type;
                      return (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => handleSelectMood(option.type)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                            isSelected
                              ? `bg-gradient-to-b ${option.color} scale-[1.03] shadow-lg`
                              : "bg-[#080D1A]/50 border-white/5 hover:border-white/10 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
                          }`}
                          style={{
                            boxShadow: isSelected ? `0 0 15px ${option.glowColor}` : "none",
                          }}
                        >
                          <span className="text-2xl mb-1.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                            {option.emoji}
                          </span>
                          <span className="text-[10px] font-bold tracking-wide uppercase leading-tight">
                            {option.label}
                          </span>
                          <span className="text-[8px] opacity-75 leading-tight mt-1 hidden md:block">
                            {option.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Controls for Step 1 */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                  <button
                    onClick={handlePrevTask}
                    disabled={currentTaskIndex === 0}
                    className={`px-4 py-2 border border-white/5 rounded-xl text-slate-400 flex items-center gap-1.5 text-xs font-mono transition cursor-pointer ${
                      currentTaskIndex === 0 ? "opacity-30 pointer-events-none" : "hover:text-white hover:border-white/10"
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>

                  <button
                    onClick={handleNextTask}
                    disabled={!taskMoods[currentTask.id]}
                    className={`px-5 py-2.5 bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#0A0F1E] rounded-xl font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-[#00D4FF]/10 ${
                      !taskMoods[currentTask.id] ? "opacity-40 pointer-events-none bg-slate-800 text-slate-500 border border-white/5" : ""
                    }`}
                  >
                    {currentTaskIndex === pendingTasks.length - 1 ? "Next Step" : "Next Task"}{" "}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : step === 2 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 flex flex-col justify-between flex-1"
            >
              <div className="space-y-4">
                <div className="p-4 bg-[#00D4FF]/5 border border-[#00D4FF]/25 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-[#00D4FF]/15 text-[#00D4FF] rounded-xl flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#0DFFD4]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-[#00D4FF] tracking-widest uppercase">
                      Mood Mapping Confirmed!
                    </h4>
                    <p className="text-xs text-slate-303 mt-1 leading-relaxed">
                      All your {pendingTasks.length} pending tasks have been calibrated. Now we need your time parameters to organize your day.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-303 tracking-wider uppercase flex items-center gap-1">
                    What are your free time slots today?
                  </label>
                  <input
                    type="text"
                    value={freeTime}
                    onChange={(e) => {
                      setFreeTime(e.target.value);
                      if (e.target.value.trim()) {
                        setFreeTimeError(false);
                        setError(null);
                      }
                    }}
                    placeholder="9am-11am, 3pm-6pm, 8pm-10pm"
                    className={`w-full bg-[#080D1A] border rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-600 focus:outline-none transition shadow-inner ${
                      freeTimeError
                        ? "border-red-500 focus:border-red-500"
                        : "border-white/10 focus:border-[#00D4FF]/40"
                    }`}
                  />
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    Separate multiple slots with commas
                  </p>
                </div>
              </div>

              {/* Footer Controls for Step 2 */}
              <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/5">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/10 flex items-center gap-1.5 text-xs font-mono transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Adjust Moods
                </button>

                <button
                  onClick={handleGenerateSchedule}
                  className="px-5 py-3 bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] text-[#0A0F1E] hover:opacity-95 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-[#00D4FF]/10"
                >
                  Generate My Schedule <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* Step 3: Beautiful schedule outcome view */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5 flex flex-col justify-between flex-1"
            >
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-sm md:text-md font-black text-white tracking-widest uppercase font-mono text-center flex items-center justify-center gap-1.5">
                    📅 Your Personalized AI Focus Schedule
                  </h4>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">TOTAL FOCUS TIME:</span>
                    <span className="px-3 py-1 bg-[#00D4FF]/20 text-[#00D4FF] rounded-full text-xs font-mono font-extrabold shadow-[0_0_8px_rgba(0,212,255,0.1)]">
                      {generatedSchedule?.totalFocusTime || "2 hours"}
                    </span>
                  </div>
                </div>

                {/* Motivational Quote Quote based on moods */}
                <div className="p-4 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-2xl">
                  <p className="text-[10px] font-mono font-bold text-[#00D4FF] uppercase tracking-wider mb-1">
                    💡 Coach Recommendation
                  </p>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{generatedSchedule?.overallTip || "Maintain steady discipline and approach your milestones step-by-step!"}"
                  </p>
                </div>

                {/* Timeline Items */}
                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {generatedSchedule?.schedule?.map((item: any, idx: number) => {
                    const isHighEnergy = item.mood === "Excited" || item.mood === "Good";
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isHighEnergy
                            ? "border-[#00D4FF]/40 bg-[#00D4FF]/5 shadow-[0_0_12px_rgba(0,212,255,0.08)]"
                            : "border-slate-700/30 bg-[#0A0F1E]/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <Clock className={`w-3.5 h-3.5 ${isHighEnergy ? "text-[#00D4FF]" : "text-slate-400"}`} />
                            <span className="font-mono">{item.time}</span>
                            <span className="text-[10px] font-normal text-slate-500 font-mono">({item.duration})</span>
                          </div>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                            item.mood === "Excited" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                            item.mood === "Good" ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/10" :
                            item.mood === "Tired" ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" :
                            item.mood === "Anxious" ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {item.mood}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white leading-snug">
                          {item.taskTitle}
                        </h5>
                        {item.tip && (
                          <p className="text-[11px] text-slate-400 mt-1 pl-2 border-l border-white/10 leading-relaxed font-sans">
                            {item.tip}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 mt-4 border-t border-white/5">
                <button
                  onClick={handleStartFirstTask}
                  className="w-full py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] text-[#0A0F1E] hover:opacity-95 font-bold text-xs tracking-wider uppercase rounded-xl transition cursor-pointer shadow-lg shadow-[#00D4FF]/15 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Start First Task
                </button>
                <button
                  onClick={handleSaveToNotes}
                  className="w-full py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save to Notes
                </button>
                <button
                  onClick={handleCloseStep3}
                  className="w-full py-2.5 border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white font-bold text-xs tracking-wider uppercase rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
