import { useState, useCallback } from "react";
import { scheduleService } from "../services/scheduleService";
import { SchedulingEngine } from "../utils/schedulingAlgorithm";
import { useAuth } from "./useAuth";
import { format, startOfWeek } from "date-fns";
import toast from "react-hot-toast";

/**
 * Custom hook for schedule management
 * Handles schedule generation, session tracking, and rescheduling
 */
export function useSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Generate weekly schedule
  const generateSchedule = useCallback(
    async (tasks, exams, studySessionLimit = 480) => {
      if (!user) {
        toast.error("You must be logged in");
        return { success: false };
      }

      try {
        setGenerating(true);
        const startTime = Date.now();

        // Filter valid tasks and exams
        const pendingTasks = tasks.filter((t) => t.status === "pending");
        const upcomingExams = exams.filter(
          (e) => new Date(e.date) > new Date()
        );

        if (pendingTasks.length === 0 && upcomingExams.length === 0) {
          toast.error("No tasks or exams to schedule");
          return { success: false };
        }

        // Run scheduling algorithm
        const engine = new SchedulingEngine(
          pendingTasks,
          upcomingExams,
          studySessionLimit
        );
        const newSchedule = engine.generateWeeklySchedule();

        // Validate schedule
        const validation = engine.validateSchedule(newSchedule);
        if (!validation.isValid) {
          console.warn("Schedule validation warnings:", validation.details);
        }

        // Save to database
        const allSessions = Object.values(newSchedule).flatMap(
          (day) => day.sessions
        );
        const weekStart = format(
          startOfWeek(new Date(), { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );
        await scheduleService.saveSchedule(user.uid, allSessions, weekStart);

        setSchedule(newSchedule);

        const elapsed = Date.now() - startTime;
        toast.success(`Schedule generated in ${(elapsed / 1000).toFixed(2)}s`);

        return {
          success: true,
          schedule: newSchedule,
          generationTime: elapsed,
          validation,
        };
      } catch (err) {
        console.error("Error generating schedule:", err);
        toast.error("Failed to generate schedule");
        return { success: false, error: err.message };
      } finally {
        setGenerating(false);
      }
    },
    [user]
  );

  // Load existing schedule
  const loadSchedule = useCallback(
    async (weekStartDate) => {
      if (!user) return;

      try {
        setLoading(true);
        const weekStart =
          weekStartDate ||
          format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

        const sessions = await scheduleService.getWeekSchedule(
          user.uid,
          weekStart
        );

        // Convert sessions array to schedule object
        const scheduleObj = {};
        sessions.forEach((session) => {
          if (!scheduleObj[session.date]) {
            scheduleObj[session.date] = {
              date: session.date,
              sessions: [],
              totalMinutes: 0,
            };
          }
          scheduleObj[session.date].sessions.push(session);
          scheduleObj[session.date].totalMinutes += session.duration;
        });

        setSchedule(scheduleObj);
        return { success: true, schedule: scheduleObj };
      } catch (err) {
        console.error("Error loading schedule:", err);
        toast.error("Failed to load schedule");
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Update session status
  const updateSessionStatus = useCallback(
    async (sessionId, status) => {
      try {
        await scheduleService.updateSessionStatus(sessionId, status);

        // Update local state
        const updatedSchedule = { ...schedule };
        Object.keys(updatedSchedule).forEach((date) => {
          updatedSchedule[date].sessions = updatedSchedule[date].sessions.map(
            (s) => (s.id === sessionId ? { ...s, status } : s)
          );
        });
        setSchedule(updatedSchedule);

        toast.success(`Session marked as ${status}`);
        return { success: true };
      } catch (err) {
        console.error("Error updating session:", err);
        toast.error("Failed to update session");
        return { success: false, error: err.message };
      }
    },
    [schedule]
  );

  // Get sessions for specific date
  const getSessionsForDate = useCallback(
    (date) => {
      const dateKey = format(new Date(date), "yyyy-MM-dd");
      return schedule[dateKey]?.sessions || [];
    },
    [schedule]
  );

  // Get total study time for date
  const getTotalTimeForDate = useCallback(
    (date) => {
      const dateKey = format(new Date(date), "yyyy-MM-dd");
      return schedule[dateKey]?.totalMinutes || 0;
    },
    [schedule]
  );

  // Get all sessions
  const getAllSessions = useCallback(() => {
    return Object.values(schedule).flatMap((day) => day.sessions);
  }, [schedule]);

  // Get completed sessions
  const getCompletedSessions = useCallback(() => {
    return getAllSessions().filter((s) => s.status === "completed");
  }, [getAllSessions]);

  // Get missed sessions
  const getMissedSessions = useCallback(() => {
    return getAllSessions().filter((s) => s.status === "missed");
  }, [getAllSessions]);

  // Clear schedule
  const clearSchedule = useCallback(async () => {
    if (!user) return;

    try {
      const weekStart = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      await scheduleService.clearWeekSchedule(user.uid, weekStart);
      setSchedule({});
      toast.success("Schedule cleared");
      return { success: true };
    } catch (err) {
      console.error("Error clearing schedule:", err);
      toast.error("Failed to clear schedule");
      return { success: false, error: err.message };
    }
  }, [user]);

  return {
    schedule,
    loading,
    generating,
    generateSchedule,
    loadSchedule,
    updateSessionStatus,
    getSessionsForDate,
    getTotalTimeForDate,
    getAllSessions,
    getCompletedSessions,
    getMissedSessions,
    clearSchedule,
  };
}

export default useSchedule;
