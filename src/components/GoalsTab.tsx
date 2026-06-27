import React, { useState } from "react";
import { useGoalsAndHabits } from "../hooks/useGoalsAndHabits";
import { useAuth } from "../hooks/useAuth";
import { 
  Award, 
  Flame, 
  Sparkles, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Calendar,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Get dates for Mon - Sun of the current week in local timezone
function getCurrentWeekDates() {
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sun, 1 is Mon, etc.
  // Adjust so Monday is index 0
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMonday);

  const days = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Format today's date in local YYYY-MM-DD
  const yyyyToday = today.getFullYear();
  const mmToday = String(today.getMonth() + 1).padStart(2, "0");
  const ddToday = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyyToday}-${mmToday}-${ddToday}`;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    days.push({
      name: dayNames[i],
      dateStr: formattedDate,
      dayOfMonth: d.getDate(),
      isToday: formattedDate === todayStr
    });
  }
  return days;
}

export function GoalsTab() {
  const { profile } = useAuth();
  const { 
    goals, 
    loading, 
    weeklyConsistencyScore, 
    weeklyInsight, 
    insightLoading, 
    addGoal, 
    toggleGoalDate, 
    deleteGoal,
    refreshAIInsight
  } = useGoalsAndHabits();

  // Create form states
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"goal" | "habit">("goal");
  const [targetDays, setTargetDays] = useState(3);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const weekDays = getCurrentWeekDates();

  // Filter lists
  const weeklyGoalsList = goals.filter(g => g.type === "goal");
  const dailyHabitsList = goals.filter(g => g.type === "habit");

  // Sum active streaks to show an awesome total stat
  const globalStreak = dailyHabitsList.length > 0 
    ? Math.max(...dailyHabitsList.map(h => h.streak || 0), 0)
    : 0;

  // Handle adding a goal/habit
  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMessage("Please enter a clear title description.");
      return;
    }
    
    try {
      setErrorMessage("");
      await addGoal(newTitle.trim(), newType, targetDays);
      setNewTitle("");
      setIsAdding(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add.");
    }
  };

  // Check if date is completed for a goal/habit
  const isDateCompleted = (goalId: string, dateStr: string) => {
    const goal = goals.find(g => g.id === goalId);
    return goal ? (goal.completedDays || []).includes(dateStr) : false;
  };

  // Get current week completion count for a goal
  const getWeeklyCompletedCount = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return 0;
    const completedSet = new Set(goal.completedDays || []);
    return weekDays.filter(day => completedSet.has(day.dateStr)).length;
  };

  return (
    <div className="space-y-8" id="goals-tab-container">
      
      {/* Top Banner introducing Goal Strategy and Dynamic Duolingo Streaks */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#0D1425]/70 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-[#00D4FF]/5 rounded-full blur-xl" />
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#00D4FF]/10 text-[#00D4FF] rounded-2xl border border-[#00D4FF]/10">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-sans tracking-tight">Focus Milestones & Habits</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
              Define target weekly goals or daily habits. Tick off days in the Mon-Sun tracker to build active streaks and receive personalized coaching advice from Gemini.
            </p>
          </div>
        </div>

        {/* Global Duo-style Streak Counter */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/25 px-5 py-3 rounded-2xl self-stretch md:self-auto justify-center">
          <div className="relative">
            <Flame className="w-7 h-7 text-orange-500 fill-current animate-bounce" />
            <div className="absolute inset-0 bg-orange-500/15 rounded-full filter blur-md animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest leading-none">
              HERO STREAK
            </div>
            <div className="text-lg font-mono font-black text-orange-400 leading-none mt-1">
              {globalStreak} DAYS
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Goals & Habits Trackers (Cols 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-slate-400 tracking-widest uppercase">
              ACTIVE ROUTINES ({goals.length})
            </h4>
            
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] text-[#0A0F1E] font-sans font-bold text-xs rounded-xl flex items-center gap-1.5 hover:shadow-[0_0_20px_rgba(0,212,255,0.25)] transition duration-300 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              ADD ROUTINE
            </button>
          </div>

          {/* Inline Addition Panel */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form 
                  onSubmit={handleAddNew}
                  className="bg-[#0D1425]/40 border border-[#00D4FF]/20 p-5 rounded-3xl space-y-4"
                >
                  <h5 className="text-xs font-mono font-bold text-[#00D4FF] tracking-wider uppercase">
                    Initialize New Routine
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                        Routine Label
                      </label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Read research paper, Hit gym, Code 2 hours"
                        className="w-full bg-[#0A0F1E] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#00D4FF]/40"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                        Routine Type
                      </label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as "goal" | "habit")}
                        className="w-full bg-[#0A0F1E] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-350 focus:outline-none"
                      >
                        <option value="goal">Weekly Goal</option>
                        <option value="habit">Daily Habit</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      {newType === "goal" ? (
                        <>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                            Target / Week
                          </label>
                          <select
                            value={targetDays}
                            onChange={(e) => setTargetDays(Number(e.target.value))}
                            className="w-full bg-[#0A0F1E] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-350 focus:outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7].map(n => (
                              <option key={n} value={n}>{n} days</option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                            Target / Week
                          </label>
                          <input
                            type="text"
                            disabled
                            value="Daily (7)"
                            className="w-full bg-[#0A0F1E]/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-500 focus:outline-none cursor-not-allowed"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="text-red-400 font-mono text-[11px] flex items-center gap-1.5 pt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errorMessage}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white transition text-xs font-mono"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-white/10 text-white hover:bg-white/15 transition rounded-xl text-xs font-sans font-bold"
                    >
                      ADD ROUTINE
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loader or Empty State */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs animate-pulse">
              SYNCING ACTIVE ROUTINES WITH FIRESTORE...
            </div>
          ) : goals.length === 0 ? (
            <div className="bg-[#0D1425]/20 border border-white/5 rounded-3xl p-12 text-center">
              <Calendar className="w-10 h-10 text-slate-650 mx-auto mb-4" />
              <h5 className="text-sm font-semibold text-slate-300">Your Routine Board is Clear</h5>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                Add a weekly goal (e.g. read, exercise) or daily habit to unlock active tracking.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* HABITS SECTION */}
              {dailyHabitsList.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">Daily Habits</h5>
                  </div>
                  
                  {dailyHabitsList.map((habit) => (
                    <div 
                      key={habit.id}
                      className="bg-[#0D1425]/45 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 task-card-hover hover:border-[#00D4FF]/10"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-sans">{habit.title}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-400 font-mono text-[9px] rounded-lg border border-orange-500/20 font-black">
                            <Flame className="w-3 h-3 fill-current" /> {habit.streak || 0}D STREAK
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                          LAST CHECK-IN: {habit.completedDays && habit.completedDays.length > 0 ? habit.completedDays[habit.completedDays.length - 1] : "NEVER"}
                        </p>
                      </div>

                      {/* Interactive Calendar Days */}
                      <div className="flex items-center gap-2 self-stretch md:self-auto justify-between overflow-x-auto py-1">
                        {weekDays.map((day) => {
                          const completed = isDateCompleted(habit.id, day.dateStr);
                          return (
                            <button
                              key={day.dateStr}
                              onClick={() => toggleGoalDate(habit.id, day.dateStr)}
                              className={`w-9 h-11 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer border select-none ${
                                completed
                                  ? "bg-gradient-to-b from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-400 font-bold"
                                  : day.isToday
                                    ? "bg-[#00D4FF]/5 border-[#00D4FF]/30 text-[#00D4FF]"
                                    : "bg-black/20 border-white/5 text-slate-400 hover:border-slate-700"
                              }`}
                              title={`${day.name} (${day.dateStr}) - Click to toggle completion`}
                            >
                              <span className="text-[8px] font-mono leading-none tracking-tight uppercase">
                                {day.name}
                              </span>
                              <span className="text-xs font-mono font-bold mt-1 leading-none">
                                {day.dayOfMonth}
                              </span>
                            </button>
                          );
                        })}

                        {/* Delete Control */}
                        <button
                          onClick={() => deleteGoal(habit.id)}
                          className="p-2 text-slate-600 hover:text-red-400 rounded-lg hover:bg-white/5 transition ml-2 cursor-pointer"
                          title="Delete Habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* WEEKLY GOALS SECTION */}
              {weeklyGoalsList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                    <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">Weekly Goals</h5>
                  </div>

                  {weeklyGoalsList.map((goal) => {
                    const completedThisWeek = getWeeklyCompletedCount(goal.id);
                    const target = goal.targetDays || 3;
                    const completionRatio = Math.min(100, Math.floor((completedThisWeek / target) * 100));
                    const isFullySucceeded = completedThisWeek >= target;

                    return (
                      <div 
                        key={goal.id}
                        className="bg-[#0D1425]/45 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 task-card-hover hover:border-[#00D4FF]/10"
                      >
                        <div className="space-y-2 flex-grow max-w-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white font-sans">{goal.title}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] rounded-lg border font-black ${
                              isFullySucceeded 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}>
                              {completedThisWeek} / {target} DAYS
                            </span>
                          </div>

                          {/* Minimalist Progress track */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase">
                              <span>Weekly progress</span>
                              <span className={isFullySucceeded ? "text-emerald-400 font-bold" : ""}>
                                {completionRatio}% {isFullySucceeded && "— GOAL HIT!"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-black/35 rounded-full overflow-hidden border border-white/5">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isFullySucceeded 
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                                    : "bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4]"
                                }`}
                                style={{ width: `${completionRatio}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Calendar Grid for Goals */}
                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between overflow-x-auto py-1">
                          {weekDays.map((day) => {
                            const completed = isDateCompleted(goal.id, day.dateStr);
                            return (
                              <button
                                key={day.dateStr}
                                onClick={() => toggleGoalDate(goal.id, day.dateStr)}
                                className={`w-9 h-11 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer border select-none ${
                                  completed
                                    ? "bg-gradient-to-b from-[#00D4FF]/20 to-[#0DFFD4]/20 border-[#00D4FF]/40 text-[#00D4FF] font-bold"
                                    : day.isToday
                                      ? "bg-[#00D4FF]/5 border-[#00D4FF]/30 text-[#00D4FF]"
                                      : "bg-black/20 border-white/5 text-slate-400 hover:border-slate-700"
                                }`}
                                title={`${day.name} (${day.dateStr}) - Click to log completion`}
                              >
                                <span className="text-[8px] font-mono leading-none tracking-tight uppercase">
                                  {day.name}
                                </span>
                                <span className="text-xs font-mono font-bold mt-1 leading-none">
                                  {day.dayOfMonth}
                                </span>
                              </button>
                            );
                          })}

                          {/* Delete Goal */}
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="p-2 text-slate-600 hover:text-red-400 rounded-lg hover:bg-white/5 transition ml-2 cursor-pointer"
                            title="Delete Goal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Gemini Consistency Score & Insights (Cols 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-b from-[#0D1425]/90 to-[#0A0E1A]/85 border border-white/5 p-6 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
            {/* Background design glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[#00D4FF]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-[#0DFFD4]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4.5 h-4.5 text-[#0DFFD4] animate-pulse" />
              <h4 className="text-xs font-mono font-bold text-slate-400 tracking-widest uppercase">
                AI COACH INSIGHTS
              </h4>
            </div>

            {insightLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <RefreshCw className="w-8 h-8 text-[#00D4FF] animate-spin" />
                <div>
                  <p className="text-xs text-white font-semibold">Analyzing Weekly Habits</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-wider">
                    Consulting with AI Coach...
                  </p>
                </div>
              </div>
            ) : weeklyConsistencyScore !== null ? (
              <div className="space-y-6">
                
                {/* Score Dial Circle */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* Progress track circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="62"
                        stroke="#0D1425"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="62"
                        stroke="url(#geminiGradient)"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 62}
                        strokeDashoffset={2 * Math.PI * 62 * (1 - weeklyConsistencyScore / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00D4FF" />
                          <stop offset="100%" stopColor="#0DFFD4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Centered statistics */}
                    <div className="absolute flex flex-col items-center justify-center leading-none">
                      <span className="text-3xl font-mono font-black text-white">
                        {weeklyConsistencyScore}%
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1.5">
                        CONSISTENCY
                      </span>
                    </div>
                  </div>

                  {/* Status appraisal badges */}
                  <div className="mt-4">
                    <span className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest font-black rounded-lg border ${
                      weeklyConsistencyScore >= 80
                        ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                        : weeklyConsistencyScore >= 50
                          ? "bg-orange-500/10 text-orange-450 border-orange-500/20"
                          : "bg-red-500/10 text-red-450 border-red-500/20"
                    }`}>
                      {weeklyConsistencyScore >= 80 
                        ? "OPTIMIZED STRATEGY" 
                        : weeklyConsistencyScore >= 50 
                          ? "STABLE Pace" 
                          : "RE-CALIBRATION REQUIRED"}
                    </span>
                  </div>
                </div>

                {/* Cognitive Insight Box */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative">
                  <span className="absolute -top-2 left-4 px-2 bg-[#0C152C] text-[8.5px] font-mono text-[#0DFFD4] font-black uppercase tracking-widest">
                    Gemini Insight
                  </span>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                    {weeklyInsight}
                  </p>
                </div>

                {/* Audit trigger */}
                <button
                  onClick={refreshAIInsight}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20 transition rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  RE-AUDIT ROUTINES
                </button>
                
              </div>
            ) : (
              <div className="py-10 text-center space-y-4">
                <HelpCircle className="w-10 h-10 text-slate-650 mx-auto" />
                <div>
                  <p className="text-xs text-slate-400">No Assessment Loaded</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase max-w-xs mx-auto leading-relaxed">
                    Check off days inside your active routines board to launch consistency advisor telemetry.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
