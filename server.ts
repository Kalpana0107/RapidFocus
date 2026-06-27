import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize modern Google GenAI Client with appropriate User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});

// Resilient helper to handle temporary model high-demand (503) or quota (429) by falling back automatically
const MODELS = [
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite"
];

async function generateContentWithFallback(options: {
  model: string;
  contents: any;
  config?: any;
}) {
  const modelsToTry = MODELS;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...options,
        model: modelName,
      });
      return response;
    } catch (err: any) {
      console.warn(`[Gemini RESILIENCY] Failed with model ${modelName}:`, err.message || err);
      lastError = err;
      // Brief delay before trying fallback model
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error("AI features temporarily unavailable, please try again in a moment");
}

// Ensure the server can be initialized under tsx or built server.cjs
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log request info for diagnostic convenience
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Base API healthcheck
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Generate focus schedule route powered by Gemini 3.5-flash
  app.post("/api/tasks/generate-schedule", async (req: Request, res: Response) => {
    try {
      const { tasks = [], freeTime, role, userName } = req.body;

      if (!freeTime) {
        return res.status(400).json({ error: "Free time is required for generating focus schedule." });
      }

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable missing. Launching local fallback schedule generator.");
        
        const moodEmojis: Record<string, string> = {
          Excited: "😄 Excited",
          Good: "🙂 Good",
          Neutral: "😐 Neutral",
          Tired: "😩 Tired",
          Anxious: "😰 Anxious"
        };

        const timeSlots = freeTime.split(",").map((s: string) => s.trim());
        let scheduleContent = `===================================\n📅 MY AI FOCUS SCHEDULE FOR TODAY\n===================================\nHello ${userName}! Here is your personalized offline schedule tailored to your ${role} role. Based on your moods, we've organized your sessions to match your energy level.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🕒 TIME BLOCK | 📝 TASK DETAILS & COGNITIVE FIT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        tasks.forEach((t: any, index: number) => {
          const slot = timeSlots[index % timeSlots.length] || "Today, Focus Window";
          const moodText = moodEmojis[t.mood] || "😐 Neutral";
          scheduleContent += `${slot} | ${t.title}\nCategory: ${t.category || "General"} | Priority: ${t.priority || "Medium"} | Mood: ${moodText}\n💡 AI Tip: Keep your momentum steady! This session is calibrated specifically for your current ${t.mood.toLowerCase()} mood.\n\n`;
        });

        scheduleContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        return res.json({ schedule: scheduleContent });
      }

      const prompt = `You are an elite cognitive productivity planner and systems coach. 
We need you to generate a highly personalized daily focus schedule based on the user's focus role, their pending tasks, their current mood check for each task, and their available free time slots today.

User Focus Role: ${role || "Professional"}
User Name: ${userName || "User"}
Current Time Context: ${new Date().toISOString()}

Free Time Slots Today: "${freeTime}"

Pending Tasks with user's selected moods:
${tasks.map((t: any) => `- Task: "${t.title}" | Category: "${t.category}" | Priority: "${t.priority}" | Deadline: "${t.deadline || "None"}" | Current Mood: "${t.mood}"`).join("\n")}

Your task is to organize these tasks into the user's free time slots and output a beautiful, motivating daily schedule.
You must adhere strictly to the following formatting template in markdown. Do not include any extra text outside of the headers or boundaries:

===================================
📅 MY AI FOCUS SCHEDULE FOR TODAY
===================================
[Dynamic daily motivation message based on the user's overall mood check. Make it empathetic, structured, and customized to their focus role and moods.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕒 TIME BLOCK | 📝 TASK DETAILS & COGNITIVE FIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Provide actual time blocks within the user's free time slots, e.g., "09:00 AM - 10:30 AM" or "3:00 PM - 4:00 PM"] | [Task Name]
Category: [Category] | Priority: [Priority] | Mood: [Selected Mood Emoji + text, e.g. "😄 Excited"]
💡 AI Tip: [1-2 sentences explaining why this task is scheduled at this time based on the user's current mood. E.g., 'Since you are feeling anxious about this, we scheduled it first to get it out of the way and clear your mental space.']

[Repeat above block for all pending tasks]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Remember:
- Use actual, logical time blocks from the user's free time inputs. For example, if free time is "9am-11am, 3pm-6pm", allocate task sessions nicely within those ranges.
- The AI Tip must be highly cognitive-focused, explaining how the selected mood impacts their focus, and why the ordering/timing is optimal (e.g. scheduling anxious/tired tasks during peak energy or first, excited ones to build momentum).
- Do not output code blocks or any extra wrappers. Print the schedule directly as requested.`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const resultText = response.text?.trim() || "Unable to generate schedule.";
      res.json({ schedule: resultText });
    } catch (err: any) {
      console.warn("Generate focus schedule backend failed (using local fallback instead):", err.message || err);
      
      const { tasks = [], freeTime, role, userName } = req.body;
      const moodEmojis: Record<string, string> = {
        Excited: "😄 Excited",
        Good: "🙂 Good",
        Neutral: "😐 Neutral",
        Tired: "😩 Tired",
        Anxious: "😰 Anxious"
      };

      const timeSlots = freeTime ? freeTime.split(",").map((s: string) => s.trim()) : ["09:00 AM - 10:30 AM", "03:00 PM - 04:30 PM"];
      let scheduleContent = `===================================\n📅 MY AI FOCUS SCHEDULE FOR TODAY\n===================================\nHello ${userName || "friend"}! Here is your personalized focus schedule (running in adaptive offline mode due to high AI demand) tailored to your ${role || "Professional"} role. Based on your task priority levels and mood checks, we've organized your sessions to maximize your energy level.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🕒 TIME BLOCK | 📝 TASK DETAILS & COGNITIVE FIT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      tasks.forEach((t: any, index: number) => {
        const slot = timeSlots[index % timeSlots.length] || "Today, Focus Window";
        const moodText = moodEmojis[t.mood] || "😐 Neutral";
        scheduleContent += `${slot} | ${t.title}\nCategory: ${t.category || "General"} | Priority: ${t.priority || "Medium"} | Mood: ${moodText}\n💡 AI Tip: Keep your momentum steady! This session is calibrated specifically for your current ${(t.mood || "neutral").toLowerCase()} mood.\n\n`;
      });

      scheduleContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      res.json({ schedule: scheduleContent });
    }
  });

  // Task prioritization route powered by Gemini 3.5-flash
  app.post("/api/tasks/prioritize", async (req: Request, res: Response) => {
    try {
      const { title, description, deadline, priority, category, role, existingTasks = [] } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required for prioritization." });
      }

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable missing. Launching local fallback prioritization.");
        
        // Logical local fallback priority weights and suggested blocks
        let fallbackScore = 5;
        let finalPriority = priority || "Medium";
        if (priority === "Critical") fallbackScore = 9;
        else if (priority === "High") fallbackScore = 7;
        else if (priority === "Low") fallbackScore = 3;

        // Context-aware fallback suggested time block
        const suggestedTime = "Today, 3:00 PM - 4:30 PM";

        return res.json({
          aiPriorityScore: fallbackScore,
          priority: finalPriority,
          aiReasoning: "Fallback calibration: No Gemini workspace credentials detected. Displaying estimated metrics based on priority urgency.",
          suggestedTimeBlock: suggestedTime
        });
      }

      const comparisonText = existingTasks.length > 0 
        ? existingTasks.map((t: any) => `- "${t.title}" (${t.priority}, Category: ${t.category || "General"}, Deadline: ${t.deadline || "None"}, Completed: ${t.completed})`).join("\n")
        : "None (This is their only active task)";

      const prompt = `You are the brain of RapidFocus's AI Task Prioritization engine, specializing in cognitive workload management, task scheduling, and real-time Eisenhower Matrix calibration for student and professional focus.

User's Profile Persona (Role): ${role || "Professional"}
Current Time Context: ${new Date().toISOString()}

We need you to evaluate, score, and prioritize a new/updated task based on the user's focus role, their deadlines, and their broader workload context.

Task to analyze:
- Title: "${title}"
- Supplementary Detail / Checklist items: "${description || "None provided"}"
- Category: "${category || "General"}"
- Original Priority Level: "${priority || "Medium"}"
- Target Deadline: "${deadline || "No hard deadline"}"

Other tasks currently in the user's queue (for workload load balancing & comparative relevance):
${comparisonText}

Tasks analysis expectations:
1. Determine an AI Priority Score (integer between 1 and 10), marking how fast the user needs to act:
   - 9-10: Critical emergency (e.g. final exam tomorrow morning, client delivery in <24h).
   - 7-8: High priority (heavy task due within 2-3 days, or crucial prep work).
   - 4-6: Medium priority (important regular routines, school assignments, or projects due later).
   - 1-3: Low priority (flexible timeline, exploratory search/reading, optional tasks).
2. Refine the final priority classification (Must be exactly one of: 'Critical', 'High', 'Medium', 'Low'). Keep it objective and aligned with the score.
3. Write a sharp, empathetic, short AI Coach Insight (1-2 sentences max) in the second person (e.g. "You should..."). Explain the urgency relative to their role and deadlines.
4. Suggest a specific, optimized time block (e.g., "Today, 4:00 PM - 5:30 PM" or "Tomorrow morning at 10:00 AM") for completing this work block.

Return your response inside the requested JSON Schema format. Ensure your wording is highly scannable, helpful, and professional.`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiPriorityScore: {
                type: Type.INTEGER,
                description: "An urgency and importance rating between 1 and 10."
              },
              priority: {
                type: Type.STRING,
                description: "Must be exactly one of: 'Critical', 'High', 'Medium', 'Low'."
              },
              aiReasoning: {
                type: Type.STRING,
                description: "Short 1-2 sentence coach tips and explanation."
              },
              suggestedTimeBlock: {
                type: Type.STRING,
                description: "A recommended time block format e.g. 'Today, 2:00 PM - 3:30 PM'."
              }
            },
            required: ["aiPriorityScore", "priority", "aiReasoning", "suggestedTimeBlock"]
          }
        }
      });

      const bodyText = response.text?.trim() || "{}";
      const result = JSON.parse(bodyText);
      res.json(result);
    } catch (err: any) {
      console.warn("Warning running task prioritization (using local fallback instead):", err.message || err);
      let fallbackScore = 5;
      let finalPriority = req.body.priority || "Medium";
      if (req.body.priority === "Critical") fallbackScore = 9;
      else if (req.body.priority === "High") fallbackScore = 7;
      else if (req.body.priority === "Low") fallbackScore = 3;

      res.json({
        aiPriorityScore: fallbackScore,
        priority: finalPriority,
        aiReasoning: "Urgency metrics calculated via local cognitive fallback due to Gemini high-demand. Perfect for offline usage.",
        suggestedTimeBlock: "Today, 3:00 PM - 4:30 PM"
      });
    }
  });

  // Voice command semantic parameters extraction route
  app.post("/api/tasks/extract-voice", async (req: Request, res: Response) => {
    const { transcription, role } = req.body;
    try {
      if (!transcription || !transcription.trim()) {
        return res.status(400).json({ error: "No voice transcription received to dissect." });
      }

      console.log(`Dissecting raw vocal phrase: "${transcription}" with focus role: ${role || "general"}`);

      // Robust local fallback in case of no GEMINI_API_KEY
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable missing. Launching local fallback vocal parser.");

        let title = transcription;
        let priority: "Critical" | "High" | "Medium" | "Low" = "Medium";
        let deadline = "";
        let description = "";
        let category = "Other";

        // Simple Heuristic Cleaning
        const cleans = [
          /^remind me to /i,
          /^please remind me to /i,
          /^add a task to /i,
          /^i need to /i,
          /^remember to /i,
          /^put down /i,
          /^create task /i
        ];
        for (const rx of cleans) {
          title = title.replace(rx, "");
        }
        title = title.charAt(0).toUpperCase() + title.slice(1);

        // Heuristic Priority
        const lowerTrans = transcription.toLowerCase();
        if (lowerTrans.includes("urgent") || lowerTrans.includes("critical") || lowerTrans.includes("emergency") || lowerTrans.includes("asap")) {
          priority = "Critical";
        } else if (lowerTrans.includes("important") || lowerTrans.includes("must do") || lowerTrans.includes("high")) {
          priority = "High";
        } else if (lowerTrans.includes("low") || lowerTrans.includes("whenever") || lowerTrans.includes("lazy")) {
          priority = "Low";
        }

        // Heuristic Deadlines
        const targetDate = new Date();
        if (lowerTrans.includes("tomorrow")) {
          targetDate.setDate(targetDate.getDate() + 1);
          targetDate.setHours(17, 0, 0, 0); // 5 PM
          deadline = targetDate.toISOString().slice(0, 16);
        } else if (lowerTrans.includes("tonight") || lowerTrans.includes("today evening")) {
          targetDate.setHours(21, 0, 0, 0); // 9 PM
          deadline = targetDate.toISOString().slice(0, 16);
        } else if (lowerTrans.includes("friday")) {
          const currentDay = targetDate.getDay();
          const distance = (5 - currentDay + 7) % 7;
          targetDate.setDate(targetDate.getDate() + (distance === 0 ? 7 : distance));
          targetDate.setHours(18, 0, 0, 0); // 6 PM Friday
          deadline = targetDate.toISOString().slice(0, 16);
        } else if (lowerTrans.includes("monday")) {
          const currentDay = targetDate.getDay();
          const distance = (1 - currentDay + 7) % 7;
          targetDate.setDate(targetDate.getDate() + (distance === 0 ? 7 : distance));
          targetDate.setHours(9, 0, 0, 0); // 9 AM Monday
          deadline = targetDate.toISOString().slice(0, 16);
        } else {
          // Default deadline inside 24 hours to showcase calibration
          targetDate.setHours(targetDate.getHours() + 24);
          deadline = targetDate.toISOString().slice(0, 16);
        }

        // Heuristic Category Guessing
        if (lowerTrans.includes("study") || lowerTrans.includes("exam") || lowerTrans.includes("test") || lowerTrans.includes("homework") || lowerTrans.includes("class") || lowerTrans.includes("learn") || lowerTrans.includes("school") || lowerTrans.includes("book")) {
          category = "Study";
        } else if (lowerTrans.includes("job") || lowerTrans.includes("work") || lowerTrans.includes("client") || lowerTrans.includes("office") || lowerTrans.includes("meeting") || lowerTrans.includes("email") || lowerTrans.includes("sync")) {
          category = "Work";
        } else if (lowerTrans.includes("health") || lowerTrans.includes("gym") || lowerTrans.includes("run") || lowerTrans.includes("workout") || lowerTrans.includes("exercise") || lowerTrans.includes("doctor") || lowerTrans.includes("med")) {
          category = "Health";
        } else if (lowerTrans.includes("money") || lowerTrans.includes("pay") || lowerTrans.includes("bill") || lowerTrans.includes("budget") || lowerTrans.includes("finance") || lowerTrans.includes("bank")) {
          category = "Finance";
        } else {
          category = "Personal";
        }

        return res.json({
          title,
          description: "Synthesized via local fallback engine. Try verifying your Gemini active API keys.",
          deadline,
          priority,
          category
        });
      }

      const prompt = `You are a high-fidelity semantic parsing and parameter extraction engine for RapidFocus (focus role: ${role || "Professional"}).
Analyze the user's natural language voice input transcription and extract precise task setup details.
Assume the current ISO time context is EXACTLY: ${new Date().toISOString()}. Use this reference to calculate absolute dates for relative language (such as "tomorrow", "Friday evening", "next week", "in 2 hours").

Voice input phrase to process: "${transcription}"

Extraction Rules:
1. "title": Extract the specific task action. Always exclude semantic filler words like "Remind me to", "Put down", "Add a task for", "I need to", "Remember to". Clean-cut and professional.
2. "description": Extract any secondary checklist items, remarks, chapter numbers, or supplementary details mentioned. Return an empty string if there are none.
3. "deadline": Output the absolute date-time in local HTML standard "YYYY-MM-DDTHH:mm" format (e.g., "2026-06-25T18:00").
   - "by Friday evening" -> Friday at 18:00
   - "tomorrow morning" -> Tomorrow at 09:00
   - "tonight by 8" -> Today at 20:00
   - "in 3 hours" -> (Current time + 3 hours, precisely calculated)
   If no temporal dead-lines are indicated, default to a smart deadline exactly 24 hours from the current context time to avoid empty fields.
4. "priority": Determine the logical Eisenhower urgency ('Critical', 'High', 'Medium', 'Low').
   - Default to 'Medium'. Enhance to 'Critical' or 'High' if words like "ASAP", "urgent", "crucial", or "today morning" are stated.
   - Reduce to 'Low' if marked as leisure, minor, or "whenever".
5. "category": Select or recommend a logical workflow category from ["Study", "Work", "Personal", "Health", "Finance", "Other"]. Ensure it matches standard title capitalization.

Return the JSON following the requested schema.`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Cleaned task title."
              },
              description: {
                type: Type.STRING,
                description: "Supplementary comments/checklist details."
              },
              deadline: {
                type: Type.STRING,
                description: "ISO formatted HTML timeline string in YYYY-MM-DDTHH:mm format."
              },
              priority: {
                type: Type.STRING,
                description: "Urgency value: exactly one of 'Critical', 'High', 'Medium', 'Low'."
              },
              category: {
                type: Type.STRING,
                description: "Logical workflow category name matching role spheres."
              }
            },
            required: ["title", "description", "deadline", "priority", "category"]
          }
        }
      });

      const bodyText = response.text?.trim() || "{}";
      const result = JSON.parse(bodyText);
      res.json(result);
    } catch (err: any) {
      console.warn("Voice parsing engine encountered a failure:", err.message || err);
      // Fallback response inside HTTP catch
      res.status(200).json({
        title: transcription,
        description: "Encountered Gemini processing error. Used raw text.",
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        priority: "Medium",
        category: "Other"
      });
    }
  });

  // Daily Briefing Endpoint
  app.post("/api/tasks/briefing", async (req: Request, res: Response) => {
    try {
      const { tasks = [], role, userName } = req.body;

      // Smart local assessment (works both for fallback and for structure)
      const pendingTasks = tasks.filter((t: any) => !t.completed);
      const criticalCount = pendingTasks.filter((t: any) => t.priority === "Critical").length;
      const highCount = pendingTasks.filter((t: any) => t.priority === "High").length;
      const overdueTasks = pendingTasks.filter((t: any) => t.deadline && new Date(t.deadline).getTime() < new Date().getTime());

      // Let's check fallback cases
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable missing. Executing local parsing engine for the briefing.");
        
        let headline = "All Clear for Today ✓";
        let points: string[] = [];

        if (overdueTasks.length > 0) {
          headline = "OVERDUE ALERTS";
          points.push(`You have ${overdueTasks.length} task(s) currently past their deadline. Focus on resolving these immediately.`);
        } else if (criticalCount > 0) {
          headline = "Stay Alert 🔔";
          points.push(`You have ${criticalCount} critical task(s) on your radar. Give them prime focus today.`);
        } else if (highCount > 0) {
          headline = "STEADY MOMENTUM";
          points.push(`Workspace looks stable, but you have ${highCount} high value task(s) to chip away at.`);
        } else {
          headline = "RELAX & PLAN";
          points.push("All quiet on the deadline front! Use today for future planning or exploration.");
        }

        // Add typical constructive action steps
        if (pendingTasks.length > 0) {
          const topPriority = pendingTasks[0];
          points.push(`Your highest priority object of interest is "${topPriority.title}" (${topPriority.category || "General"}).`);
          points.push(`We recommend breaking goals into 30-minute block cycles to prevent fatigue.`);
        } else {
          points.push("Click '+ ADD NEW TASK' to add your first task and get started! 🚀");
        }

        return res.json({ headline, points });
      }

      const prompt = `You are a high-fidelity diagnostic engine for RapidFocus (focus role: ${role || "Professional"}).
Analyze the user's workload state at current time ${new Date().toISOString()} for user "${userName || "User"}".

Active Task List (Pending and Complete):
${tasks.length > 0 
  ? tasks.map((t: any) => `- [${t.completed ? "COMPLETED" : "PENDING"}] "${t.title}" (Priority: ${t.priority || "Medium"}, Category: ${t.category || "General"}, Deadline: ${t.deadline || "No deadline"})`).join("\n")
  : "None (This user has no tasks yet!)."
}

Provide:
1. "headline": A sharp, inspiring 2-4 word diagnostic headline (e.g. "OVERDUE ALERTS DETECTED", "HORIZON CLEAR & STEADY", "CRITICAL PREPS TODAY", "WORKSPACE SILENT").
2. "points": Exactly 3 to 4 short, actionable, empathetic, bullet points summarizing what needs their attention today. Speak to them directly in the second person ("You have..."). Point out overdue items, high-priority projects, or suggest optimizing their habits. Each point must be 1 concise sentence.

Provide your response strictly in the requested JSON structure.`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: "Inspiring 2-4 word status headline."
              },
              points: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 3 to 4 action bullet points for today."
              }
            },
            required: ["headline", "points"]
          }
        }
      });

      const bodyText = response.text?.trim() || "{}";
      const result = JSON.parse(bodyText);
      res.json(result);
    } catch (err: any) {
      console.warn("Warning running daily briefing generation (using local fallback instead):", err.message || err);
      const { tasks = [] } = req.body;
      const pendingTasks = tasks.filter((t: any) => !t.completed);
      const criticalCount = pendingTasks.filter((t: any) => t.priority === "Critical").length;
      const highCount = pendingTasks.filter((t: any) => t.priority === "High").length;
      const overdueTasks = pendingTasks.filter((t: any) => t.deadline && new Date(t.deadline).getTime() < new Date().getTime());

      let headline = "All Clear for Today ✓";
      let points: string[] = [];

      if (overdueTasks.length > 0) {
        headline = "OVERDUE ALERTS";
        points.push(`You have ${overdueTasks.length} task(s) currently past their deadline. Focus on resolving these immediately.`);
      } else if (criticalCount > 0) {
        headline = "Stay Alert 🔔";
        points.push(`You have ${criticalCount} critical task(s) on your radar. Give them prime focus today.`);
      } else if (highCount > 0) {
        headline = "STEADY MOMENTUM";
        points.push(`Workspace looks stable, but you have ${highCount} high value task(s) to chip away at.`);
      } else {
        headline = "RELAX & PLAN";
        points.push("All quiet on the deadline front! Use today for future planning or exploration.");
      }

      if (pendingTasks.length > 0) {
        const topPriority = pendingTasks[0];
        points.push(`Your highest priority object of interest is "${topPriority.title}" (${topPriority.category || "General"}).`);
        points.push(`We recommend breaking goals into 30-minute block cycles to prevent fatigue.`);
      } else {
        points.push("Click '+ ADD NEW TASK' to add your first task and get started! 🚀");
      }

      res.json({ headline, points });
    }
  });

  // Goals & Habits Weekly Feedback Insights Endpoint
  app.post("/api/goals/feedback", async (req: Request, res: Response) => {
    try {
      const { goals = [], role = "Professional", userName = "User" } = req.body;

      // Smart dynamic analytical calculations for fallback & prompt context
      const totalItems = goals.length;
      const habits = goals.filter((g: any) => g.type === "habit");
      const weeklyGoals = goals.filter((g: any) => g.type === "goal");
      
      let totalCompletedDaysCount = 0;
      let totalStreaks = 0;
      
      goals.forEach((g: any) => {
        totalCompletedDaysCount += (g.completedDays || []).length;
        totalStreaks += g.streak || 0;
      });

      // Calculate a local heuristic consistency score
      let calculatedLocalScore = 0;
      if (totalItems > 0) {
        // Base score off completions and active streaks
        const completionScore = Math.min(100, Math.floor((totalCompletedDaysCount / (totalItems * 4)) * 100));
        const streakBonus = Math.min(25, Math.floor(totalStreaks * 3));
        calculatedLocalScore = Math.max(10, Math.min(100, completionScore + streakBonus));
      } else {
        calculatedLocalScore = 0;
      }

      if (calculatedLocalScore === 0 && totalItems === 0) {
        return res.json({
          consistencyScore: 0,
          insight: "Complete weekly goals and tick off habits on your weekly tracker board to launch the Gemini Cognitive Advisor assessment!"
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable missing. Launching local analytic heuristics for Goal Feedback.");
        
        let insight = "";
        if (calculatedLocalScore >= 80) {
          insight = `Superb self-discipline, ${userName}! With a steady consistency score of ${calculatedLocalScore}%, you are perfectly reinforcing habits that build high long-term ROI. Keep fueling those active streaks!`;
        } else if (calculatedLocalScore >= 50) {
          insight = `Solid steady pace, ${userName}. Your score of ${calculatedLocalScore}% shows decent commitment, but check-ins are slightly staggered. Let's aim to lock down at least 1 more habit session today to secure consistency.`;
        } else {
          insight = `Let's work on rebuilding focus momentum, ${userName}. Sticking to daily habits is easier when breaking them into smaller steps. Try to complete your easiest habit first to break the friction barrier.`;
        }

        return res.json({
          consistencyScore: calculatedLocalScore,
          insight
        });
      }

      const prompt = `You are a cognitive systems coach and behavioral trainer.
Analyze the user's weekly goals and habit completion log to provide a holistic behavioral consistency score and weekly briefing insight.

User Name: "${userName}"
Operational Focus Role: "${role}"
Current Time Context: ${new Date().toISOString()}

Goals and Habits data:
${JSON.stringify(goals, null, 2)}

Instructions:
1. "consistencyScore": A calculated score from 1 to 100 capturing their compliance, consistency, and active streaks. If they have outstanding completion streaks, represent that generously (between 80 and 100). If many goals have 0 completed sessions, keep it down appropriately.
2. "insight": A warm, encouraging, yet highly clinical and specific weekly feedback of 2-3 sentences. Focus on cognitive momentum, building long-term habits, and optimizing routines contextually based on their professional/student role. Speak directly to them in the second person ("You...").

Strictly return your analysis in the requested JSON scheme.`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              consistencyScore: {
                type: Type.INTEGER,
                description: "Consistency execution score from 1 to 100."
              },
              insight: {
                type: Type.STRING,
                description: "A compact 2-3 sentence motivational progress review."
              }
            },
            required: ["consistencyScore", "insight"]
          }
        }
      });

      const text = response.text?.trim() || "{}";
      const result = JSON.parse(text);
      res.json(result);
    } catch (err: any) {
      console.warn("Warning to compile weekly insights (using local fallback instead):", err.message || err);
      const { goals = [], userName = "User" } = req.body;
      const totalItems = goals.length;
      let totalCompletedDaysCount = 0;
      let totalStreaks = 0;
      
      goals.forEach((g: any) => {
        totalCompletedDaysCount += (g.completedDays || []).length;
        totalStreaks += g.streak || 0;
      });

      let calculatedLocalScore = 0;
      if (totalItems > 0) {
        const completionScore = Math.min(100, Math.floor((totalCompletedDaysCount / (totalItems * 4)) * 100));
        const streakBonus = Math.min(25, Math.floor(totalStreaks * 3));
        calculatedLocalScore = Math.max(10, Math.min(100, completionScore + streakBonus));
      }

      let insight = "";
      if (calculatedLocalScore >= 80) {
        insight = `Superb self-discipline, ${userName}! With a steady consistency score of ${calculatedLocalScore}%, you are perfectly reinforcing habits that build high long-term ROI. Keep fueling those active streaks!`;
      } else if (calculatedLocalScore >= 50) {
        insight = `Solid steady pace, ${userName}. Your score of ${calculatedLocalScore}% shows decent commitment, but check-ins are slightly staggered. Let's aim to lock down at least 1 more habit session today to secure consistency.`;
      } else {
        insight = `Let's work on rebuilding focus momentum, ${userName}. Sticking to daily habits is easier when breaking them into smaller steps. Try to complete your easiest habit first to break the friction barrier.`;
      }

      res.json({
        consistencyScore: calculatedLocalScore,
        insight
      });
    }
  });

  // Analytics Insight Endpoint
  app.post("/api/analytics/insight", async (req: Request, res: Response) => {
    try {
      const { tasks = [], role = "Professional", userName = "User" } = req.body;

      const completedTasks = tasks.filter((t: any) => t.completed);
      
      // Calculate day of week completions
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      
      // Calculate time of day completions
      // Morning (5-11), Afternoon (12-17), Evening (18-22), Night (23-4)
      const periods = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };

      let onTimeCount = 0;
      let lateCount = 0;

      completedTasks.forEach((t: any) => {
        const d = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
        const dayIdx = d.getDay();
        dayCounts[dayIdx]++;

        const hour = d.getHours();
        if (hour >= 5 && hour < 12) periods.Morning++;
        else if (hour >= 12 && hour < 18) periods.Afternoon++;
        else if (hour >= 18 && hour < 23) periods.Evening++;
        else periods.Night++;

        if (t.deadline) {
          const dlTime = new Date(t.deadline).getTime();
          const compTime = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.createdAt).getTime();
          if (compTime <= dlTime) {
            onTimeCount++;
          } else {
            lateCount++;
          }
        }
      });

      // Find best day
      let maxDayIdx = 2; // Tuesday default
      let maxDayCount = 0;
      dayCounts.forEach((count, idx) => {
        if (count > maxDayCount) {
          maxDayCount = count;
          maxDayIdx = idx;
        }
      });
      const bestDay = daysOfWeek[maxDayIdx];

      // Find best period
      let bestPeriod = "morning";
      let maxPeriodCount = 0;
      Object.entries(periods).forEach(([pName, pCount]) => {
        if (pCount > maxPeriodCount) {
          maxPeriodCount = pCount;
          bestPeriod = pName.toLowerCase();
        }
      });

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable missing. Executing local analytical template.");
        const localCompletionRate = completedTasks.length > 0 
          ? Math.round((onTimeCount / (onTimeCount + lateCount || 1)) * 100) 
          : 100;
        
        let insightStr = `You complete most tasks on ${bestDay} ${bestPeriod}s. Try scheduling your hardest tasks then to maximize focus.`;
        if (completedTasks.length === 0) {
          insightStr = "Complete some items on your task list to enable customized productivity diagnostics from Gemini!";
        } else if (localCompletionRate < 70) {
          insightStr = `You complete most tasks on ${bestDay} ${bestPeriod}s, but only ${localCompletionRate}% are completed on time. Consider scheduling earlier prep buffers.`;
        }

        return res.json({ insight: insightStr });
      }

      const prompt = `You are an elite productivity analyst and cognitive performance systems model.
We need a smart, hyper-personalized, ultra-scannable behavioral suggestion (exactly 1 to 2 sentences) based on the user's completed tasks records.

User Role: ${role}
User Name: ${userName}
Completed tasks count: ${completedTasks.length}

Statistics compiled from user's history:
- Best Day of Week: ${bestDay} (Frequency: ${maxDayCount} tasks)
- Best Time of Day: ${bestPeriod}s (Frequency: ${JSON.stringify(periods)})
- On-time completions: ${onTimeCount} tasks
- Late completions: ${lateCount} tasks

Instructions:
1. "insight": Generate a customized productivity tip. Mention when they are most productive (e.g., "${bestDay} ${bestPeriod}s" or another pattern) and supply advice on how they can optimize their workflow (e.g. scheduling their hardest or most critical task then, setting buffer alerts, or focusing on high-impact blocks). 
Be direct, empathetic, and professional. Speak in the second person ("You..."). Avoid template filler.

Format as a strict JSON Scheme.`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insight: {
                type: Type.STRING,
                description: "The 1-2 sentence peak production advice recommendation."
              }
            },
            required: ["insight"]
          }
        }
      });

      const text = response.text?.trim() || "{}";
      const result = JSON.parse(text);
      res.json(result);
    } catch (err: any) {
      console.warn("Warning to generate analytics insight (using local fallback instead):", err.message || err);
      const { tasks = [] } = req.body;
      const completedTasks = tasks.filter((t: any) => t.completed);

      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      const periods = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
      let onTimeCount = 0;
      let lateCount = 0;

      completedTasks.forEach((t: any) => {
        const d = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
        const dayIdx = d.getDay();
        dayCounts[dayIdx]++;

        const hour = d.getHours();
        if (hour >= 5 && hour < 12) periods.Morning++;
        else if (hour >= 12 && hour < 18) periods.Afternoon++;
        else if (hour >= 18 && hour < 23) periods.Evening++;
        else periods.Night++;

        if (t.deadline) {
          const dlTime = new Date(t.deadline).getTime();
          const compTime = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.createdAt).getTime();
          if (compTime <= dlTime) {
            onTimeCount++;
          } else {
            lateCount++;
          }
        }
      });

      let maxDayIdx = 2; // Tuesday default
      let maxDayCount = 0;
      dayCounts.forEach((count, idx) => {
        if (count > maxDayCount) {
          maxDayCount = count;
          maxDayIdx = idx;
        }
      });
      const bestDay = daysOfWeek[maxDayIdx];

      let bestPeriod = "morning";
      let maxPeriodCount = 0;
      Object.entries(periods).forEach(([pName, pCount]) => {
        if (pCount > maxPeriodCount) {
          maxPeriodCount = pCount;
          bestPeriod = pName.toLowerCase();
        }
      });

      const localCompletionRate = completedTasks.length > 0 
        ? Math.round((onTimeCount / (onTimeCount + lateCount || 1)) * 100) 
        : 100;
      
      let insightStr = `You complete most tasks on ${bestDay} ${bestPeriod}s. Try scheduling your hardest tasks then to maximize focus.`;
      if (completedTasks.length === 0) {
        insightStr = "Complete some items on your task list to enable customized productivity diagnostics from Gemini!";
      } else if (localCompletionRate < 70) {
        insightStr = `You complete most tasks on ${bestDay} ${bestPeriod}s, but only ${localCompletionRate}% are completed on time. Consider scheduling earlier prep buffers.`;
      }

      res.json({ insight: insightStr });
    }
  });

  // Dynamic Chat backend endpoint powered by Gemini 3.5-flash
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { messages, tasks = [], role, userName } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      // Convert tasks into structured markdown context for Gemini model awareness
      const tasksContext = tasks.length > 0
        ? tasks.map((t: any) => `- [${t.completed ? "COMPLETED" : "PENDING"}] "${t.title}" (Priority: ${t.priority}, Category: ${t.category || "General"}, Deadline: ${t.deadline || "No deadline"}, AI Urgency Score: ${t.aiPriorityScore || "N/A"})`).join("\n")
        : "None (The user has not entered any tasks yet). Encourage them to add some!";

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY environment variable missing. Launching local fallback chatbot.");
        const lastUserMessage = (messages && messages.length > 0) 
          ? messages[messages.length - 1].content.toLowerCase() 
          : "";
        
        let reply = "";
        if (lastUserMessage.includes("hello") || lastUserMessage.includes("hi")) {
          reply = `Hello, ${userName || "friend"}! I'm RapidFocus, your adaptive productivity companion. I'm ready to help you plan your day. What should we tackle first?`;
        } else if (lastUserMessage.includes("task") || lastUserMessage.includes("todo") || lastUserMessage.includes("list")) {
          const pending = tasks.filter((t: any) => !t.completed).length;
          reply = `You have ${pending} pending tasks active in your roster. Let's pick one of your high-urgency or due-soon items and schedule a block for it today!`;
        } else if (lastUserMessage.includes("schedule") || lastUserMessage.includes("plan") || lastUserMessage.includes("today")) {
          reply = `Let's make a crisp plan for today! Direct your focus towards any pending items on your dashboard. I suggest breaking down your largest task into 3 quick steps and doing a 45-minute focus burst.`;
        } else {
          reply = `Interesting query! I can help you break down that concept, plan your timing, or give you advice. (Provide a GEMINI_API_KEY in your settings to unlock deep personal scheduling insights!) Let's stay on top of those deadlines!`;
        }
        return res.json({ text: reply });
      }

      const systemInstruction = `You are RapidFocus, a proactive productivity companion. You know the user's tasks, deadlines, and schedule. Help them plan their day, break down big tasks, suggest time blocks, and give motivational nudges. Be concise, warm, and direct.

User Focus Role: ${role || "Professional"}
User Name: ${userName || "User"}
Current Time Context: ${new Date().toISOString()}

User's Current Tasks List:
${tasksContext}

When referring to their tasks, speak about them accurately and constructively. Encourage them to tackle high-urgency or critical items. Suggest specific time blocks or break down tasks into actionable sub-steps if they are feeling overwhelmed. Use plain, elegant styling in your markdown responses (bold text, simple bullet-points). No complex HTML. Ensure your tone is helpful, uplifting, but focused and professional.`;

      // Map roles to standard gemini roles and build parts payload dynamically
      const formattedContents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: [{ text: m.content }]
      }));

      const modelResponse = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 800
        }
      });

      const replyText = modelResponse.text?.trim() || "I am processing your schedule block right now. Let me know how I can assist.";
      res.json({ text: replyText });
    } catch (err: any) {
      console.warn("Warning in chat endpoint (using local chatbot fallback):", err.message || err);
      const { messages, tasks = [], userName } = req.body;
      const lastUserMessage = (messages && messages.length > 0) 
        ? messages[messages.length - 1].content.toLowerCase() 
        : "";
      
      let reply = "";
      if (lastUserMessage.includes("hello") || lastUserMessage.includes("hi")) {
        reply = `Hello, ${userName || "friend"}! I'm RapidFocus, your adaptive productivity companion. I'm ready to help you plan your day. What should we tackle first?`;
      } else if (lastUserMessage.includes("task") || lastUserMessage.includes("todo") || lastUserMessage.includes("list")) {
        const pending = tasks.filter((t: any) => !t.completed).length;
        reply = `You have ${pending} pending tasks active in your roster. Let's pick one of your high-urgency or due-soon items and schedule a block for it today!`;
      } else if (lastUserMessage.includes("schedule") || lastUserMessage.includes("plan") || lastUserMessage.includes("today")) {
        reply = `Let's make a crisp plan for today! Direct your focus towards any pending items on your dashboard. I suggest breaking down your largest task into 3 quick steps and doing a 45-minute focus burst.`;
      } else {
        reply = `I am processing your scheduling request right now (Gemini engine is temporarily experiencing high demand, running in local adaptive mode). Focus on completing high priority items first!`;
      }
      res.json({ text: reply });
    }
  });

  // Vite asset integration / SPA routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
 
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 RapidFocus Server booting on http://0.0.0.0:${PORT}`);
  });
}
 
startServer().catch((err: any) => {
  console.error("Fatal: failed to start RapidFocus server:", err);
});
