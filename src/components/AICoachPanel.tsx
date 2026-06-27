import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquare, Sparkles, AlertCircle, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Task, UserProfile } from "../types";
import { useAuth } from "../hooks/useAuth";
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
  const borderColors = {
    Excited: "border-emerald-500/50 bg-emerald-500/5 text-emerald-400",
    Good: "border-[#00D4FF]/50 bg-[#00D4FF]/5 text-[#00D4FF]",
    Neutral: "border-slate-500/30 bg-slate-500/5 text-slate-300",
    Tired: "border-amber-500/50 bg-amber-500/5 text-amber-400",
    Anxious: "border-rose-500/50 bg-rose-500/5 text-rose-400"
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
        <div className="p-3 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-xl text-xs text-[#00D4FF] leading-relaxed">
          <p className="font-semibold mb-1">💡 Coach Recommendation</p>
          <p className="opacity-95">{schedule.overallTip}</p>
        </div>
      )}

      <div className="relative border-l border-white/10 pl-4 ml-2 space-y-4 text-left">
        {schedule.items.map((item, index) => (
          <div key={index} className="relative">
            <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
              item.mood === "Excited" ? "bg-emerald-400 border-emerald-500" :
              item.mood === "Good" ? "bg-[#00D4FF] border-[#00D4FF]" :
              item.mood === "Tired" ? "bg-amber-400 border-amber-500" :
              item.mood === "Anxious" ? "bg-rose-400 border-rose-500" :
              "bg-slate-400 border-slate-500"
            }`} />

            <div className={`p-3 rounded-xl border ${borderColors[item.mood] || borderColors.Neutral} space-y-1.5 shadow-md`}>
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                  ⏱️ {item.time}
                </span>
                <span className="text-[10px] font-mono font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                  <span>{moodEmojis[item.mood]}</span>
                  <span>{item.mood}</span>
                </span>
              </div>

              <h5 className="text-xs font-bold text-white leading-snug">
                {item.taskTitle}
              </h5>

              {item.category && (
                <div className="text-[10px] text-slate-400 flex gap-2">
                  <span>Category: <strong className="text-slate-300 font-bold">{item.category}</strong></span>
                  {item.priority && <span>| Priority: <strong className="text-slate-300 font-bold">{item.priority}</strong></span>}
                </div>
              )}

              {item.tip && (
                <p className="text-[11px] text-slate-300 leading-relaxed italic border-t border-white/5 pt-1.5 mt-1.5">
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
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({
  isOpen,
  onClose,
  tasks,
  profile
}) => {
  const { user, isDemoMode } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedAt, setClearedAt] = useState<Date | null>(() => {
    const saved = sessionStorage.getItem("rapidfocus_chat_cleared_at");
    return saved ? new Date(saved) : null;
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync and fetch chat messages dynamically from Firestore (or localStorage in Demo mode)
  useEffect(() => {
    const overdueCount = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;
    const dueSoonCount = tasks.filter(t => {
      if (t.completed || !t.deadline) return false;
      const hoursLeft = (new Date(t.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60);
      return hoursLeft > 0 && hoursLeft <= 24;
    }).length;

    let alertContext = "";
    if (overdueCount > 0) {
      alertContext = ` I notice you currently have **${overdueCount} late task${overdueCount === 1 ? "" : "s"}** that need attention. Let's make an immediate schedule to get them completed!`;
    } else if (dueSoonCount > 0) {
      alertContext = ` You have **${dueSoonCount} task${dueSoonCount === 1 ? "" : "s"}** due within 24 hours. Let's plan some solid work intervals today!`;
    }

    const defaultGreetingContent = `Hi **${profile.name || "friend"}**! I'm your **RapidFocus AI Coach**. What can I help you with today? 😊`;

    const defaultGreeting: ChatMessage = {
      id: "greeting",
      role: "assistant",
      content: defaultGreetingContent,
      timestamp: new Date()
    };

    if (isDemoMode || (user && user.uid === "demo-sandbox-uid")) {
      const localMsgStr = localStorage.getItem("rapidfocus_demo_messages");
      if (localMsgStr) {
        const parsed = JSON.parse(localMsgStr).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(parsed);
      } else {
        localStorage.setItem("rapidfocus_demo_messages", JSON.stringify([defaultGreeting]));
        setMessages([defaultGreeting]);
      }
      return;
    }

    if (!user || user.uid === "demo-sandbox-uid") {
      setMessages([defaultGreeting]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let tDate = new Date();
        if (data.timestamp) {
          tDate = data.timestamp.seconds 
            ? new Date(data.timestamp.seconds * 1000) 
            : new Date(data.timestamp);
        }
        msgList.push({
          id: docSnap.id,
          role: data.role || "assistant",
          content: data.content || "",
          timestamp: tDate
        });
      });

      if (msgList.length === 0) {
        setMessages([defaultGreeting]);
      } else {
        setMessages(msgList);
      }
    }, (error) => {
      console.error("Error fetching chat messages:", error);
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/messages`);
    });

    return () => unsubscribe();
  }, [user, isDemoMode, profile, tasks.length]);

  // Filter messages by clearedAt timestamp
  const visibleMessages = messages.filter(m => !clearedAt || m.timestamp > clearedAt);
  const displayMessages = visibleMessages.length > 0 ? visibleMessages : [
    {
      id: "cleared-welcome",
      role: "assistant" as const,
      content: `👋 Hi ${profile.name || "friend"}! I'm your RapidFocus AI Coach. Ask me anything about your tasks, schedule, or productivity. I'm here to help!`,
      timestamp: new Date()
    }
  ];

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

    try {
      // 1. Save user message to DB / LocalStorage
      if (isDemoMode || (user && user.uid === "demo-sandbox-uid")) {
        const localMsgStr = localStorage.getItem("rapidfocus_demo_messages");
        const current = localMsgStr ? JSON.parse(localMsgStr) : [];
        const updated = [...current, { id: `m-${Date.now()}-user`, role: "user", content: userMessageText, timestamp: new Date().toISOString() }];
        localStorage.setItem("rapidfocus_demo_messages", JSON.stringify(updated));
        setMessages(updated.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      } else if (user) {
        try {
          await addDoc(collection(db, "users", user.uid, "messages"), {
            role: "user",
            content: userMessageText,
            timestamp: new Date()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/messages`);
        }
      }

      // Map message history to lightweight server format
      // Include the new user message we just sent
      const historyPayload = [...messages, { role: "user", content: userMessageText }].map(m => ({
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
      
      // 2. Save assistant response to DB / LocalStorage
      if (isDemoMode || (user && user.uid === "demo-sandbox-uid")) {
        const localMsgStr = localStorage.getItem("rapidfocus_demo_messages");
        const current = localMsgStr ? JSON.parse(localMsgStr) : [];
        const updated = [...current, { id: `m-${Date.now()}-coach`, role: "assistant", content: responseContent, timestamp: new Date().toISOString() }];
        localStorage.setItem("rapidfocus_demo_messages", JSON.stringify(updated));
        setMessages(updated.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      } else if (user) {
        try {
          await addDoc(collection(db, "users", user.uid, "messages"), {
            role: "assistant",
            content: responseContent,
            timestamp: new Date()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/messages`);
        }
      }
    } catch (err: any) {
      console.error("AI Coach interaction failure:", err);
      const errorContent = "🚨 *Disconnection alert*: I encountered a brief signal disruption. Let's try sending that focus request one more time.";
      
      if (isDemoMode || (user && user.uid === "demo-sandbox-uid")) {
        const localMsgStr = localStorage.getItem("rapidfocus_demo_messages");
        const current = localMsgStr ? JSON.parse(localMsgStr) : [];
        const updated = [...current, { id: `m-${Date.now()}-err`, role: "assistant", content: errorContent, timestamp: new Date().toISOString() }];
        localStorage.setItem("rapidfocus_demo_messages", JSON.stringify(updated));
        setMessages(updated.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      } else if (user) {
        try {
          await addDoc(collection(db, "users", user.uid, "messages"), {
            role: "assistant",
            content: errorContent,
            timestamp: new Date()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/messages`);
        }
      }
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
          className="fixed inset-y-0 right-0 w-full md:w-96 border-l border-white/10 bg-[#0E1528] flex flex-col z-50 h-screen shadow-2xl relative"
        >
          {/* Top Panel Brand Bar */}
          <div className="p-4 border-b border-white/5 bg-[#0D1425] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] animate-pulse" />
              <div className="flex items-center gap-1">
                <h4 className="text-xs font-black text-white font-mono tracking-widest uppercase">AI Coach</h4>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20 px-1 py-0.5 rounded uppercase font-semibold">Active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1 px-2 py-1 border border-red-500/50 hover:bg-red-500 hover:text-white text-red-400 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
                title="Clear Chat Conversation"
              >
                <span>🗑️</span>
                <span>Clear Chat</span>
              </button>

              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 cursor-pointer"
                title="Close Panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Stats Banner inside Chat */}
          <div className="px-4 py-2.5 bg-[#080D1A]/60 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-[#00D4FF]/80">
              <Sparkles className="w-3.5 h-3.5 text-[#0DFFD4]" /> FOCUS METRICS
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
                          ? "bg-[#00D4FF]/10 text-white border border-[#00D4FF]/20 rounded-tr-none"
                          : "bg-white/5 border border-white/5 text-slate-200 rounded-tl-none font-sans"
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
                    <span className={`text-[9px] text-slate-500 mt-1 font-mono w-[85%] px-1 ${
                      isUser ? "text-left" : "text-right"
                    }`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Glowing Typing Indicator dot animation */}
            {isGenerating && (
              <div className="flex flex-col items-start">
                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0DFFD4] animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-bounce" />
                </div>
                <span className="text-[9px] text-slate-500 font-mono uppercase mt-1 pl-1">
                  Drafting schedule...
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Trigger Suggestions */}
          {displayMessages.length === 1 && !isGenerating && (
            <div className="p-3 bg-white/[0.02] border-t border-white/5 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
              <button
                onClick={() => setInputText("Break down my highest priority task into smaller actionable steps.")}
                className="flex-shrink-0 px-2.5 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-[10px] text-slate-300 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition cursor-pointer font-mono"
              >
                ⚡ Breakdown Priority Task
              </button>
              <button
                onClick={() => setInputText("How should I budget my work blocks for today? Suggest a Pomodoro schedule.")}
                className="flex-shrink-0 px-2.5 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-[10px] text-slate-300 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition cursor-pointer font-mono"
              >
                🕐 Daily Focus Schedule
              </button>
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 border-t border-white/5 bg-[#0D1425]/90 flex-shrink-0"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isGenerating}
                placeholder={isGenerating ? "Planning focus strategy..." : "Draft priority breakdown or ask AI..."}
                className="w-full bg-[#080D1A] border border-white/5 rounded-xl pl-4 pr-11 py-3 text-xs text-white focus:outline-none focus:border-[#00D4FF]/40 placeholder-slate-600 transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isGenerating}
                className={`absolute right-1 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  inputText.trim() && !isGenerating
                    ? "bg-[#00D4FF] text-[#0A0F1E] shadow-md hover:opacity-90"
                    : "text-slate-600 hover:text-slate-500"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Clear Confirmation Dialog overlay */}
          <AnimatePresence>
            {showClearConfirm && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0D1425] border border-white/10 rounded-2xl p-5 w-full max-w-[280px] text-center space-y-4 shadow-2xl"
                >
                  <div className="text-xl">🗑️</div>
                  <h5 className="text-sm font-bold text-white leading-snug">
                    Clear this conversation?
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This will delete all messages in this chat. Your tasks and data are NOT affected.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setClearedAt(now);
                        sessionStorage.setItem("rapidfocus_chat_cleared_at", now.toISOString());
                        setShowClearConfirm(false);
                      }}
                      className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="w-full py-2 border border-slate-700 hover:border-slate-600 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
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
