import React from "react";
import { Task } from "../types";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface UrgencyMeterProps {
  tasks: Task[];
}

export const UrgencyMeter: React.FC<UrgencyMeterProps> = ({ tasks }) => {
  const { isDark } = useTheme();
  const now = new Date().getTime();

  let overdueCount = 0;
  let dueSoonCount = 0;
  let onTrackCount = 0;

  const incompleteTasks = tasks.filter(t => !t.completed);

  incompleteTasks.forEach(task => {
    if (!task.deadline) {
      onTrackCount++;
      return;
    }
    
    const deadlineTime = new Date(task.deadline).getTime();
    const diffMs = deadlineTime - now;

    if (diffMs < 0) {
      overdueCount++;
    } else if (diffMs <= 24 * 60 * 60 * 1000) { // next 24 hours
      dueSoonCount++;
    } else {
      onTrackCount++;
    }
  });

  const totalIncomplete = incompleteTasks.length;
  const overduePercent = totalIncomplete ? (overdueCount / totalIncomplete) * 100 : 0;
  const dueSoonPercent = totalIncomplete ? (dueSoonCount / totalIncomplete) * 100 : 0;
  const onTrackPercent = totalIncomplete ? (onTrackCount / totalIncomplete) * 100 : 0;

  return (
    <div className={`p-4 md:p-6 rounded-2xl flex flex-col gap-5 relative overflow-hidden task-card-hover border ${isDark ? 'glass glow-shadow border-transparent' : 'bg-[#FFFFFF] border-[#E2E8F0] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'}`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${isDark ? 'bg-[#00D4FF]' : 'bg-[#0891B2]'}`} />
      
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-xs font-mono tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>Urgency Meter</h3>
          <p className={`text-lg md:text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Today's Focus</p>
        </div>
        <div className="text-right">
          <span className={`text-xs font-mono ${isDark ? 'text-slate-550' : 'text-[#94A3B8]'}`}>LIVE</span>
        </div>
      </div>

      {/* Progress Bars Stack */}
      <div className="space-y-4">
        {/* Overdue (Red) */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-red-500 font-medium font-mono">
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
              LATE TASKS
            </span>
            <span className="font-bold text-red-500 font-mono">{overdueCount} {overdueCount === 1 ? 'Task' : 'Tasks'}</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-[#E2E8F0]'}`}>
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-500" 
              style={{ width: `${overduePercent || 0}%`, boxShadow: isDark ? "0 0 10px rgba(239, 68, 68, 0.7)" : "none" }}
            />
          </div>
        </div>

        {/* Due Soon (Orange) */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-orange-500 font-medium font-mono">
              <Clock className="w-3.5 h-3.5" />
              DUE WITHIN 24H
            </span>
            <span className="font-bold text-orange-500 font-mono">{dueSoonCount} {dueSoonCount === 1 ? 'Task' : 'Tasks'}</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-[#E2E8F0]'}`}>
            <div 
              className="h-full bg-orange-500 rounded-full transition-all duration-500" 
              style={{ width: `${dueSoonPercent || 0}%` }}
            />
          </div>
        </div>

        {/* On Track (Green) */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-emerald-500 font-medium font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ON TRACK
            </span>
            <span className="font-bold text-emerald-500 font-mono">{onTrackCount} {onTrackCount === 1 ? 'Task' : 'Tasks'}</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-[#E2E8F0]'}`}>
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${onTrackPercent || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${isDark ? 'bg-white/5 border-white/5' : 'bg-[#F1F5F9] border-[#E2E8F0]'}`}>
        <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-[#475569]'}`}>Overall Progress:</span>
        <span className={`font-bold font-mono ${isDark ? 'text-[#00D4FF]' : 'text-[#0891B2]'}`}>
          {tasks.length > 0 
            ? `${Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}% Complete` 
            : "No tasks yet"}
        </span>
      </div>
    </div>
  );
};

