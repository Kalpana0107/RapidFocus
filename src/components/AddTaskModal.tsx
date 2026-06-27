import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, MicOff, X, Sparkles, CheckCircle2 } from "lucide-react";
import { UserRole, Task } from "../types";

// Check speech support
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (task: {
    title: string;
    description: string;
    deadline: string;
    priority: "Critical" | "High" | "Medium" | "Low";
    category: string;
  }) => Promise<void>;
  userRole?: UserRole;
  taskToEdit?: Task;
  onEdit?: (taskId: string, taskData: {
    title: string;
    description: string;
    deadline: string;
    priority: "Critical" | "High" | "Medium" | "Low";
    category: string;
  }) => Promise<void>;
}

// Helper to format ISO strings to date-local picker value
function formatDateTimeLocal(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const tzoffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ 
  onClose, 
  onAdd,
  userRole,
  taskToEdit,
  onEdit
}) => {
  const [title, setTitle] = useState(taskToEdit ? taskToEdit.title : "");
  const [description, setDescription] = useState(taskToEdit ? taskToEdit.description : "");
  const [deadline, setDeadline] = useState(taskToEdit ? formatDateTimeLocal(taskToEdit.deadline) : "");
  const [priority, setPriority] = useState<"Critical" | "High" | "Medium" | "Low">(
    taskToEdit ? taskToEdit.priority : "Medium"
  );
  const [category, setCategory] = useState(taskToEdit ? taskToEdit.category : "");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  // Choose standard categories suitable for all users
  const defaultCategories = ["Study", "Work", "Personal", "Health", "Finance", "Other"];

  useEffect(() => {
    if (!taskToEdit && defaultCategories.length > 0) {
      setCategory(defaultCategories[0]);
    }
  }, [userRole, taskToEdit]);

  // Voice extraction ref to avoid stale closures in event listeners
  const extractVoiceRef = React.useRef<(transcription: string) => Promise<void>>(null);

  extractVoiceRef.current = async (transcription: string) => {
    setIsExtracting(true);
    setVoiceError(null);
    try {
      const response = await fetch("/api/tasks/extract-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription,
          role: userRole
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.title) setTitle(data.title);
        if (data.description !== undefined) setDescription(data.description);
        if (data.deadline) setDeadline(data.deadline);
        if (data.priority) setPriority(data.priority);
        if (data.category) {
          const exactMatch = defaultCategories.find(c => c.toLowerCase() === data.category.toLowerCase());
          if (exactMatch) {
            setCategory(exactMatch);
          } else if (defaultCategories.length > 0) {
            // Fuzzy match category
            const fuzzyMatch = defaultCategories.find(c => data.category.toLowerCase().includes(c.toLowerCase()));
            if (fuzzyMatch) {
              setCategory(fuzzyMatch);
            } else {
              setCategory(defaultCategories[0]);
            }
          }
        }
      } else {
        const errorData = await response.json();
        setVoiceError(errorData.error || "Failed to parse speech parameters.");
      }
    } catch (err) {
      console.error(err);
      setVoiceError("Connection failed during parameter extraction.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Voice Web Speech API Ref
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = "en-US";
        rec.interimResults = false;

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setIsListening(false);
          if (extractVoiceRef.current) {
            extractVoiceRef.current(text);
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech Recognition Error", event);
          setVoiceError("Failed to recognize speech. Please speak clearly.");
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } catch (e) {
        console.error("Failed to initialize SpeechRecognition:", e);
      }
    }
  }, []);

  const startVoiceCapture = () => {
    if (!recognitionRef.current) {
      setVoiceError("Web Speech API not supported or permitted in this context.");
      return;
    }
    setIsListening(true);
    setVoiceError(null);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopVoiceCapture = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      setIsListening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (taskToEdit && onEdit) {
        await onEdit(taskToEdit.id, {
          title,
          description,
          deadline,
          priority,
          category
        });
      } else {
        await onAdd({
          title,
          description,
          deadline,
          priority,
          category
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0F1E]/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-[#0D1425] border border-white/10 rounded-2xl glow-shadow-lg overflow-hidden flex flex-col"
      >
        {/* Neon accent top strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4FF] via-cyan-400 to-[#0DFFD4]" />
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-wide uppercase font-sans">
              {taskToEdit ? "Edit Task" : "Add New Task"}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono tracking-wider uppercase text-gray-400 font-medium">
                Task Title
              </label>
              {SpeechRecognition ? (
                <button
                  type="button"
                  id="voice-mic-btn"
                  disabled={isExtracting}
                  onClick={isListening ? stopVoiceCapture : startVoiceCapture}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                    isListening 
                      ? "bg-red-500/15 border border-red-500/30 text-red-400 font-bold animate-pulse" 
                      : isExtracting
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold"
                      : "bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF] hover:bg-[#00D4FF]/20 cursor-pointer"
                  }`}
                  title="Speak to transcribe and auto-fill task with Gemini"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 animate-bounce text-red-400" />
                      LISTENING...
                    </>
                  ) : isExtracting ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      EXTRACTING...
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      SPEECHFLL (GEMINI)
                    </>
                  )}
                </button>
              ) : null}
            </div>

            <input
              type="text"
              id="task-title-input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read Chapter 4 of Biology or finish homework"
              className="w-full px-3 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-white text-sm focus:border-[#00D4FF] focus:outline-none placeholder-gray-600 transition"
            />
            {voiceError && <p className="text-[10px] text-red-400 font-mono italic">{voiceError}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono tracking-wider uppercase text-gray-400">
              EXTRA DETAILS (OPTIONAL)
            </label>
            <textarea
              id="task-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add extra tasks, checklist items, page numbers or links..."
              className="w-full px-3 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-white text-sm focus:border-[#00D4FF] focus:outline-none placeholder-gray-600 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-wider uppercase text-gray-400">
                DUE DATE & TIME
              </label>
              <input
                type="datetime-local"
                id="task-deadline-input"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-white text-sm focus:border-[#00D4FF] focus:outline-none transition font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-wider uppercase text-gray-400">
                CATEGORY
              </label>
              <select
                id="task-category-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-white text-sm focus:border-[#00D4FF] focus:outline-none transition cursor-pointer"
              >
                {defaultCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0D1425]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-mono tracking-wider uppercase text-gray-400 block pb-1">
              TASK PRIORITY
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["Critical", "High", "Medium", "Low"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  id={`priority-select-${lvl.toLowerCase()}`}
                  onClick={() => setPriority(lvl)}
                  className={`py-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                    priority === lvl 
                      ? lvl === "Critical" ? "bg-red-500/20 text-red-400 border-red-500/40 font-bold"
                        : lvl === "High" ? "bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold"
                        : lvl === "Medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold"
                      : "bg-transparent border-white/5 text-gray-400 hover:border-white/10"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt warning banner */}
          <div className="p-3 rounded-xl bg-[#00D4FF]/5 border border-[#00D4FF]/10 flex gap-2 items-start">
            <Sparkles className="w-4 h-4 text-[#00D4FF] flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
              Once saved, your AI Coach can help suggest specific times to start or auto-prioritize this task!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent text-gray-405 border border-white/5 hover:border-white/10 rounded-xl text-xs font-mono transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-add-task-btn"
              disabled={loading || !title.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#0DFFD4] text-[#0A0F1E] font-bold rounded-xl text-xs font-mono transition hover:shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {loading ? "Saving..." : taskToEdit ? "Save Changes" : "Save Task"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
