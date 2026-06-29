import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquare, Sparkles, AlertCircle, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Task, UserProfile } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";

interface TimelineItem {
  time: string;
  taskTitle: string;
  category?: string;
  priority?: string;
  mood: "Excited" | "Good" | "Neutral" | "Tired" | "Anxious";
  tip: string;
}

interface ParsedSchedule {
  overallTip: string;
  items: TimelineItem[];
}

export function parseSchedule(content: string): ParsedSchedule | null {
  if (!content.includes("📅 MY AI FOCUS SCHEDULE") && !content.includes("MY AI FOCUS SCHEDULE FOR TODAY")) {
    return null;
  }

  try {
    const lines = content.split("\n");
    let overallTip = "";
    const items: TimelineItem[] = [];

    let headerEndIndex = -1;
    let dividerIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("========") || lines[i].includes("MY AI FOCUS SCHEDULE")) {
        headerEndIndex = i;
      }
      if (lines[i].includes("━━━━━━━") && dividerIndex === -1 && headerEndIndex !== -1 && i > headerEndIndex + 1) {
        dividerIndex = i;
        break;
      }
    }

    if (headerEndIndex !== -1) {
      const start = headerEndIndex + 1;
      const end = dividerIndex !== -1 ? dividerIndex : lines.length;
      overallTip = lines.slice(start, end)
        .map(l => l.trim())
        .filter(l => l && !l.includes("=======") && !l.includes("📅"))
        .join("\n");
    }

    let currentItem: Partial<TimelineItem> | null = null;

    for (let i = dividerIndex !== -1 ? dividerIndex + 1 : 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.includes("━━━━━━━")) {
        continue;
      }

      if (line.includes("|") && !line.includes("🕒 TIME BLOCK")) {
        if (currentItem && currentItem.time && currentItem.taskTitle) {
          items.push(currentItem as TimelineItem);
        }
        const parts = line.split("|");
        const timePart = parts[0].replace(/[^ -~]/g, "").trim();
        const titlePart = parts[1].trim();
        currentItem = {
          time: timePart || "Focus Block",
          taskTitle: titlePart,
          mood: "Neutral" as const,
          tip: ""
        };
      } else if (currentItem) {
        if (line.toLowerCase().includes("category:") || line.toLowerCase().includes("mood:")) {
          const parts = line.split("|");
          parts.forEach(p => {
            const kv = p.split(":");
            if (kv.length >= 2) {
              const key = kv[0].trim().toLowerCase();
              const val = kv.slice(1).join(":").trim();
              if (key.includes("category")) {
                currentItem!.category = val;
              } else if (key.includes("priority")) {
                currentItem!.priority = val;
              } else if (key.includes("mood")) {
                if (val.toLowerCase().includes("excited") || val.includes("😄")) {
                  currentItem!.mood = "Excited";
                } else if (val.toLowerCase().includes("good") || val.includes("🙂")) {
                  currentItem!.mood = "Good";
                } else if (val.toLowerCase().includes("tired") || val.includes("😩")) {
                  currentItem!.mood = "Tired";
                } else if (val.toLowerCase().includes("anxious") || val.includes("😰")) {
                  currentItem!.mood = "Anxious";
                } else {
                  currentItem!.mood = "Neutral";
                }
              }
            }
          });
        } else if (line.includes("💡 AI Tip:") || line.includes("AI Tip:")) {
          currentItem.tip = line.replace(/💡 AI Tip:|AI Tip:/g, "").trim();
        }
      }
    }

    if (currentItem && currentItem.time && currentItem.taskTitle) {
      items.push(currentItem as TimelineItem);
    }

    return {
      overallTip: overallTip || "Here is your personalized focus schedule tailored to your goals.",
      items: items.length > 0 ? items : []
    };
  } catch (e) {
    console.warn("Failed to parse schedule markdown:", e);
    return null;
  }
}

export const ScheduleTimelineView: React.FC<{ schedule: ParsedSchedule }> = ({ schedule }) => {
  const { isDark } = useTheme();
  
  const borderColors = {
    Excited: isDark ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400" : "border-emerald-300 bg-emerald-50 text-emerald-700",
    Good: isDark ? "border-[#00D4FF]/50 bg-[#00D4FF]/5 text-[#00D4FF]" : "border-[#BAE6FD] bg-[#F0F9FF] text-[#0891B2]",
    Neutral: isDark ? "border-slate-500/30 bg-slate-500/5 text-slate-300" : "border-slate-300 bg-slate-50 text-slate-700",
    Tired: isDark ? "border-amber-500/50 bg-amber-500/5 text-amber-400" : "border-amber-300 bg-amber-50 text-amber-700",
    Anxious: isDark ? "border-rose-500/50 bg-rose-500/5 text-rose-400" : "border-rose-300 bg-rose-50 text-rose-700"
  };

  const moodEmojis = {
    Excited: "😄",
    Good: "🙂",
    Neutral: "😐",
    Tired: "😩",
    Anxious: "😰"
  };

  return (
    <div className="space-y-4 w-full">
      {schedule.overallTip && (
        <div className={`p-3 border rounded-xl text-xs leading-relaxed ${
          isDark ? 'bg-[#00D4FF]/10 border-[#00D4FF]/20 text-[#00D4FF]' : 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0891B2]'
        }`}>
          <p className="font-semibold mb-1">💡 Coach Recommendation</p>
          <p className="opacity-95">{schedule.overallTip}</p>
        </div>
      )}

      <div className={`relative border-l pl-4 ml-2 space-y-4 text-left ${isDark ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
        {schedule.items.map((item, index) => (
          <div key={index} className="relative">
            <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
              item.mood === "Excited" ? (isDark ? "bg-emerald-400 border-emerald-500" : "bg-emerald-500 border-emerald-600") :
              item.mood === "Good" ? (isDark ? "bg-[#00D4FF] border-[#00D4FF]" : "bg-[#0891B2] border-[#0891B2]") :
              item.mood === "Tired" ? (isDark ? "bg-amber-400 border-amber-500" : "bg-amber-500 border-amber-600") :
              item.mood === "Anxious" ? (isDark ? "bg-rose-400 border-rose-500" : "bg-rose-500 border-rose-600") :
              (isDark ? "bg-slate-400 border-slate-500" : "bg-slate-500 border-slate-600")
            }`} />

            <div className={`p-3 rounded-xl border ${borderColors[item.mood] || borderColors.Neutral} space-y-1.5 shadow-md`}>
              <div className="flex justify-between items-start gap-2">
                <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
                  ⏱️ {item.time}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <span>{moodEmojis[item.mood]}</span>
                  <span>{item.mood}</span>
                </span>
              </div>

              <h5 className={`text-xs font-bold leading-snug ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                {item.taskTitle}
              </h5>

              {item.category && (
                <div className={`text-[10px] flex gap-2 ${isDark ? 'text-slate-400' : 'text-[#64748B]'}`}>
                  <span>Category: <strong className={`font-bold ${isDark ? 'text-slate-300' : 'text-[#475569]'}`}>{item.category}</strong></span>
                  {item.priority && <span>| Priority: <strong className={`font-bold ${isDark ? 'text-slate-300' : 'text-[#475569]'}`}>{item.priority}</strong></span>}
                </div>
              )}

              {item.tip && (
                <p className={`text-[11px] leading-relaxed italic border-t pt-1.5 mt-1.5 ${
                  isDark ? 'text-slate-300 border-white/5' : 'text-[#475569] border-[#E2E8F0]'
                }`}>
                  💡 {item.tip}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AICoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  profile: UserProfile;
  panelWidth: number;
  isResizing: boolean;
  startResize: (e: React.MouseEvent) => void;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({
  isOpen,
  onClose,
  tasks,
  profile,
  panelWidth,
  isResizing,
  startResize
}) => {
  const { user, isDemoMode } = useAuth();
  const { isDark } = useTheme();

  const defaultGreeting: ChatMessage = {
    id: "greeting",
    role: "assistant",
    content: "👋 Hi! I'm your RapidFocus AI Coach. How can I help you today?",
    timestamp: new Date()
  };

  const [messages, setMessages] = useState<ChatMessage[]>([defaultGreeting]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayMessages = messages;

  // Scroll to bottom whenever messages list is updated or generation state shifts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, isGenerating, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const userMessageText = inputText;
    setInputText("");

    setIsGenerating(true);

    const newUserMessage: ChatMessage = {
      id: `m-${Date.now()}-user`,
      role: "user",
      content: userMessageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Map message history to lightweight server format
      // Include the new user message we just sent
      const historyPayload = [...messages, newUserMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          tasks: tasks,
          role: profile.role,
          userName: profile.name
        })
      });

      if (!res.ok) {
        throw new Error(`Chat returned error code: ${res.status}`);
      }

      const data = await res.json();
      const responseContent = data.text || "I processed your priority logs. Let's structure your target timeline next.";
      
      const newAssistantMessage: ChatMessage = {
        id: `m-${Date.now()}-coach`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newAssistantMessage]);
    } catch (err: any) {
      console.error("AI Coach interaction failure:", err);
      const errorContent = "🚨 *Disconnection alert*: I encountered a brief signal disruption. Let's try sending that focus request one more time.";
      const newErrorMessage: ChatMessage = {
        id: `m-${Date.now()}-err`,
        role: "assistant",
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newErrorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 190 }}
          className={`fixed inset-y-0 right-0 w-full border-l flex flex-col z-50 h-screen shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#0E1528] border-white/10' : 'bg-white border-[#E2E8F0]'
          }`}
          style={{
            width: window.innerWidth < 768 ? '100vw' : `${panelWidth}px`
          }}
        >
          {/* Resize handle */}
          <div 
            className="hidden md:block absolute left-0 top-0 h-full w-1.5 cursor-ew-resize group z-50"
            onMouseDown={startResize}
          >
            <div className={`h-full w-full transition-colors duration-200 ${isDark ? 'group-hover:bg-[#00D4FF]/40' : 'group-hover:bg-[#0891B2]/20'}`} />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col gap-1 pl-[1px]">
              <div className={`w-1 h-1 rounded-full transition-colors ${isDark ? 'bg-gray-600 group-hover:bg-[#00D4FF]' : 'bg-slate-300 group-hover:bg-[#0891B2]'}`} />
              <div className={`w-1 h-1 rounded-full transition-colors ${isDark ? 'bg-gray-600 group-hover:bg-[#00D4FF]' : 'bg-slate-300 group-hover:bg-[#0891B2]'}`} />
              <div className={`w-1 h-1 rounded-full transition-colors ${isDark ? 'bg-gray-600 group-hover:bg-[#00D4FF]' : 'bg-slate-300 group-hover:bg-[#0891B2]'}`} />
            </div>
          </div>

          {/* Top Panel Brand Bar */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'bg-[#0D1425] border-white/5' : 'bg-[#F8FAFF] border-[#E2E8F0]'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isDark ? 'bg-[#00D4FF]' : 'bg-[#0891B2]'}`} />
              <div className="flex items-center gap-1">
                <h4 className={`text-xs font-black font-mono tracking-widest uppercase ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>AI Coach</h4>
                <span className={`text-[9px] font-mono border px-1 py-0.5 rounded uppercase font-semibold ${
                  isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>Active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className={`flex items-center gap-1 px-2 py-1 border rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer ${
                  isDark ? 'border-red-500/50 hover:bg-red-500 hover:text-white text-red-400' : 'border-red-300 hover:bg-red-500 hover:text-white text-red-600'
                }`}
                title="Clear Chat Conversation"
              >
                <span>🗑️</span>
                <span>Clear Chat</span>
              </button>

              <button 
                onClick={onClose}
                className={`transition w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
                }`}
                title="Close Panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Stats Banner inside Chat */}
          <div className={`px-4 py-2.5 border-b flex items-center justify-between text-[11px] font-mono ${
            isDark ? 'bg-[#080D1A]/60 border-white/5 text-slate-400' : 'bg-[#F8FAFF] border-[#E2E8F0] text-[#64748B]'
          }`}>
            <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-[#00D4FF]/80' : 'text-[#0891B2]/80'}`}>
              <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-[#0DFFD4]' : 'text-[#0891B2]'}`} /> FOCUS METRICS
            </span>
            <span>{tasks.filter(t => !t.completed).length} Tasks Pending</span>
          </div>

          {/* Scrollable Message Box */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col scrollbar-thin">
            <AnimatePresence initial={false}>
              {displayMessages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        isUser
                           ? (isDark ? "bg-[#00D4FF]/10 text-white border border-[#00D4FF]/20 rounded-tr-none" : "bg-[#F0F9FF] text-[#0F172A] border border-[#BAE6FD] rounded-tr-none")
                           : (isDark ? "bg-white/5 border border-white/5 text-slate-200 rounded-tl-none font-sans" : "bg-white border border-[#E2E8F0] text-[#475569] rounded-tl-none font-sans shadow-sm")
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (() => {
                        const parsed = parseSchedule(m.content);
                        if (parsed) {
                          return <ScheduleTimelineView schedule={parsed} />;
                        }
                        return (
                          <div className="markdown-body space-y-2">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Subtle Timestamp */}
                    <span className={`text-[9px] mt-1 font-mono w-[85%] px-1 ${
                      isUser ? "text-left" : "text-right"
                    } ${isDark ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Glowing Typing Indicator dot animation */}
            {isGenerating && (
              <div className="flex flex-col items-start">
                <div className={`p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-[#E2E8F0] shadow-sm'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isDark ? 'bg-[#00D4FF]' : 'bg-[#0891B2]'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isDark ? 'bg-[#0DFFD4]' : 'bg-teal-500'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-[#00D4FF]' : 'bg-[#0891B2]'}`} />
                </div>
                <span className={`text-[9px] font-mono uppercase mt-1 pl-1 ${isDark ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
                  Drafting schedule...
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Trigger Suggestions */}
          {displayMessages.length === 1 && !isGenerating && (
            <div className={`p-3 border-t flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0 ${
              isDark ? 'bg-white/[0.02] border-white/5' : 'bg-[#F8FAFF] border-[#E2E8F0]'
            }`}>
              <button
                onClick={() => setInputText("Break down my highest priority task into smaller actionable steps.")}
                className={`flex-shrink-0 px-2.5 py-1.5 border rounded-xl text-[10px] transition cursor-pointer font-mono ${
                  isDark ? 'bg-slate-900 border-white/5 text-slate-300 hover:text-[#00D4FF] hover:border-[#00D4FF]/30' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0891B2] hover:border-[#0891B2]/30 hover:bg-[#F0F9FF]'
                }`}
              >
                ⚡ Breakdown Priority Task
              </button>
              <button
                onClick={() => setInputText("How should I budget my work blocks for today? Suggest a Pomodoro schedule.")}
                className={`flex-shrink-0 px-2.5 py-1.5 border rounded-xl text-[10px] transition cursor-pointer font-mono ${
                  isDark ? 'bg-slate-900 border-white/5 text-slate-300 hover:text-[#00D4FF] hover:border-[#00D4FF]/30' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0891B2] hover:border-[#0891B2]/30 hover:bg-[#F0F9FF]'
                }`}
              >
                🕐 Daily Focus Schedule
              </button>
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <form 
            onSubmit={handleSendMessage}
            className={`p-4 border-t flex-shrink-0 ${isDark ? 'border-white/5 bg-[#0D1425]/90' : 'border-[#E2E8F0] bg-white'}`}
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isGenerating}
                placeholder={isGenerating ? "Planning focus strategy..." : "Draft priority breakdown or ask AI..."}
                className={`w-full border rounded-xl pl-4 pr-11 py-3 text-xs focus:outline-none transition ${
                  isDark 
                    ? 'bg-[#080D1A] border-white/5 text-white focus:border-[#00D4FF]/40 placeholder-slate-600' 
                    : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#0F172A] focus:border-[#0891B2] placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isGenerating}
                className={`absolute right-1 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  inputText.trim() && !isGenerating
                    ? (isDark ? "bg-[#00D4FF] text-[#0A0F1E] shadow-md hover:opacity-90" : "bg-[#0891B2] text-white shadow-md hover:opacity-90")
                    : (isDark ? "text-slate-600 hover:text-slate-500" : "text-slate-400 hover:text-slate-500")
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Clear Confirmation Dialog overlay */}
          <AnimatePresence>
            {showClearConfirm && (
              <div className={`absolute inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/75' : 'bg-slate-900/40'}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`border rounded-2xl p-5 w-full max-w-[280px] text-center space-y-4 shadow-2xl ${
                    isDark ? 'bg-[#0D1425] border-white/10' : 'bg-white border-[#E2E8F0]'
                  }`}
                >
                  <div className="text-xl">🗑️</div>
                  <h5 className={`text-sm font-bold leading-snug ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                    Clear this conversation?
                  </h5>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#475569]'}`}>
                    This will delete all messages in this chat. Your tasks and data are NOT affected.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMessages([defaultGreeting]);
                        setShowClearConfirm(false);
                      }}
                      className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className={`w-full py-2 border font-bold text-xs rounded-xl transition cursor-pointer ${
                        isDark ? 'border-slate-700 hover:border-slate-600 text-slate-300' : 'border-[#E2E8F0] hover:bg-slate-50 text-[#64748B]'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
