import React, { useState, useEffect } from "react";
import { useTasks } from "../hooks/useTasks";
import { useAuth } from "../hooks/useAuth";
import { useGoalsAndHabits } from "../hooks/useGoalsAndHabits";
import { 
  TrendingUp, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  Hourglass,
  RefreshCw,
  HelpCircle,
  Activity,
  AlertCircle,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";

const generateCSV = (
  completedTasksData: any[],
  totalTimeSpentSec: number,
  goalsData: any[],
  userName: string,
  userRole: string,
  formatSeconds: (s: number) => string
) => {
  let csv = "";
  
  // 1. Metadata / Summary Section
  csv += "=== RAPIDFOCUS PRODUCTIVITY REPORT ===\n";
  csv += `Generated At,${new Date().toLocaleString()}\n`;
  csv += `User,${userName}\n`;
  csv += `Role,${userRole}\n`;
  csv += `Total Completed Tasks,${completedTasksData.length}\n`;
  csv += `Total Focus Time Spent,${formatSeconds(totalTimeSpentSec)}\n`;
  
  const maxStreakVal = goalsData.length > 0 
    ? Math.max(...goalsData.filter(g => g.type === "habit").map(g => g.streak || 0), 0)
    : 0;
  csv += `Max Active Habit Streak,${maxStreakVal} days\n\n`;
  
  // 2. Completed Tasks Table
  csv += "=== COMPLETED TASKS ===\n";
  csv += "Task Title,Category,Priority,Deadline,Completed At,Time Spent (Seconds),Time Spent (Formatted),On-Time\n";
  completedTasksData.forEach(t => {
    const title = `"${(t.title || "").replace(/"/g, '""')}"`;
    const category = `"${(t.category || "General").replace(/"/g, '""')}"`;
    const priority = t.priority || "Medium";
    const deadline = t.deadline ? new Date(t.deadline).toLocaleString() : "None";
    const completedAt = t.completedAt ? new Date(t.completedAt).toLocaleString() : (t.createdAt ? new Date(t.createdAt).toLocaleString() : "N/A");
    const seconds = t.timeSpent || 0;
    const formattedTime = formatSeconds(seconds);
    
    let onTimeStatus = "N/A";
    if (t.deadline) {
      const dlTime = new Date(t.deadline).getTime();
      const compTime = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.createdAt).getTime();
      onTimeStatus = compTime <= dlTime ? "On-Time" : "Late";
    } else {
      onTimeStatus = "On-Time";
    }
    
    csv += `${title},${category},${priority},${deadline},${completedAt},${seconds},${formattedTime},${onTimeStatus}\n`;
  });
  csv += "\n";
  
  // 3. Habits & Goals Table
  csv += "=== HABITS & GOALS ===\n";
  csv += "Title,Type,Target Days,Completed Days Count,Current Streak\n";
  goalsData.forEach(g => {
    const title = `"${(g.title || "").replace(/"/g, '""')}"`;
    const type = g.type === "habit" ? "Daily Habit" : "Weekly Goal";
    const targetDays = g.targetDays || 3;
    const completedDaysCount = g.completedDays?.length || 0;
    const streak = g.streak || 0;
    csv += `${title},${type},${targetDays},${completedDaysCount},${streak}\n`;
  });
  
  return csv;
};

const generateJSON = (
  completedTasksData: any[],
  totalTimeSpentSec: number,
  goalsData: any[],
  userName: string,
  userRole: string,
  formatSeconds: (s: number) => string
) => {
  const maxStreakVal = goalsData.length > 0 
    ? Math.max(...goalsData.filter(g => g.type === "habit").map(g => g.streak || 0), 0)
    : 0;

  const report = {
    reportMetadata: {
      generatedAt: new Date().toISOString(),
      user: userName,
      role: userRole,
      summary: {
        totalCompletedTasks: completedTasksData.length,
        totalTimeSpentSeconds: totalTimeSpentSec,
        totalTimeSpentFormatted: formatSeconds(totalTimeSpentSec),
        maxActiveHabitStreak: maxStreakVal
      }
    },
    completedTasks: completedTasksData.map(t => {
      let onTimeStatus = "N/A";
      if (t.deadline) {
        const dlTime = new Date(t.deadline).getTime();
        const compTime = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.createdAt).getTime();
        onTimeStatus = compTime <= dlTime ? "On-Time" : "Late";
      } else {
        onTimeStatus = "On-Time";
      }
      return {
        id: t.id,
        title: t.title,
        description: t.description || "",
        category: t.category || "General",
        priority: t.priority,
        deadline: t.deadline || null,
        completedAt: t.completedAt || t.createdAt || null,
        timeSpentSeconds: t.timeSpent || 0,
        timeSpentFormatted: formatSeconds(t.timeSpent || 0),
        onTimeStatus
      };
    }),
    goalsAndHabits: goalsData.map(g => ({
      id: g.id,
      title: g.title,
      type: g.type,
      targetDays: g.targetDays || 3,
      completedDaysCount: g.completedDays?.length || 0,
      completedDaysList: g.completedDays || [],
      currentStreak: g.streak || 0
    }))
  };
  
  return JSON.stringify(report, null, 2);
};

export function StatsTab() {
  const { profile } = useAuth();
  const { tasks, loading: tasksLoading } = useTasks();
  const { goals } = useGoalsAndHabits();

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Weekly diagnostic advisor stats
  const [advisorInsight, setAdvisorInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const completedTasks = tasks.filter(t => t.completed);
  const totalTasksCount = tasks.length;
  const isSimulation = completedTasks.length === 0;

  // 1. Process Day of week calculations for Bar Chart
  const weekDayCounts = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 };
  completedTasks.forEach(t => {
    const date = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }) as keyof typeof weekDayCounts;
    if (weekDayCounts[dayName] !== undefined) {
      weekDayCounts[dayName]++;
    }
  });

  const barChartData = Object.entries(weekDayCounts).map(([day, count]) => ({
    name: day.substring(0, 3),
    Completions: count,
  }));

  const finalBarData = isSimulation 
    ? [
        { name: "Mon", Completions: 3 },
        { name: "Tue", Completions: 5 },
        { name: "Wed", Completions: 2 },
        { name: "Thu", Completions: 4 },
        { name: "Fri", Completions: 1 },
        { name: "Sat", Completions: 0 },
        { name: "Sun", Completions: 0 },
      ]
    : barChartData;

  // 2. Process On-time vs Late rate
  let onTimeCount = 0;
  let lateCount = 0;

  completedTasks.forEach((t) => {
    if (t.deadline) {
      const dlTime = new Date(t.deadline).getTime();
      const compTime = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.createdAt).getTime();
      if (compTime <= dlTime) {
        onTimeCount++;
      } else {
        lateCount++;
      }
    } else {
      onTimeCount++; // no deadline counts as on-time compliance
    }
  });

  const totalCommitted = onTimeCount + lateCount;
  const onTimePercentage = totalCommitted > 0 ? Math.round((onTimeCount / totalCommitted) * 100) : 100;
  const latePercentage = totalCommitted > 0 ? Math.round((lateCount / totalCommitted) * 100) : 0;

  const finalPieData = isSimulation
    ? [
        { name: "On-Time", value: 85, color: "#00D4FF" },
        { name: "Late", value: 15, color: "#FF5E5E" }
      ]
    : [
        { name: "On-Time", value: onTimePercentage, color: "#00D4FF" },
        { name: "Late", value: latePercentage, color: "#FF5E5E" }
      ];

  // 3. Process time of day stats
  // Morning (5-11), Afternoon (12-17), Evening (18-22), Night (23-4)
  const timeOfDayCounts = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  completedTasks.forEach(t => {
    const d = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
    const hour = d.getHours();
    if (hour >= 5 && hour < 12) timeOfDayCounts.Morning++;
    else if (hour >= 12 && hour < 18) timeOfDayCounts.Afternoon++;
    else if (hour >= 18 && hour < 23) timeOfDayCounts.Evening++;
    else timeOfDayCounts.Night++;
  });

  const finalTimeCounts = isSimulation
    ? { Morning: 5, Afternoon: 3, Evening: 4, Night: 1 }
    : timeOfDayCounts;

  // Detect peak period
  const peakTimeOfDay = Object.entries(finalTimeCounts).reduce((a, b) => a[1] >= b[1] ? a : b)[0];

  // 4. Calculate Average Focus Time spent per task
  const tasksWithTimeSpent = completedTasks.filter(t => t.timeSpent !== undefined && t.timeSpent > 0);
  const totalSecondsSpent = tasksWithTimeSpent.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const avgSecondsSpent = isSimulation 
    ? 2700 // 45 minutes mock
    : (tasksWithTimeSpent.length > 0 ? Math.round(totalSecondsSpent / tasksWithTimeSpent.length) : 0);

  const formatSeconds = (totalSecs: number) => {
    if (totalSecs <= 0) return "0s";
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
  };

  // Fetch Advisor Insight from backend
  const fetchAdvisorInsight = async () => {
    if (!profile) return;

    const currentHash = JSON.stringify(
      [...tasks]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(t => ({
          id: t.id,
          completed: !!t.completed,
          priority: t.priority || "Medium",
          title: t.title || "",
          deadline: t.deadline || ""
        }))
    );

    const cachedStr = localStorage.getItem("rapidfocus_stats_insight_cache");
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        const ageMs = Date.now() - cached.timestamp;
        const isExpired = ageMs > 30 * 60 * 1000; // 30 minutes
        
        if (cached.tasksHash === currentHash && !isExpired) {
          setAdvisorInsight(cached.insight);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse cached stats insight:", e);
      }
    }

    try {
      setInsightLoading(true);
      const response = await fetch("/api/analytics/insight", {
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
        setAdvisorInsight(data.insight);

        // Store in cache
        localStorage.setItem("rapidfocus_stats_insight_cache", JSON.stringify({
          tasksHash: currentHash,
          insight: data.insight,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      console.error("Failed to load task advisor telemetry:", err);
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (!tasksLoading && profile) {
      fetchAdvisorInsight();
    }
  }, [tasksLoading, profile]);

  const handleDownload = (format: "csv" | "json") => {
    let completedTasksData = completedTasks;
    let totalTimeSpentSec = totalSecondsSpent;
    let goalsData = goals;
    
    if (isSimulation) {
      completedTasksData = [
        { id: "sim-1", title: "Review system architecture blueprint", category: "Engineering", priority: "Critical", deadline: new Date(Date.now() - 3600000 * 2).toISOString(), completedAt: new Date(Date.now() - 3600000 * 3).toISOString(), timeSpent: 3600, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: "sim-2", title: "Refactor database connection pool", category: "Database", priority: "High", deadline: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 1800000).toISOString(), timeSpent: 2700, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: "sim-3", title: "Draft performance optimization report", category: "Documentation", priority: "Medium", deadline: new Date(Date.now() + 86400000).toISOString(), completedAt: new Date().toISOString(), timeSpent: 1800, createdAt: new Date(Date.now() - 43200000).toISOString() },
        { id: "sim-4", title: "Implement dark mode theme enhancements", category: "UI/UX", priority: "Low", deadline: null, completedAt: new Date().toISOString(), timeSpent: 1200, createdAt: new Date(Date.now() - 43200000).toISOString() },
        { id: "sim-5", title: "Calibrate neural timing pipeline", category: "AI Research", priority: "High", deadline: new Date(Date.now() - 7200000).toISOString(), completedAt: new Date(Date.now() - 10000000).toISOString(), timeSpent: 5400, createdAt: new Date(Date.now() - 172800000).toISOString() }
      ] as any[];
      totalTimeSpentSec = completedTasksData.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
      goalsData = [
        { id: "sim-goal-1", title: "Deep Work Blocks", type: "habit", targetDays: 7, completedDays: ["2026-06-21", "2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25"], streak: 5, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: "sim-goal-2", title: "Weekly Sprint Objectives", type: "goal", targetDays: 3, completedDays: ["2026-06-22", "2026-06-24"], streak: 2, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() }
      ] as any[];
    }
    
    const fileContent = format === "csv" 
      ? generateCSV(completedTasksData, totalTimeSpentSec, goalsData, profile?.name || "User", profile?.role || "Professional", formatSeconds)
      : generateJSON(completedTasksData, totalTimeSpentSec, goalsData, profile?.name || "User", profile?.role || "Professional", formatSeconds);
      
    const mimeType = format === "csv" ? "text/csv;charset=utf-8;" : "application/json;charset=utf-8;";
    const filename = `rapidfocus_productivity_report_${new Date().toISOString().split("T")[0]}.${format}`;
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8" id="stats-tab-container">
      
      {/* Top Welcome Stats Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#0D1425]/70 border border-white/5 p-6 rounded-3xl relative">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-[#0DFFD4]/5 rounded-full blur-xl overflow-hidden pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#0DFFD4]/10 text-[#0DFFD4] rounded-2xl border border-[#0DFFD4]/10">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-sans tracking-tight">Performance Analytics</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
              Real-time calculations of task progress, daily activity curves, on-time rates, and weekly coaching insights driven by Gemini.
            </p>
          </div>
        </div>

        {/* Actions & Badges */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-3 relative z-10">
          
          {/* Download Report Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="px-4 py-2.5 bg-gradient-to-r from-[#00D4FF]/20 to-[#0DFFD4]/20 hover:from-[#00D4FF]/30 hover:to-[#0DFFD4]/30 border border-[#00D4FF]/30 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-[#00D4FF]/5 cursor-pointer"
              title="Download your productivity metrics"
            >
              <Download className="w-4 h-4 text-[#00D4FF]" />
              <span>DOWNLOAD REPORT</span>
            </button>
            
            <AnimatePresence>
              {showDownloadMenu && (
                <>
                  {/* Backdrop click closer */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDownloadMenu(false)} 
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-[#0A0F1E] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-white/5 bg-[#050810]">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                        Select Format
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        handleDownload("csv");
                        setShowDownloadMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-sans text-slate-200 hover:bg-[#00D4FF]/10 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="text-[#00D4FF]">📊</span>
                      <span>Export as CSV (.csv)</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDownload("json");
                        setShowDownloadMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-sans text-slate-200 hover:bg-[#0DFFD4]/10 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="text-[#0DFFD4]">⚡</span>
                      <span>Export as JSON (.json)</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Live / Demo Mode indicator badge */}
          <div>
            {isSimulation ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-mono rounded-xl font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                SIMULATION CONSOLE (DEMO)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0DFFD4]/15 border border-[#0DFFD4]/25 text-[#0DFFD4] text-[10px] font-mono rounded-xl font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0DFFD4] animate-pulse" />
                LIVE TELEMETRY PORTAL
              </span>
            )}
          </div>
        </div>
      </div>

      {isSimulation && (
        <div className="p-4 bg-blue-950/15 border border-blue-500/20 rounded-2xl text-xs text-slate-355 leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="w-4.5 h-4.5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
          <span>
            <strong>No completed tasks yet.</strong> To demonstrate the visual capabilities of this dashboard, the graphs are currently visualizing an idealized <strong>Mock Productivity Simulation</strong>. Try modifying and completing a pending deadline to unlock fully real-time statistics!
          </span>
        </div>
      )}

      {/* High-Level Premium Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#0D1425]/45 border border-white/5 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">TARGETS CLEARED</span>
            <span className="text-xs text-slate-400 font-sans block">Completed Task Count</span>
          </div>
          <span className="text-3xl font-mono font-black text-[#0DFFD4]">{isSimulation ? 10 : completedTasks.length}</span>
        </div>

        <div className="bg-[#0D1425]/45 border border-white/5 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">ON-TIME FINISH</span>
            <span className="text-xs text-slate-400 font-sans block">On-Time Completion Rate</span>
          </div>
          <span className="text-3xl font-mono font-black text-[#00D4FF]">{onTimePercentage}%</span>
        </div>

        <div className="bg-[#0D1425]/45 border border-white/5 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">AVG FOCUS TIME</span>
            <span className="text-xs text-slate-400 font-sans block">Average Focus Time per Task</span>
          </div>
          <span className="text-3xl font-mono font-black text-amber-400">{formatSeconds(avgSecondsSpent)}</span>
        </div>
      </div>

      {/* Main Stats layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Data Graphs (Cols 8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Tasks completed this week Bar Chart */}
            <div className="bg-[#0D1425]/45 border border-white/5 p-5 rounded-3xl flex flex-col h-80 shadow-md">
              <div className="mb-4">
                <span className="text-[9px] font-mono text-slate-400 tracking-wider font-bold block uppercase mb-1">
                  WEEKLY FREQUENCY
                </span>
                <span className="text-xs font-bold text-white font-sans">
                  Completed Tasks Distribution
                </span>
              </div>

              <div className="flex-1 min-h-0 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finalBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#475569" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0A0F1E", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px" }}
                      itemStyle={{ color: "#00D4FF", fontSize: "11px", fontFamily: "sans-serif" }}
                      labelStyle={{ color: "#fff", fontSize: "11px", fontFamily: "monospace" }}
                    />
                    <Bar 
                      dataKey="Completions" 
                      fill="#00D4FF" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. On-Time vs Late donut chart */}
            <div className="bg-[#0D1425]/45 border border-white/5 p-5 rounded-3xl flex flex-col h-80 shadow-md">
              <div className="mb-2">
                <span className="text-[9px] font-mono text-slate-400 tracking-wider font-bold block uppercase mb-1">
                  COMPLIANCE telemetry
                </span>
                <span className="text-xs font-bold text-white font-sans">
                  On-Time vs Late Completion Rate
                </span>
              </div>

              <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={finalPieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {finalPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v) => `${v}%`}
                      contentStyle={{ backgroundColor: "#0A0F1E", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px" }}
                      itemStyle={{ fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center metric label block */}
                <div className="absolute top-[40%] translate-y-[-50%] flex flex-col items-center">
                  <span className="text-xl font-mono font-black text-white">{onTimePercentage}%</span>
                  <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">ON-TIME</span>
                </div>
              </div>

              {/* Legends */}
              <div className="flex justify-center gap-6 mt-2 pt-2 border-t border-white/5 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00D4FF]" />
                  <span className="text-slate-350">On-Time ({isSimulation ? 8 : onTimeCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5E5E]" />
                  <span className="text-slate-350">Late ({isSimulation ? 2 : lateCount})</span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Productive Time of Day Bento Grid */}
          <div className="bg-[#0D1425]/45 border border-white/5 p-5 rounded-3xl space-y-4">
            <div>
              <span className="text-[9px] font-mono text-slate-400 tracking-wider font-bold block uppercase mb-1">
                MOST PRODUCTIVE HOURS
              </span>
              <span className="text-xs font-bold text-white font-sans">
                Most Productive Time of Day
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Morning Block */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between h-28 relative overflow-hidden transition ${
                peakTimeOfDay === "Morning" 
                  ? "bg-gradient-to-br from-[#00D4FF]/10 to-transparent border-[#00D4FF]/30 ring-1 ring-[#00D4FF]/25 shadow-lg shadow-[#00D4FF]/5" 
                  : "bg-black/20 border-white/5"
              }`}>
                {peakTimeOfDay === "Morning" && (
                  <div className="absolute top-1 right-2 text-[8px] font-mono font-black bg-[#00D4FF]/20 text-[#00D4FF] px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Peak
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                    Morning
                  </span>
                  <span className="text-[9.5px] font-sans text-slate-500 tracking-tight block">
                    05:00 AM - 11:59 AM
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <Clock className={`w-4 h-4 ${peakTimeOfDay === "Morning" ? "text-[#00D4FF]" : "text-slate-650"}`} />
                  <span className="text-lg font-mono font-black text-white">{finalTimeCounts.Morning}</span>
                </div>
              </div>

              {/* Afternoon Block */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between h-28 relative overflow-hidden transition ${
                peakTimeOfDay === "Afternoon" 
                  ? "bg-gradient-to-br from-[#0DFFD4]/10 to-transparent border-[#0DFFD4]/30 ring-1 ring-[#0DFFD4]/25 shadow-lg shadow-[#0DFFD4]/5" 
                  : "bg-black/20 border-white/5"
              }`}>
                {peakTimeOfDay === "Afternoon" && (
                  <div className="absolute top-1 right-2 text-[8px] font-mono font-black bg-[#0DFFD4]/20 text-[#0DFFD4] px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Peak
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                    Afternoon
                  </span>
                  <span className="text-[9.5px] font-sans text-slate-500 tracking-tight block">
                    12:00 PM - 05:59 PM
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <Clock className={`w-4 h-4 ${peakTimeOfDay === "Afternoon" ? "text-[#0DFFD4]" : "text-slate-650"}`} />
                  <span className="text-lg font-mono font-black text-white">{finalTimeCounts.Afternoon}</span>
                </div>
              </div>

              {/* Evening Block */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between h-28 relative overflow-hidden transition ${
                peakTimeOfDay === "Evening" 
                  ? "bg-gradient-to-br from-[#00D4FF]/10 to-transparent border-[#00D4FF]/30 ring-1 ring-[#00D4FF]/25 shadow-lg shadow-[#00D4FF]/5" 
                  : "bg-black/20 border-white/5"
              }`}>
                {peakTimeOfDay === "Evening" && (
                  <div className="absolute top-1 right-2 text-[8px] font-mono font-black bg-[#00D4FF]/20 text-[#00D4FF] px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Peak
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                    Evening
                  </span>
                  <span className="text-[9.5px] font-sans text-slate-500 tracking-tight block">
                    06:00 PM - 10:59 PM
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <Clock className={`w-4 h-4 ${peakTimeOfDay === "Evening" ? "text-[#00D4FF]" : "text-slate-650"}`} />
                  <span className="text-lg font-mono font-black text-white">{finalTimeCounts.Evening}</span>
                </div>
              </div>

              {/* Night Block */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between h-28 relative overflow-hidden transition ${
                peakTimeOfDay === "Night" 
                  ? "bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/30 ring-1 ring-indigo-500/25 shadow-lg shadow-indigo-500/5" 
                  : "bg-black/20 border-white/5"
              }`}>
                {peakTimeOfDay === "Night" && (
                  <div className="absolute top-1 right-2 text-[8px] font-mono font-black bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Peak
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                    Night
                  </span>
                  <span className="text-[9.5px] font-sans text-slate-500 tracking-tight block">
                    11:00 PM - 04:59 AM
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <Clock className={`w-4 h-4 ${peakTimeOfDay === "Night" ? "text-indigo-400" : "text-slate-650"}`} />
                  <span className="text-lg font-mono font-black text-white">{finalTimeCounts.Night}</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Gemini Advisor & Dynamic Insights Panel (Cols 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0C1425]/90 border border-white/5 p-6 rounded-3xl relative overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.2)]">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[#00D4FF]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-[#0DFFD4]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#0DFFD4] animate-pulse" />
              <h4 className="text-xs font-mono font-bold text-slate-400 tracking-widest uppercase">
                ADVISORY ENGINE
              </h4>
            </div>

            {insightLoading ? (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-8 h-8 text-[#00D4FF] animate-spin" />
                <div>
                  <p className="text-xs text-white font-semibold">Generating Advisory Review</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 select-none uppercase tracking-widest">
                    Scanning completed task timezones...
                  </p>
                </div>
              </div>
            ) : advisorInsight ? (
              <div className="space-y-6">
                
                {/* Advisor Status Display Card */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative pt-5">
                  <span className="absolute -top-2 left-4 bg-[#0C1425] text-[8px] font-mono text-[#00D4FF] font-black uppercase tracking-widest px-1.5">
                    Gemini Advisor
                  </span>
                  
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    "{advisorInsight}"
                  </p>
                </div>

                {/* Cognitive recommendations box */}
                <div className="space-y-3">
                  <h5 className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest">
                    Suggested action targets
                  </h5>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-black/25 rounded-xl text-xs text-slate-350 leading-relaxed border border-white/3 flex gap-2 items-start">
                      <span className="text-[#0DFFD4] font-bold font-mono">▸</span>
                      <span>
                        Use time blocking to freeze notifications during your peak performance period of <strong>{peakTimeOfDay}s</strong>.
                      </span>
                    </div>

                    <div className="p-3 bg-black/25 rounded-xl text-xs text-slate-350 leading-relaxed border border-white/3 flex gap-2 items-start">
                      <span className="text-[#0DFFD4] font-bold font-mono">▸</span>
                      <span>
                        Set deadline buffers 2 hours earlier to elevate your on-time execution of critical tasks.
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={fetchAdvisorInsight}
                  className="w-full py-2.5 bg-gradient-to-r from-[#00D4FF]/10 to-[#0DFFD4]/10 hover:from-[#00D4FF]/15 hover:to-[#0DFFD4]/15 border border-[#00D4FF]/20 text-[#00D4FF] hover:text-white transition duration-200 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  REFRESH COACH INSIGHTS
                </button>

              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <HelpCircle className="w-10 h-10 text-slate-650 mx-auto" />
                <div>
                  <p className="text-xs text-slate-400">Advisory Review Unavailable</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase mt-1 select-none max-w-xs mx-auto leading-relaxed">
                    Log and complete your tasks to receive personal coaching feedback.
                  </p>
                </div>
              </div>
            )}

            {/* Quick summary metrics */}
            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] font-mono text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>TOTAL REGISTERED TASKS:</span>
                <span className="text-slate-350">{totalTasksCount}</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL COMPLETED:</span>
                <span className="text-slate-350">{completedTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>PEAK EFFICIENCY:</span>
                <span className="text-[#0DFFD4] font-bold uppercase">{peakTimeOfDay}S</span>
              </div>
              <div className="flex justify-between">
                <span>AVG FOCUS TIME / TASK:</span>
                <span className="text-amber-400 font-bold">{formatSeconds(avgSecondsSpent)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
