import { useEffect, useState } from "react";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { useAuth } from "./useAuth";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from "firebase/firestore";
import { Task } from "../types";
import { 
  getDemoTasks, 
  saveDemoTasks, 
  addDemoTask, 
  updateDemoTask 
} from "../services/demoStorage";

export function useTasks() {
  const { user, profile, isDemoMode } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    if (isDemoMode) {
      // Simulate loading state briefly for ultra-smooth UI feel
      const timer = setTimeout(() => {
        setTasks(getDemoTasks());
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    setLoading(true);
    // Path: users/{uid}/tasks
    const q = query(
      collection(db, "users", user.uid, "tasks"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        taskList.push({
          id: docSnap.id,
          title: data.title || "",
          description: data.description || "",
          deadline: data.deadline || "",
          priority: data.priority || "Medium",
          category: data.category || "General",
          completed: !!data.completed,
          completedAt: data.completedAt || null,
          aiPriorityScore: data.aiPriorityScore,
          aiReasoning: data.aiReasoning,
          suggestedTimeBlock: data.suggestedTimeBlock,
          createdAt: data.createdAt || "",
          timeSpent: data.timeSpent !== undefined ? data.timeSpent : 0,
          timerMode: data.timerMode || undefined,
          wasOnTime: data.wasOnTime !== undefined ? data.wasOnTime : undefined,
          mood: data.mood || undefined,
          moodUpdatedAt: data.moodUpdatedAt || undefined
        } as Task);
      });
      setTasks(taskList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/tasks`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isDemoMode]);

  const prioritizeTaskWithAI = async (
    taskId: string,
    taskData: {
      title: string;
      description: string;
      deadline: string;
      priority: "Critical" | "High" | "Medium" | "Low";
      category: string;
    },
    taskListContext = tasks
  ) => {
    try {
      const response = await fetch("/api/tasks/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          deadline: taskData.deadline,
          priority: taskData.priority,
          category: taskData.category,
          role: profile?.role || "Student",
          existingTasks: taskListContext.filter((t) => t.id !== taskId)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to prioritize task: ${response.statusText}`);
      }

      const aiResult = await response.json();
      if (aiResult && aiResult.aiPriorityScore !== undefined) {
        await updateTaskAIResults(
          taskId,
          aiResult.aiPriorityScore,
          aiResult.priority,
          aiResult.aiReasoning,
          aiResult.suggestedTimeBlock
        );
      }
    } catch (err) {
      console.error("AI Prioritization calibration failed:", err);
    }
  };

  const addTask = async (taskData: Omit<Task, "id" | "createdAt" | "completed">) => {
    if (!user) throw new Error("User must be authenticated");

    if (isDemoMode) {
      const newTask = addDemoTask(taskData);
      setTasks(getDemoTasks());
      prioritizeTaskWithAI(newTask.id, taskData, getDemoTasks());
      return newTask.id;
    }

    const newTask: Task = {
      id: "",
      ...taskData,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    };

    const path = `users/${user.uid}/tasks`;
    try {
      const docRef = await addDoc(collection(db, "users", user.uid, "tasks"), newTask);
      // Trigger AI Prioritization calibration in the background (asynchronous & non-blocking)
      prioritizeTaskWithAI(docRef.id, taskData);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    if (!user) return;
    if (isDemoMode) {
      updateDemoTask(taskId, {
        completed,
        completedAt: completed ? new Date().toISOString() : null
      });
      setTasks(getDemoTasks());
      return;
    }
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      const taskDocRef = doc(db, "users", user.uid, "tasks", taskId);
      await updateDoc(taskDocRef, {
        completed,
        completedAt: completed ? new Date().toISOString() : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    if (isDemoMode) {
      const updated = getDemoTasks().filter((t: any) => t.id !== taskId);
      saveDemoTasks(updated);
      setTasks(updated);
      return;
    }
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      const taskDocRef = doc(db, "users", user.uid, "tasks", taskId);
      await deleteDoc(taskDocRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateTask = async (
    taskId: string,
    updates: Partial<Omit<Task, "id" | "createdAt">>
  ) => {
    if (!user) return;
    if (isDemoMode) {
      updateDemoTask(taskId, updates);
      const updated = getDemoTasks();
      setTasks(updated);

      const shouldPrioritize =
        updates.title !== undefined ||
        updates.description !== undefined ||
        updates.deadline !== undefined ||
        updates.priority !== undefined ||
        updates.category !== undefined;

      if (shouldPrioritize) {
        const currentTask = updated.find((t) => t.id === taskId);
        if (currentTask) {
          const mergedData = {
            title: currentTask.title,
            description: currentTask.description,
            deadline: currentTask.deadline,
            priority: currentTask.priority as "Critical" | "High" | "Medium" | "Low",
            category: currentTask.category,
          };
          prioritizeTaskWithAI(taskId, mergedData, updated);
        }
      }
      return;
    }
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      // Create updates inside firestore
      const taskDocRef = doc(db, "users", user.uid, "tasks", taskId);
      await updateDoc(taskDocRef, updates);

      // Trigger re-prioritization if title or timing parameters are modified
      const shouldPrioritize =
        updates.title !== undefined ||
        updates.description !== undefined ||
        updates.deadline !== undefined ||
        updates.priority !== undefined ||
        updates.category !== undefined;

      if (shouldPrioritize) {
        const currentTask = tasks.find((t) => t.id === taskId);
        if (currentTask) {
          const mergedData = {
            title: updates.title !== undefined ? updates.title : currentTask.title,
            description: updates.description !== undefined ? updates.description : currentTask.description,
            deadline: updates.deadline !== undefined ? updates.deadline : currentTask.deadline,
            priority: (updates.priority !== undefined ? updates.priority : currentTask.priority) as "Critical" | "High" | "Medium" | "Low",
            category: updates.category !== undefined ? updates.category : currentTask.category,
          };
          prioritizeTaskWithAI(taskId, mergedData);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateTaskAIResults = async (
    taskId: string, 
    score: number, 
    label: "Critical" | "High" | "Medium" | "Low", 
    reasoning: string, 
    timeBlock: string
  ) => {
    if (!user) return;
    if (isDemoMode) {
      updateDemoTask(taskId, {
        aiPriorityScore: score,
        priority: label,
        aiReasoning: reasoning,
        suggestedTimeBlock: timeBlock
      });
      setTasks(getDemoTasks());
      return;
    }
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      const taskDocRef = doc(db, "users", user.uid, "tasks", taskId);
      await updateDoc(taskDocRef, {
        aiPriorityScore: score,
        priority: label,
        aiReasoning: reasoning,
        suggestedTimeBlock: timeBlock
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return {
    tasks,
    loading,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    updateTask,
    updateTaskAIResults,
    prioritizeTaskWithAI
  };
}
