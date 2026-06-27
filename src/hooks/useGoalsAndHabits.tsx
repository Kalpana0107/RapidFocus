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
  setDoc,
  getDoc
} from "firebase/firestore";
import { Goal } from "../types";

// Helper to calculate date offsets in local timezone
function getLocalDayOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Duolingo-style streak calculation based on the list of checked dates (YYYY-MM-DD)
export function calculateStreak(completedDays: string[]): number {
  if (!completedDays || completedDays.length === 0) return 0;
  
  // Clean duplicate dates and sort descending
  const uniqueDates = new Set(completedDays);
  const todayStr = getLocalDayOffset(0);
  const yesterdayStr = getLocalDayOffset(-1);
  
  // If neither today nor yesterday is completed, the active streak is broken (0)
  if (!uniqueDates.has(todayStr) && !uniqueDates.has(yesterdayStr)) {
    return 0;
  }
  
  let currentStreak = 0;
  let offset = 0;
  
  // Walk backwards from today or yesterday to count contiguous days
  if (uniqueDates.has(todayStr)) {
    while (uniqueDates.has(getLocalDayOffset(-offset))) {
      currentStreak++;
      offset++;
    }
  } else if (uniqueDates.has(yesterdayStr)) {
    offset = 1; // start walking from yesterday
    while (uniqueDates.has(getLocalDayOffset(-offset))) {
      currentStreak++;
      offset++;
    }
  }
  
  return currentStreak;
}

export function useGoalsAndHabits() {
  const { user, profile, isDemoMode } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Weekly insight and consistency states
  const [weeklyConsistencyScore, setWeeklyConsistencyScore] = useState<number | null>(null);
  const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  // Firestore sync subscription
  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    if (isDemoMode || user.uid === "demo-sandbox-uid") {
      const localGoalsStr = localStorage.getItem("rapidfocus_demo_goals");
      const localGoals: Goal[] = localGoalsStr ? JSON.parse(localGoalsStr) : [
        {
          id: "demo-goal-1",
          title: "Daily Focus Marathon",
          type: "habit",
          targetDays: 7,
          completedDays: [],
          streak: 0,
          createdAt: new Date().toISOString()
        },
        {
          id: "demo-goal-2",
          title: "Read research paper drafts",
          type: "goal",
          targetDays: 3,
          completedDays: [],
          streak: 0,
          createdAt: new Date().toISOString()
        }
      ];
      if (!localGoalsStr) {
        localStorage.setItem("rapidfocus_demo_goals", JSON.stringify(localGoals));
      }
      setGoals(localGoals);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = `users/${user.uid}/goals`;
    const q = query(
      collection(db, "users", user.uid, "goals"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Goal[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title || "",
          type: data.type || "goal",
          targetDays: data.targetDays || 3,
          completedDays: data.completedDays || [],
          streak: data.streak || 0,
          createdAt: data.createdAt || ""
        } as Goal);
      });
      setGoals(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isDemoMode]);

  // Fetch or trigger Weekly AI feedback
  const fetchWeeklyAIInsight = async (currentGoalsList = goals) => {
    if (!user || !profile || currentGoalsList.length === 0) return;

    const currentHash = JSON.stringify(
      [...currentGoalsList]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(g => ({
          id: g.id,
          title: g.title || "",
          type: g.type,
          streak: g.streak || 0,
          completedDays: g.completedDays || []
        }))
    );

    const cachedStr = localStorage.getItem("rapidfocus_goals_feedback_cache");
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        const ageMs = Date.now() - cached.timestamp;
        const isExpired = ageMs > 30 * 60 * 1000; // 30 minutes
        
        if (cached.goalsHash === currentHash && !isExpired) {
          setWeeklyConsistencyScore(cached.consistencyScore);
          setWeeklyInsight(cached.insight);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse cached goals insight:", e);
      }
    }

    try {
      setInsightLoading(true);
      const response = await fetch("/api/goals/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: currentGoalsList,
          role: profile.role,
          userName: profile.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        setWeeklyConsistencyScore(data.consistencyScore);
        setWeeklyInsight(data.insight);

        // Store in cache
        localStorage.setItem("rapidfocus_goals_feedback_cache", JSON.stringify({
          goalsHash: currentHash,
          consistencyScore: data.consistencyScore,
          insight: data.insight,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      console.error("AI Coach could not generate habit consistency insight:", err);
    } finally {
      setInsightLoading(false);
    }
  };

  // Trigger insight when goals change or initialize
  useEffect(() => {
    if (!loading && goals.length > 0 && weeklyConsistencyScore === null) {
      fetchWeeklyAIInsight(goals);
    }
  }, [loading, goals, weeklyConsistencyScore]);

  // Create Goal or Habit
  const addGoal = async (title: string, type: "goal" | "habit", targetDays = 3) => {
    if (!user) throw new Error("Authentication status required.");
    
    const newGoalData: Goal = {
      id: (isDemoMode || user.uid === "demo-sandbox-uid") ? `demo-goal-${Date.now()}` : "",
      title,
      type,
      targetDays: type === "goal" ? targetDays : 7, // habits are daily (7)
      completedDays: [],
      streak: 0,
      createdAt: new Date().toISOString()
    };

    if (isDemoMode || user.uid === "demo-sandbox-uid") {
      const localGoalsStr = localStorage.getItem("rapidfocus_demo_goals");
      const localGoals: Goal[] = localGoalsStr ? JSON.parse(localGoalsStr) : [];
      const updated = [newGoalData, ...localGoals];
      localStorage.setItem("rapidfocus_demo_goals", JSON.stringify(updated));
      setGoals(updated);
      return newGoalData.id;
    }

    const path = `users/${user.uid}/goals`;
    try {
      const docRef = await addDoc(collection(db, "users", user.uid, "goals"), newGoalData);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Toggle completion mark of a custom day
  const toggleGoalDate = async (goalId: string, dateStr: string) => {
    if (!user) return;
    if (isDemoMode || user.uid === "demo-sandbox-uid") {
      const localGoalsStr = localStorage.getItem("rapidfocus_demo_goals");
      const localGoals: Goal[] = localGoalsStr ? JSON.parse(localGoalsStr) : [];
      const updated = localGoals.map(g => {
        if (g.id === goalId) {
          let updatedCompletedDays = [...g.completedDays];
          if (updatedCompletedDays.includes(dateStr)) {
            updatedCompletedDays = updatedCompletedDays.filter(d => d !== dateStr);
          } else {
            updatedCompletedDays.push(dateStr);
          }
          const updatedStreak = calculateStreak(updatedCompletedDays);
          return {
            ...g,
            completedDays: updatedCompletedDays,
            streak: updatedStreak
          };
        }
        return g;
      });
      localStorage.setItem("rapidfocus_demo_goals", JSON.stringify(updated));
      setGoals(updated);
      return;
    }
    const path = `users/${user.uid}/goals/${goalId}`;
    try {
      const docRef = doc(db, "users", user.uid, "goals", goalId);
      const targetGoal = goals.find(g => g.id === goalId);
      if (!targetGoal) return;

      let updatedCompletedDays = [...targetGoal.completedDays];
      if (updatedCompletedDays.includes(dateStr)) {
        updatedCompletedDays = updatedCompletedDays.filter(d => d !== dateStr);
      } else {
        updatedCompletedDays.push(dateStr);
      }

      // Compute streak on the fly
      const updatedStreak = calculateStreak(updatedCompletedDays);

      await updateDoc(docRef, {
        completedDays: updatedCompletedDays,
        streak: updatedStreak
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Delete Goal or Habit
  const deleteGoal = async (goalId: string) => {
    if (!user) return;
    if (isDemoMode || user.uid === "demo-sandbox-uid") {
      const localGoalsStr = localStorage.getItem("rapidfocus_demo_goals");
      const localGoals: Goal[] = localGoalsStr ? JSON.parse(localGoalsStr) : [];
      const updated = localGoals.filter(g => g.id !== goalId);
      localStorage.setItem("rapidfocus_demo_goals", JSON.stringify(updated));
      setGoals(updated);
      return;
    }
    const path = `users/${user.uid}/goals/${goalId}`;
    try {
      const docRef = doc(db, "users", user.uid, "goals", goalId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return {
    goals,
    loading,
    weeklyConsistencyScore,
    weeklyInsight,
    insightLoading,
    addGoal,
    toggleGoalDate,
    deleteGoal,
    refreshAIInsight: () => fetchWeeklyAIInsight(goals)
  };
}
