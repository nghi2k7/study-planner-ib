import {
  addDays,
  startOfWeek,
  differenceInDays,
  isBefore,
  format,
} from "date-fns";

/**
 * Priority-based scheduling algorithm
 * Implements the core logic from CSIA requirements
 */

export class SchedulingEngine {
  constructor(tasks, exams, studySessionLimitMinutes = 480) {
    this.tasks = tasks;
    this.exams = exams;
    this.studySessionLimitMinutes = studySessionLimitMinutes;
    this.schedule = {};
  }

  /**
   * Main scheduling function
   * Returns a 7-day schedule with sessions
   */
  generateWeeklySchedule(startDate = new Date()) {
    const start = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
    const sessions = [];

    // Initialize study session time limits
    const sessionTimeUsed = {};
    for (let i = 0; i < 7; i++) {
      const day = format(addDays(start, i), "yyyy-MM-dd");
      sessionTimeUsed[day] = 0;
    }

    // Step 1: Schedule homework tasks (highest priority)
    const sortedTasks = this.sortTasksByDeadline();

    for (const task of sortedTasks) {
      const taskSessions = this.scheduleTask(task, start, sessionTimeUsed);
      if (taskSessions && taskSessions.length > 0) {
        sessions.push(...taskSessions);
      }
    }

    // Step 2: Distribute exam revision sessions
    for (const exam of this.exams) {
      const examSessions = this.distributeExamRevision(
        exam,
        start,
        sessionTimeUsed
      );
      sessions.push(...examSessions);
    }

    return this.formatSchedule(sessions, start);
  }

  /**
   * Sort tasks by deadline (earliest first)
   */
  sortTasksByDeadline() {
    return [...this.tasks].sort((a, b) => {
      const dateA = new Date(a.deadline);
      const dateB = new Date(b.deadline);
      return dateA - dateB;
    });
  }

  /**
   * Schedule a single homework task
   * Supports splitting across multiple days if needed (greedy filling)
   */
  scheduleTask(task, weekStart, sessionTimeUsed) {
    const deadline = new Date(task.deadline);
    const daysUntilDeadline = differenceInDays(deadline, weekStart);
    let remainingMinutes = task.estimatedTime;
    const taskSessions = [];

    // Try to schedule across available days before deadline
    for (let day = 0; day <= Math.min(daysUntilDeadline, 6); day++) {
      const currentDay = format(addDays(weekStart, day), "yyyy-MM-dd");
      const freeMinutes = this.studySessionLimitMinutes - sessionTimeUsed[currentDay];

      if (freeMinutes > 0) {
        const timeToAssign = Math.min(remainingMinutes, freeMinutes);

        sessionTimeUsed[currentDay] += timeToAssign;
        remainingMinutes -= timeToAssign;

        taskSessions.push({
          id: `task-${task.id}-${day}-${Date.now()}`,
          type: "homework",
          taskId: task.id,
          title: task.name,
          subject: task.subject,
          date: currentDay,
          duration: timeToAssign,
          status: "planned",
        });
      }

      if (remainingMinutes <= 0) break;
    }

    if (remainingMinutes > 0) {
      console.warn(
        `Could not fully schedule task: ${task.name}. Remaining: ${remainingMinutes}m`
      );
    }

    return taskSessions;
  }

  /**
   * Distribute exam revision across available days
   * Implements greedy filling as per flowchart
   */
  distributeExamRevision(exam, weekStart, sessionTimeUsed) {
    const examDate = new Date(exam.date);
    const daysUntilExam = differenceInDays(examDate, weekStart);
    const sessions = [];

    if (daysUntilExam < 0) return sessions;

    let remainingMinutes = exam.estimatedTime || 240;
    const daysToUse = Math.min(Math.max(daysUntilExam, 3), 7);
    const idealDailyShare = Math.ceil(remainingMinutes / daysToUse);

    for (let day = 0; day < daysToUse && day < 7; day++) {
      const currentDay = format(addDays(weekStart, day), "yyyy-MM-dd");
      const freeMinutes = this.studySessionLimitMinutes - sessionTimeUsed[currentDay];

      if (freeMinutes > 0) {
        // Assign up to ideal share or whatever is free
        const timeToAssign = Math.min(
          remainingMinutes,
          freeMinutes,
          idealDailyShare
        );

        if (timeToAssign > 0) {
          sessionTimeUsed[currentDay] += timeToAssign;
          remainingMinutes -= timeToAssign;

          sessions.push({
            id: `exam-${exam.id}-${day}-${Date.now()}`,
            type: "exam_revision",
            examId: exam.id,
            title: `${exam.subject} Revision`,
            subject: exam.subject,
            date: currentDay,
            duration: timeToAssign,
            status: "planned",
          });
        }
      }

      if (remainingMinutes <= 0) break;
    }

    // If still have minutes, do another pass to fill up remaining free time
    if (remainingMinutes > 0) {
      for (let day = 0; day < daysToUse && day < 7; day++) {
        const currentDay = format(addDays(weekStart, day), "yyyy-MM-dd");
        const freeMinutes = this.studySessionLimitMinutes - sessionTimeUsed[currentDay];

        if (freeMinutes > 0) {
          const timeToAssign = Math.min(remainingMinutes, freeMinutes);

          // Find existing session for this day/exam or create new
          const existingSession = sessions.find((s) => s.date === currentDay);
          if (existingSession) {
            existingSession.duration += timeToAssign;
          } else {
            sessions.push({
              id: `exam-${exam.id}-${day}-extra-${Date.now()}`,
              type: "exam_revision",
              examId: exam.id,
              title: `${exam.subject} Revision`,
              subject: exam.subject,
              date: currentDay,
              duration: timeToAssign,
              status: "planned",
            });
          }

          sessionTimeUsed[currentDay] += timeToAssign;
          remainingMinutes -= timeToAssign;
        }
        if (remainingMinutes <= 0) break;
      }
    }

    return sessions;
  }

  /**
   * Reschedule missed sessions within next 3 days
   * Follows the greedy redistribution flowchart (split across 3 days if needed)
   */
  rescheduleMissedSession(missedSession, currentDate, existingSessions) {
    let remainingMinutes = missedSession.duration;
    const newSessions = [];
    const sessionTimeUsed = this.calculateSessionTimeUsed(existingSessions);

    for (let day = 1; day <= 3; day++) {
      const targetDate = format(addDays(currentDate, day), "yyyy-MM-dd");
      const freeMinutes =
        this.studySessionLimitMinutes - (sessionTimeUsed[targetDate] || 0);

      if (freeMinutes > 0) {
        const timeToAssign = Math.min(remainingMinutes, freeMinutes);

        sessionTimeUsed[targetDate] =
          (sessionTimeUsed[targetDate] || 0) + timeToAssign;
        remainingMinutes -= timeToAssign;

        newSessions.push({
          ...missedSession,
          id: `${missedSession.id}-rescheduled-${day}-${Date.now()}`,
          date: targetDate,
          duration: timeToAssign,
          status: "rescheduled",
        });
      }

      if (remainingMinutes <= 0) break;
    }

    if (remainingMinutes > 0) {
      console.warn(
        `Could not fully reschedule session: ${missedSession.title}. Remaining: ${remainingMinutes}m`
      );
    }

    return newSessions;
  }

  /**
   * Calculate time used per day from existing schedule
   */
  calculateSessionTimeUsed(sessions) {
    const timeUsed = {};
    sessions.forEach((session) => {
      if (!timeUsed[session.date]) {
        timeUsed[session.date] = 0;
      }
      timeUsed[session.date] += session.duration;
    });
    return timeUsed;
  }

  /**
   * Format schedule into daily structure
   */
  formatSchedule(sessions, weekStart) {
    const schedule = {};

    for (let i = 0; i < 7; i++) {
      const date = format(addDays(weekStart, i), "yyyy-MM-dd");
      schedule[date] = {
        date,
        sessions: sessions.filter((s) => s.date === date),
        totalMinutes: sessions
          .filter((s) => s.date === date)
          .reduce((sum, s) => sum + s.duration, 0),
      };
    }

    return schedule;
  }

  /**
   * Validate schedule meets success criteria and track unscheduled items
   */
  validateSchedule(schedule) {
    const allSessions = Object.values(schedule).flatMap((day) => day.sessions);
    const unscheduledItems = [];

    // Check homework tasks
    this.tasks.forEach((task) => {
      const scheduledMinutes = allSessions
        .filter((s) => s.taskId === task.id)
        .reduce((sum, s) => sum + s.duration, 0);

      if (scheduledMinutes < task.estimatedTime) {
        unscheduledItems.push({
          id: task.id,
          name: task.name,
          type: "homework",
          missingMinutes: task.estimatedTime - scheduledMinutes,
        });
      }
    });

    // Check exam revision
    this.exams.forEach((exam) => {
      const scheduledMinutes = allSessions
        .filter((s) => s.examId === exam.id)
        .reduce((sum, s) => sum + s.duration, 0);

      const totalNeeded = exam.estimatedTime || 240;
      if (scheduledMinutes < totalNeeded) {
        unscheduledItems.push({
          id: exam.id,
          name: exam.subject,
          type: "exam_revision",
          missingMinutes: totalNeeded - scheduledMinutes,
        });
      }
    });

    const validations = {
      allTasksScheduled: unscheduledItems.length === 0,
      noDeadlineViolations: this.tasks.every((task) => {
        const taskSessions = allSessions.filter((s) => s.taskId === task.id);
        if (taskSessions.length === 0) return false;

        return taskSessions.every((session) => {
          return (
            isBefore(new Date(session.date), new Date(task.deadline)) ||
            format(new Date(session.date), "yyyy-MM-dd") ===
              format(new Date(task.deadline), "yyyy-MM-dd")
          );
        });
      }),
      examDistribution: this.exams.every((exam) => {
        const examSessions = allSessions.filter((s) => s.examId === exam.id);
        return examSessions.length >= 3;
      }),
      studySessionLimitRespected: Object.values(schedule).every(
        (day) => day.totalMinutes <= this.studySessionLimitMinutes
      ),
    };

    return {
      isValid: Object.values(validations).every((v) => v),
      details: validations,
      unscheduledItems,
    };
  }
}

/**
 * Helper: Calculate schedule performance metrics
 */
export function calculateScheduleMetrics(schedule) {
  const allSessions = Object.values(schedule).flatMap((day) => day.sessions);

  return {
    totalSessions: allSessions.length,
    totalMinutes: allSessions.reduce((sum, s) => sum + s.duration, 0),
    homeworkSessions: allSessions.filter((s) => s.type === "homework").length,
    examSessions: allSessions.filter((s) => s.type === "exam_revision").length,
    averageSessionLoad: allSessions.reduce((sum, s) => sum + s.duration, 0) / 7,
  };
}
