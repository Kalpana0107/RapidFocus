import { useEffect, useRef } from "react";
import { Task } from "../types";

export function usePushNotifications(tasks: Task[]) {
  const alertedTasksRef = useRef<Record<string, "tomorrow" | "due2h" | "overdue">>({});

  // 1. Request permission on load
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // 2. Load already notified records from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rapidfocus_notified_tasks");
      if (saved) {
        alertedTasksRef.current = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to read notified tasks state:", e);
    }
  }, []);

  // 3. Save notified records to localStorage
  const saveNotifiedState = (state: Record<string, "tomorrow" | "due2h" | "overdue">) => {
    try {
      localStorage.setItem("rapidfocus_notified_tasks", JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to write notified tasks state:", e);
    }
  };

  // 4. Checking engine
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const checkDeadlines = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
      }

      const now = Date.now();
      let stateChanged = false;
      const nextAlertedState = { ...alertedTasksRef.current };

      tasks.forEach((task) => {
        if (task.completed || !task.deadline) return;

        const deadlineTime = new Date(task.deadline).getTime();
        const diffMs = deadlineTime - now;

        const previousNotification = nextAlertedState[task.id];

        // Level A: Overdue
        if (diffMs < 0) {
          if (previousNotification !== "overdue") {
            const n = new Notification("RapidFocus Overdue Task!", {
              body: `❌ "${task.title}" is overdue! Complete it now.`,
              icon: "/favicon.ico"
            });
            n.onclick = () => {
              window.focus();
              localStorage.setItem("rapidfocus_highlight_task_id", task.id);
              window.dispatchEvent(new Event("rapidfocus_highlight_task"));
            };
            nextAlertedState[task.id] = "overdue";
            stateChanged = true;
          }
        }
        // Level B: Due in 2 hours
        else if (diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000) {
          if (previousNotification !== "due2h" && previousNotification !== "overdue") {
            const n = new Notification("RapidFocus Critical Timeline", {
              body: `🚨 "${task.title}" is due in 2 hours! Start now!`,
              icon: "/favicon.ico"
            });
            n.onclick = () => {
              window.focus();
              localStorage.setItem("rapidfocus_highlight_task_id", task.id);
              window.dispatchEvent(new Event("rapidfocus_highlight_task"));
            };
            nextAlertedState[task.id] = "due2h";
            stateChanged = true;
          }
        }
        // Level C: Due in 24 hours
        else if (diffMs > 2 * 60 * 60 * 1000 && diffMs <= 24 * 60 * 60 * 1000) {
          if (previousNotification !== "tomorrow" && previousNotification !== "due2h" && previousNotification !== "overdue") {
            const n = new Notification("RapidFocus Target Timeline", {
              body: `⚠️ "${task.title}" is due tomorrow!`,
              icon: "/favicon.ico"
            });
            n.onclick = () => {
              window.focus();
              localStorage.setItem("rapidfocus_highlight_task_id", task.id);
              window.dispatchEvent(new Event("rapidfocus_highlight_task"));
            };
            nextAlertedState[task.id] = "tomorrow";
            stateChanged = true;
          }
        }
      });

      if (stateChanged) {
        alertedTasksRef.current = nextAlertedState;
        saveNotifiedState(nextAlertedState);
      }
    };

    // Run initial scan once tasks load
    checkDeadlines();

    // Check every 30 minutes in background
    const interval = setInterval(checkDeadlines, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tasks]);
}
