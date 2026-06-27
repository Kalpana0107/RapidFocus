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

  // Status computation
  const now = new Date().getTime();
  const hasDeadline = !!task.deadline;
  const deadlineTime = hasDeadline ? new Date(task.deadline).getTime() : 0;
  const isOverdue = !task.completed && hasDeadline && (deadlineTime < now);
  const isDueSoon = !task.completed && hasDeadline && (!isOverdue && (deadlineTime - now <= 24 * 60 * 60 * 1000));
  
  let indicatorBorder = "border-l-4 border-l-emerald-500";
  if (task.completed) {
    indicatorBorder = "border-l-4 border-l-gray-600";
  } else if (isOverdue) {
    indicatorBorder = "border-l-4 border-l-red-500 glow-shadow shadow-red-500/10";
  } else if (isDueSoon) {
    indicatorBorder = "border-l-4 border-l-orange-500 shadow-orange-500/5";
  } else {
    indicatorBorder = "border-l-4 border-l-[#00D4FF] shadow-[#00D4FF]/5";
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
    if (!score) return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    if (score >= 8) return "text-red-400 bg-red-500/20 border-red-500/30";
    if (score >= 5) return "text-orange-400 bg-orange-500/20 border-orange-500/30";
    return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
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
      className={`relative group bg-[#0D1425]/60 backdrop-blur-md rounded-r-2xl rounded-l-md border-y border-r border-white/5 p-5 flex flex-col gap-3 ${indicatorBorder} hover:border-white/10 hover:bg-[#0D1425]/80 transition-all duration-300 cursor-pointer ${
        task.completed ? "opacity-70" : ""
      }`}
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
                ? "bg-[#00D4FF] border-[#00D4FF] text-[#0A0F1E]" 
                : "border-gray-500 hover:border-[#00D4FF] bg-slate-900/40"
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <div className="space-y-1">
            <h4 className={`text-base font-bold text-white transition-all leading-tight ${
              task.completed ? "line-through text-gray-500 font-medium" : ""
            }`}>
              {task.title}
            </h4>
            <p className={`text-xs text-slate-300 ${task.completed ? "text-gray-600" : ""}`}>
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
            className="text-slate-400 hover:text-[#00D4FF] md:opacity-0 md:group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
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
            className="text-slate-400 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Badges / Meta Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          {/* Green checkmark ✅ badge */}
          {task.completed && (
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-[10px] font-bold font-mono tracking-wider uppercase text-emerald-400 flex items-center gap-1">
              ✅ Completed
            </span>
          )}

          {/* Custom Category Badge */}
          {task.category && (
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono tracking-wider uppercase text-[#0DFFD4]">
              {task.category}
            </span>
          )}

          {/* User Priority Designation */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase border ${
            task.priority === "Critical" ? "text-red-400 bg-red-950/40 border-red-500/20" :
            task.priority === "High" ? "text-orange-400 bg-orange-950/40 border-orange-500/20" :
            task.priority === "Medium" ? "text-amber-400 bg-amber-950/40 border border-amber-500/20" :
            "text-emerald-400 bg-emerald-950/40 border border-emerald-500/20"
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
              <Sparkles className="w-3 h-3 text-[#00D4FF]" />
              AI CORE: {task.aiPriorityScore}/10
              {showAIReasoning ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </div>
          )}
        </div>

        {/* Real Deadline */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <Calendar className={`w-3.5 h-3.5 ${task.completed ? "text-emerald-400" : "text-[#00D4FF]"}`} />
          <span className={task.completed ? "text-emerald-400" : isOverdue ? "text-red-400 font-bold" : isDueSoon ? "text-orange-400 font-bold" : ""}>
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
            ? "bg-white/5 border-white/5 text-slate-500" 
            : "bg-[#00D4FF]/5 border-[#00D4FF]/10 text-[#00D4FF]"
        }`}>
          <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${task.completed ? "text-slate-500" : "animate-pulse text-[#00D4FF]"}`} />
          <span className="font-mono text-[11px]">
            AI RECOMMENDED WORK BLOCK: <strong className={`${task.completed ? "text-slate-400" : "text-white"} font-semibold`}>{task.suggestedTimeBlock}</strong>
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
            className="overflow-hidden bg-slate-900/60 rounded-xl border border-[#00D4FF]/10 p-3 flex gap-2.5 text-xs text-slate-300 leading-relaxed"
          >
            <Info className="w-4 h-4 text-[#00D4FF] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#00D4FF] block mb-0.5 font-mono">COACH INSIGHT:</span>
              {task.aiReasoning}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
