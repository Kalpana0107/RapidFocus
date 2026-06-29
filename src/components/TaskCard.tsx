import React, { useState } from "react";
import { Task } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Trash2, 
  Check, 
  Clock, 
  Sparkles, 
  Info,
  ChevronDown,
  ChevronUp,
  Edit3
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onSelect?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onToggleComplete, 
  onDelete,
  onEdit,
  onSelect
}) => {
  const [showAIReasoning, setShowAIReasoning] = useState(false);
  const { isDark } = useTheme();

  // Status computation
  const now = new Date().getTime();
  const hasDeadline = !!task.deadline;
  const deadlineTime = hasDeadline ? new Date(task.deadline).getTime() : 0;
  const isOverdue = !task.completed && hasDeadline && (deadlineTime < now);
  const isDueSoon = !task.completed && hasDeadline && (!isOverdue && (deadlineTime - now <= 24 * 60 * 60 * 1000));
  
  let indicatorBorder = "border-l-4 border-l-emerald-500";
  if (task.completed) {
    indicatorBorder = isDark ? "border-l-4 border-l-gray-600" : "border-l-4 border-l-slate-300";
  } else if (isOverdue) {
    indicatorBorder = isDark ? "border-l-4 border-l-red-500 glow-shadow shadow-red-500/10" : "border-l-4 border-l-red-500 shadow-sm shadow-red-100";
  } else if (isDueSoon) {
    indicatorBorder = isDark ? "border-l-4 border-l-orange-500 shadow-orange-500/5" : "border-l-4 border-l-orange-500 shadow-sm shadow-orange-100";
  } else {
    indicatorBorder = isDark ? "border-l-4 border-l-[#00D4FF] shadow-[#00D4FF]/5" : "border-l-4 border-l-[#0891B2] shadow-sm shadow-[#BAE6FD]";
  }

  // Formatting due date
  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return "Continuous Op";
    const date = new Date(dateStr);
    
    // Check if valid date
    if (isNaN(date.getTime())) return dateStr;

    const diff = date.getTime() - now;
    const hours = Math.round(diff / (1000 * 60 * 60));
    
    if (task.completed) {
      return `Cleared at ${new Date(task.completedAt || dateStr).toLocaleDateString()}`;
    }

    if (hours < 0) {
      return `Overdue by ${Math.abs(hours)}h`;
    }
    if (hours === 0) {
      return "Critical: Due within the hour";
    }
    if (hours < 24) {
      return `Due in ${hours}h`;
    }
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // Score colors
  const getScoreColor = (score?: number) => {
    if (!score) return isDark ? "text-gray-500 bg-gray-500/10 border-gray-500/20" : "text-slate-500 bg-slate-100 border-slate-200";
    if (score >= 8) return isDark ? "text-red-400 bg-red-500/20 border-red-500/30" : "text-red-600 bg-red-50 border-red-200";
    if (score >= 5) return isDark ? "text-orange-400 bg-orange-500/20 border-orange-500/30" : "text-orange-600 bg-orange-50 border-orange-200";
    return isDark ? "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" : "text-emerald-600 bg-emerald-50 border-emerald-200";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.25 }}
      id={`task-card-${task.id}`}
      onClick={() => onSelect?.(task)}
      className={`relative group rounded-r-2xl rounded-l-md border-y border-r p-5 flex flex-col gap-3 ${indicatorBorder} transition-all duration-300 cursor-pointer ${
        isDark 
          ? 'bg-[#0D1425]/60 backdrop-blur-md border-white/5 hover:border-white/10 hover:bg-[#0D1425]/80' 
          : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#0891B2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
      } ${task.completed ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Toggle + text block */}
        <div className="flex items-start gap-3.5 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id, !task.completed);
            }}
            className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
              task.completed 
                ? (isDark ? "bg-[#00D4FF] border-[#00D4FF] text-[#0A0F1E]" : "bg-[#0891B2] border-[#0891B2] text-white")
                : (isDark ? "border-gray-500 hover:border-[#00D4FF] bg-slate-900/40" : "border-[#CBD5E1] hover:border-[#0891B2] bg-[#F1F5F9]")
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <div className="space-y-1">
            <h4 className={`text-base font-bold transition-all leading-tight ${
              task.completed 
                ? (isDark ? "line-through text-gray-500 font-medium" : "line-through text-slate-400 font-medium") 
                : (isDark ? "text-white" : "text-[#0F172A]")
            }`}>
              {task.title}
            </h4>
            <p className={`text-xs ${
              task.completed 
                ? (isDark ? "text-gray-600" : "text-slate-400") 
                : (isDark ? "text-slate-300" : "text-[#475569]")
            }`}>
              {task.description}
            </p>
          </div>
        </div>

        {/* Actions Button Panel */}
        <div className="flex items-center gap-1">
          {/* Edit Control */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(task);
            }}
            className={`md:opacity-0 md:group-hover:opacity-100 transition-all p-1.5 rounded-lg cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-[#00D4FF] hover:bg-white/5' : 'text-[#64748B] hover:text-[#0891B2] hover:bg-slate-100'
            }`}
            title="Recalibrate / Edit Task"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete Control */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className={`md:opacity-0 md:group-hover:opacity-100 transition-all p-1.5 rounded-lg cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-red-400 hover:bg-white/5' : 'text-[#64748B] hover:text-red-500 hover:bg-slate-100'
            }`}
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Badges / Meta Info */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-xs ${isDark ? 'border-white/5 text-slate-400' : 'border-[#E2E8F0] text-[#64748B]'}`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Green checkmark ✅ badge */}
          {task.completed && (
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase flex items-center gap-1 border ${
              isDark ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              ✅ Completed
            </span>
          )}

          {/* Custom Category Badge */}
          {task.category && (
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider uppercase border ${
              isDark ? 'bg-white/5 border-white/5 text-[#0DFFD4]' : 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0891B2]'
            }`}>
              {task.category}
            </span>
          )}

          {/* User Priority Designation */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase border ${
            task.priority === "Critical" 
              ? (isDark ? "text-red-400 bg-red-950/40 border-red-500/20" : "text-red-600 bg-red-50 border-red-200") :
            task.priority === "High" 
              ? (isDark ? "text-orange-400 bg-orange-950/40 border-orange-500/20" : "text-orange-600 bg-orange-50 border-orange-200") :
            task.priority === "Medium" 
              ? (isDark ? "text-amber-400 bg-amber-950/40 border border-amber-500/20" : "text-amber-600 bg-amber-50 border-amber-200") :
            (isDark ? "text-emerald-400 bg-emerald-950/40 border border-emerald-500/20" : "text-emerald-600 bg-emerald-50 border-emerald-200")
          }`}>
            {task.priority}
          </span>

          {/* AI Prioritization Indicator */}
          {task.aiPriorityScore !== undefined && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowAIReasoning(!showAIReasoning);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] cursor-pointer font-bold font-mono transition ${getScoreColor(task.aiPriorityScore)}`}
            >
              <Sparkles className={`w-3 h-3 ${isDark ? 'text-[#00D4FF]' : 'text-[#0891B2]'}`} />
              AI CORE: {task.aiPriorityScore}/10
              {showAIReasoning ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </div>
          )}
        </div>

        {/* Real Deadline */}
        <div className={`flex items-center gap-1.5 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
          <Calendar className={`w-3.5 h-3.5 ${task.completed ? "text-emerald-400" : (isDark ? "text-[#00D4FF]" : "text-[#0891B2]")}`} />
          <span className={task.completed ? "text-emerald-400" : isOverdue ? "text-red-500 font-bold" : isDueSoon ? "text-orange-500 font-bold" : ""}>
            {task.completed 
              ? `Completed on ${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}`
              : formatDeadline(task.deadline)
            }
          </span>
        </div>
      </div>

      {/* Suggested Time block by AI coaches */}
      {task.suggestedTimeBlock && (
        <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
          task.completed 
            ? (isDark ? "bg-white/5 border-white/5 text-slate-500" : "bg-slate-50 border-slate-200 text-[#94A3B8]") 
            : (isDark ? "bg-[#00D4FF]/5 border-[#00D4FF]/10 text-[#00D4FF]" : "bg-[#F0F9FF] border-[#BAE6FD] text-[#0891B2]")
        }`}>
          <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${task.completed ? "text-slate-500" : (isDark ? "animate-pulse text-[#00D4FF]" : "animate-pulse text-[#0891B2]")}`} />
          <span className="font-mono text-[11px]">
            AI RECOMMENDED WORK BLOCK: <strong className={`${task.completed ? (isDark ? "text-slate-400" : "text-slate-500") : (isDark ? "text-white" : "text-[#0C4A6E]")} font-semibold`}>{task.suggestedTimeBlock}</strong>
          </span>
        </div>
      )}

      {/* Expandable AI Reasoning panel */}
      <AnimatePresence>
        {showAIReasoning && task.aiReasoning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`overflow-hidden rounded-xl border p-3 flex gap-2.5 text-xs leading-relaxed ${isDark ? 'bg-slate-900/60 border-[#00D4FF]/10 text-slate-300' : 'bg-[#F8FAFF] border-[#BAE6FD] text-[#475569]'}`}
          >
            <Info className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-[#00D4FF]' : 'text-[#0891B2]'}`} />
            <div>
              <span className={`font-bold block mb-0.5 font-mono ${isDark ? 'text-[#00D4FF]' : 'text-[#0891B2]'}`}>COACH INSIGHT:</span>
              {task.aiReasoning}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

