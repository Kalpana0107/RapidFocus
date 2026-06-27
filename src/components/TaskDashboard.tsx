import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import { UrgencyMeter } from "./UrgencyMeter";
import { TaskCard } from "./TaskCard";
import { AddTaskModal } from "./AddTaskModal";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { AIScheduleQuizModal } from "./AIScheduleQuizModal";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  ListTodo, 
  ShieldAlert, 
  Sparkles, 
  Filter, 
  CheckCircle,
  Search,
  ArrowUpDown,
  Tag,
  AlertTriangle,
  RefreshCw,
  Clock
} from "lucide-react";
import { Task } from "../types";

export const TaskDashboard: React.FC = () => {
  const { user, profile, isDemoMode, signOutUser } = useAuth();
  const { tasks, loading: tasksLoading, addTask, toggleTaskCompletion, deleteTask, updateTask, prioritizeTaskWithAI } = useTasks();
  
  // State elements
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"threat" | "deadline" | "priority" | "newest">("threat");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [taskToConfirmIncomplete, setTaskToConfirmIncomplete] = useState<Task | null>(null);
  const [isCalibratingAll, setIsCalibratingAll] = useState(false);

  // Pick up highlighted tasks from browser push notification clicks
  useEffect(() => {
    const handleHighlightTask = () => {
      const id = localStorage.getItem("rapidfocus_highlight_task_id");
      if (id) {
        const found = tasks.find(t => t.id === id);
        if (found) {
          setSelectedTaskForDetail(found);
        }
        localStorage.removeItem("rapidfocus_highlight_task_id");
      }
    };

    handleHighlightTask();
    window.addEventListener("rapidfocus_highlight_task", handleHighlightTask);
    return () => {
      window.removeEventListener("rapidfocus_highlight_task", handleHighlightTask);
    };
  }, [tasks]);

  // Daily Briefing States
  const [briefing, setBriefing] = useState<{ headline: string; points: string[] } | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [isBriefingDismissed, setIsBriefingDismissed] = useState(false);

  // Helper to hash current task state to verify if content/structure changed
  const getTasksStateHash = (tasksList: Task[]) => {
    return JSON.stringify(
      [...tasksList]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(t => ({
          id: t.id,
          completed: !!t.completed,
          priority: t.priority || "Medium",
          title: t.title || "",
          deadline: t.deadline || ""
        }))
    );
  };

  // Fetch Daily Briefing with caching & rate-limiting on load
  useEffect(() => {
    if (tasksLoading || !profile || briefing) return;

    const fetchBriefing = async () => {
      const currentHash = getTasksStateHash(tasks);
      const cachedStr = localStorage.getItem("rapidfocus_briefing_cache");
      
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          const ageMs = Date.now() - cached.timestamp;
          const isExpired = ageMs > 30 * 60 * 1000; // 30 minutes
          
          if (cached.tasksHash === currentHash && !isExpired) {
            setBriefing(cached.data);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse cached briefing:", e);
        }
      }

      try {
        setBriefingLoading(true);
        const response = await fetch("/api/tasks/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: tasks,
            role: profile.role,
            userName: profile.name
          })
        });

        if (response.ok) {
          const data = await response.json();
          setBriefing(data);
          
          // Store in cache
          localStorage.setItem("rapidfocus_briefing_cache", JSON.stringify({
            tasksHash: currentHash,
            data: data,
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        console.error("AI Daily Briefing gathering failed:", err);
      } finally {
        setBriefingLoading(false);
      }
    };

    fetchBriefing();
  }, [tasksLoading, profile, tasks]);

  // Handle manual dashboard briefing refresh (bypasses cache)
  const handleRefreshBriefing = async () => {
    if (!profile) return;
    try {
      setBriefingLoading(true);
      const response = await fetch("/api/tasks/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks,
          role: profile.role,
          userName: profile.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBriefing(data);
        setIsBriefingDismissed(false);

        // Update cache
        const currentHash = getTasksStateHash(tasks);
        localStorage.setItem("rapidfocus_briefing_cache", JSON.stringify({
          tasksHash: currentHash,
          data: data,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      console.error("Failed to re-fetch briefing:", err);
    } finally {
      setBriefingLoading(false);
    }
  };

  // Compute imminent deadlines (within 2 hours)
  const urgentTasks = tasks.filter((t) => {
    if (t.completed || !t.deadline) return false;
    const diffMs = new Date(t.deadline).getTime() - new Date().getTime();
    return diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000;
  });

  // Calculate clean remaining times for urgent display
  const getRemainingTimeText = (deadlineStr: string) => {
    const diffMs = new Date(deadlineStr).getTime() - new Date().getTime();
    if (diffMs <= 0) return "IMMINENT";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Calibrate all pending tasks together using Gemini
  const handleCalibrateAll = async () => {
    const pendingTasks = tasks.filter((t) => !t.completed && t.aiPriorityScore === undefined);
    // If all are already calibrated, calibrate all pending up to 5 tasks
    const tasksToCalibrate = pendingTasks.length > 0 
      ? pendingTasks.slice(0, 5) 
      : tasks.filter((t) => !t.completed).slice(0, 5);
    
    if (tasksToCalibrate.length === 0) return;
    
    setIsCalibratingAll(true);
    try {
      // Prioritize concurrently (up to 5 tasks maximum to reduce unnecessary API pressure)
      const promises = tasksToCalibrate.map((task) =>
        prioritizeTaskWithAI(task.id, {
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          priority: task.priority,
          category: task.category
        }, tasks)
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to run full calibration queue:", err);
    } finally {
      setIsCalibratingAll(false);
    }
  };

  // Standard Categories suitable for all users
  const defaultCategories = ["Study", "Work", "Personal", "Health", "Finance", "Other"];

  // Threat calculations & filtration
  const priorityWeight = {
    "Critical": 4,
    "High": 3,
    "Medium": 2,
    "Low": 1
  };

  const filteredTasks = tasks.filter((t) => {
    // Status
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  }).filter((t) => {
    // Category Sphere
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  }).filter((t) => {
    // Search Term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      (t.category && t.category.toLowerCase().includes(term))
    );
  });

  // Sort tasks in-place
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "deadline") {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === "priority") {
      const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
      const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
      return weightB - weightA;
    }
    
    // Default threat calculation
    const getThreatScore = (t: Task) => {
      if (t.completed) return -999999;
      let score = 0;
      const weight = priorityWeight[t.priority as keyof typeof priorityWeight] || 0;
      score += weight * 15;
      
      if (t.aiPriorityScore !== undefined) {
        score += t.aiPriorityScore * 5;
      }
      
      if (t.deadline) {
        const nowMs = new Date().getTime();
        const dealMs = new Date(t.deadline).getTime();
        const diffHrs = (dealMs - nowMs) / (1000 * 60 * 60);
        if (diffHrs < 0) {
          score += 150; // Late task
        } else if (diffHrs < 24) {
          score += 80;  // Imminent
        } else if (diffHrs < 72) {
          score += 40;  // Medium range urgency
        } else {
          score += Math.max(0, 15 - diffHrs / 24);
        }
      }
      return score;
    };
    return getThreatScore(b) - getThreatScore(a);
  });

  const handleAddNewTask = async (taskData: {
    title: string;
    description: string;
    deadline: string;
    priority: "Critical" | "High" | "Medium" | "Low";
    category: string;
  }) => {
    await addTask(taskData);
  };

  const handleEditTask = async (taskId: string, taskData: {
    title: string;
    description: string;
    deadline: string;
    priority: "Critical" | "High" | "Medium" | "Low";
    category: string;
  }) => {
    await updateTask(taskId, taskData);
  };

  const getFriendlyStatusText = (headline: string) => {
    const h = (headline || "").toUpperCase();
    const pendingTasks = tasks.filter(t => !t.completed);
    const now = new Date();
    const hasOverdue = pendingTasks.some(t => t.deadline && new Date(t.deadline) < now);
    if (h.includes("OVERDUE") || hasOverdue) {
      return "⚠️ Needs Attention";
    }
    const isDueSoon = pendingTasks.some(t => {
      if (t.priority === "Critical" || t.priority === "High") return true;
      if (t.deadline) {
        const diffMs = new Date(t.deadline).getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 24;
      }
      return false;
    });
    if (h.includes("STRESS") || h.includes("MOMENTUM") || isDueSoon || pendingTasks.length > 0) {
      return "🔔 Stay Alert";
    }
    return "✅ All Clear for Today";
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm md:text-md font-bold text-slate-300 tracking-wide bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#F472B6] bg-clip-text text-transparent animate-pulse">
            For Better Experience Use AI Schedule ➔
          </span>
          <div>
            <h2 className="text-lg md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              My Dashboard
            </h2>
            <p className="text-xs text-[#0DFFD4]/80 font-mono tracking-widest uppercase mt-0.5">
              Your personalized dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="ai-schedule-btn"
            onClick={() => setIsQuizOpen(true)}
            className="w-full md:w-auto bg-slate-900 border border-[#0DFFD4]/40 hover:border-[#0DFFD4]/70 text-slate-200 hover:text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(13,255,212,0.15)] animate-pulse"
          >
            <Sparkles className="w-4.5 h-4.5 text-[#0DFFD4] animate-spin" style={{ animationDuration: "3s" }} />
            AI Schedule
          </button>

          <button
            id="quick-add-task-btn"
            onClick={() => setIsAddOpen(true)}
            className="w-full md:w-auto bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] text-[#0A0F1E] px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(0,212,255,0.25)] flex items-center justify-center gap-1.5 hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] transition cursor-pointer pulse-button"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            ADD NEW TASK
          </button>
        </div>
      </div>

      {/* DAILY BRIEFING BANNER - Dismissible and AI powered */}
      <AnimatePresence>
        {(!isBriefingDismissed || briefingLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            {briefingLoading ? (
              <div className="bg-[#0D1425]/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#00D4FF]/10 text-[#00D4FF] rounded-xl flex-shrink-0 animate-spin">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-[#00D4FF] tracking-widest uppercase animate-pulse">
                      Preparing Daily Briefing
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Loading your personal coaching briefing...
                    </p>
                  </div>
                </div>
              </div>
            ) : briefing ? (
              <div className="bg-gradient-to-r from-[#0C152B]/90 via-[#0E203B]/80 to-[#102542]/65 border border-[#00D4FF]/25 p-2 md:p-5 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(0,212,255,0.05)]">
                {/* Background design accents */}
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-[#00D4FF]/8 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-10 -ml-12 -mb-12 w-24 h-24 bg-[#0DFFD4]/5 rounded-full blur-2xl" />
                
                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-3 md:gap-4">
                    {/* Brand icon block */}
                    <div className="p-2 bg-[#00D4FF]/15 text-[#00D4FF] rounded-2xl flex-shrink-0 animate-pulse border border-[#00D4FF]/20 mt-0.5">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#0DFFD4]" />
                    </div>
                    
                    <div className="space-y-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] md:text-[9px] font-mono font-black bg-[#00D4FF]/15 text-[#00D4FF] uppercase tracking-widest px-2.5 py-1 rounded-md border border-[#00D4FF]/25">
                          Daily briefing
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-semibold select-none">
                          {getFriendlyStatusText(briefing.headline)}
                        </div>
                      </div>
                      
                      <ul className="space-y-2 max-w-2xl">
                        {briefing.points.map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[13px] md:text-xs text-slate-350 leading-relaxed font-sans">
                            <span className="text-[#0DFFD4] font-bold select-none font-mono mt-0.5">▸</span>
                            <span className="line-clamp-2 md:line-clamp-none break-normal whitespace-normal">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                    <button
                      onClick={() => setIsBriefingDismissed(true)}
                      className="text-slate-500 hover:text-white text-xs p-1.5 hover:bg-white/5 rounded-lg transition cursor-pointer"
                      title="Dismiss Briefing"
                    >
                      ✕
                    </button>
                    
                    <button
                      onClick={handleRefreshBriefing}
                      className="text-[10px] text-slate-500 hover:text-[#00D4FF] flex items-center gap-1 hover:bg-white/5 px-2 py-1 rounded-md transition cursor-pointer font-mono"
                      title="Re-scan current agenda"
                    >
                      <RefreshCw className="w-3 h-3" />
                      RE-SCAN
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid containing Urgency Meter inside Left Panel and tasks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Urgency Meter Left panel */}
        <div className="lg:col-span-5 space-y-6">
          <UrgencyMeter tasks={tasks} />

          {/* Quick AI Coaching Tips Box */}
          <div className="glass p-5 rounded-2xl relative border border-white/5 overflow-hidden task-card-hover">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-[#00D4FF]/10 rounded-full blur-xl" />
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#00D4FF]/10 text-[#00D4FF] rounded-lg">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase font-sans">AI Coach Tip</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Grouping similar tasks together, using voice dictation to fast-track entries, and handling high priority tasks first is proven to keep momentum high!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Task List Right Panel */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filters & Status Bar */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-[#0D1425]/40 p-3 rounded-2xl border border-white/5 gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest pl-1">
                <ListTodo className="w-4 h-4 text-[#00D4FF]" />
                MY TASKS ({sortedTasks.length})
              </div>

              {/* Recalibrate button */}
              <button
                onClick={handleCalibrateAll}
                disabled={isCalibratingAll || tasks.filter((t) => !t.completed).length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all ${
                  isCalibratingAll
                    ? "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30 animate-pulse cursor-not-allowed"
                    : tasks.filter((t) => !t.completed).length === 0
                    ? "bg-slate-900/20 border-white/5 text-slate-600 cursor-not-allowed"
                    : "bg-slate-900/60 border-white/5 hover:border-[#00D4FF]/30 text-gray-300 hover:text-[#00D4FF] cursor-pointer"
                }`}
                title="Analyze and sort all your tasks together with AI"
              >
                <Sparkles className={`w-3.5 h-3.5 text-[#00D4FF] ${isCalibratingAll ? "animate-spin" : ""}`} />
                {isCalibratingAll ? "Sorting..." : "Re-Sort Tasks"}
              </button>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 justify-center">
              {(["all", "pending", "completed"] as const).map((opt) => (
                <button
                  key={opt}
                  id={`filter-btn-${opt}`}
                  onClick={() => setFilter(opt)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all cursor-pointer ${
                    filter === opt
                      ? "bg-[#00D4FF]/20 text-[#00D4FF] font-bold border border-[#00D4FF]/20"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Sorting Controllers */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search inputs */}
            <div className="sm:col-span-7 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search description, keywords..."
                className="w-full pl-10 pr-4 py-2 bg-[#0D1425]/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#00D4FF] placeholder-slate-600 transition"
              />
            </div>

            {/* Sorting trigger dropdown */}
            <div className="sm:col-span-5 relative flex items-center bg-[#0D1425]/40 border border-white/5 rounded-xl px-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 ml-1 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full bg-transparent border-0 text-xs text-slate-300 font-mono focus:outline-none pl-1.5 py-2 cursor-pointer"
              >
                <option value="threat" className="bg-[#0D1425]">SORT: URGENCY</option>
                <option value="deadline" className="bg-[#0D1425]">SORT: DUE DATE</option>
                <option value="priority" className="bg-[#0D1425]">SORT: PRIORITY</option>
                <option value="newest" className="bg-[#0D1425]">SORT: RECENT</option>
              </select>
            </div>
          </div>

          {/* Scrollable Category Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-1 flex-shrink-0 pr-1">
              <Tag className="w-3 h-3 text-[#0DFFD4]" />
              CATEGORIES:
            </span>
            {/* All spheres chip */}
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-wider transition-all flex-shrink-0 cursor-pointer border ${
                categoryFilter === "all"
                  ? "bg-[#0DFFD4]/10 text-[#0DFFD4] border-[#0DFFD4]/30 font-bold"
                  : "bg-transparent border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              ALL ({tasks.length})
            </button>
            {/* Category individual chips with counts */}
            {defaultCategories.map((cat) => {
              const count = tasks.filter((t) => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-wider transition-all flex-shrink-0 cursor-pointer border ${
                    categoryFilter === cat
                      ? "bg-[#0FCDFF]/10 text-[#0FCDFF] border-[#0FCDFF]/30 font-bold"
                      : "bg-transparent border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat.toUpperCase()} ({count})
                </button>
              );
            })}
          </div>

          {/* Render List */}
          <div className="space-y-3.5 min-h-[450px]">
            {tasksLoading ? (
              // Task Loading Skeletons to prevent layout shifts and add visual interest
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-2/3">
                    <div className="w-5 h-5 bg-slate-800 rounded-md flex-shrink-0" />
                    <div className="space-y-2 w-full">
                      <div className="h-4 bg-slate-800 rounded w-1/3" />
                      <div className="h-3 bg-slate-800 rounded w-3/4" />
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-slate-800 rounded-full" />
                </div>
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {sortedTasks.length > 0 ? (
                  sortedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={toggleTaskCompletion}
                      onDelete={deleteTask}
                      onEdit={(task) => setTaskToEdit(task)}
                      onSelect={(task) => {
                        if (task.completed) {
                          setTaskToConfirmIncomplete(task);
                        } else {
                          setSelectedTaskForDetail(task);
                        }
                      }}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 text-center glass rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center gap-3"
                  >
                    <div className="p-3 bg-white/5 text-gray-500 rounded-full">
                      <ListTodo className="w-8 h-8" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">No tasks here yet</h5>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Add your very first task above to start organizing your day!
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddOpen(true)}
                      className="mt-2 text-xs text-[#00D4FF] font-mono hover:underline"
                    >
                      + Add Your First Task
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Panel Overlay */}
      <AnimatePresence>
        {selectedTaskForDetail && (
          <TaskDetailPanel
            task={selectedTaskForDetail}
            onClose={() => setSelectedTaskForDetail(null)}
            onUpdateTask={async (taskId, updates) => {
              await updateTask(taskId, updates);
              setSelectedTaskForDetail(prev => prev && prev.id === taskId ? { ...prev, ...updates } : prev);
            }}
            onToggleComplete={toggleTaskCompletion}
          />
        )}
      </AnimatePresence>

      {/* Task Creation / Edit Modal */}
      <AnimatePresence>
        {(isAddOpen || taskToEdit) && (
          <AddTaskModal
            onClose={() => {
              setIsAddOpen(false);
              setTaskToEdit(null);
            }}
            onAdd={handleAddNewTask}
            onEdit={handleEditTask}
            taskToEdit={taskToEdit || undefined}
            userRole={profile?.role || "Professional"}
          />
        )}
      </AnimatePresence>

      {/* Completed Task Confirmation Popup Modal */}
      <AnimatePresence>
        {taskToConfirmIncomplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskToConfirmIncomplete(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#0D1425] border border-white/10 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white leading-snug">
                  ✅ This task is already completed!
                </h3>
                <p className="text-sm text-slate-305">
                  Do you want to mark it as incomplete again?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={async () => {
                    const taskId = taskToConfirmIncomplete.id;
                    await toggleTaskCompletion(taskId, false);
                    setTaskToConfirmIncomplete(null);
                  }}
                  className="w-full py-2.5 border border-red-500 hover:border-red-600 bg-transparent text-red-500 hover:text-red-400 font-bold text-xs tracking-wider uppercase rounded-xl transition cursor-pointer"
                >
                  Yes, Mark Incomplete
                </button>
                <button
                  onClick={() => setTaskToConfirmIncomplete(null)}
                  className="w-full py-2.5 bg-[#0DFFD4] hover:bg-[#00D4FF] text-[#0A0F1E] font-bold text-xs tracking-wider uppercase rounded-xl transition cursor-pointer"
                >
                  No, Keep Completed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isQuizOpen && (
          <AIScheduleQuizModal
            isOpen={isQuizOpen}
            onClose={() => setIsQuizOpen(false)}
            tasks={tasks}
            user={user}
            isDemoMode={isDemoMode}
            userRole={profile?.role || "Professional"}
            userName={profile?.name || "User"}
            updateTask={updateTask}
            onSuccess={() => {
              setIsQuizOpen(false);
              window.dispatchEvent(new Event("rapidfocus_open_chat"));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
