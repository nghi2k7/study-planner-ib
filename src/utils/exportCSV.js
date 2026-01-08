import { format } from "date-fns";

/**
 * CSV Export Utilities
 * Allows users to export their schedule as CSV file
 */

/**
 * Helper to safely format dates from various formats (Firebase Timestamp, Date object, string)
 */
function safelyFormatDate(dateValue, formatStr = "yyyy-MM-dd HH:mm") {
  if (!dateValue) return "N/A";

  try {
    let date;
    // Firebase Timestamp
    if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      date = new Date(dateValue.seconds * 1000);
    } 
    // Firestore serverTimestamp placeholder or other objects
    else if (typeof dateValue === 'object' && dateValue !== null && !(dateValue instanceof Date)) {
      // If it's a serverTimestamp placeholder, it's being created right now
      return format(new Date(), formatStr);
    }
    // Date object or string/number
    else {
      date = new Date(dateValue);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return format(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error, dateValue);
    return "Error";
  }
}

/**
 * Convert schedule data to CSV format
 */
export function scheduleToCSV(schedule, tasks, exams) {
  const rows = [];

  // Header row
  rows.push([
    "Date",
    "Day",
    "Session Type",
    "Title",
    "Subject",
    "Duration (minutes)",
    "Status",
  ]);

  // Sort dates
  const sortedDates = Object.keys(schedule).sort();

  // Add data rows
  sortedDates.forEach((date) => {
    const dayData = schedule[date];
    const dayName = safelyFormatDate(date, "EEEE");

    dayData.sessions.forEach((session) => {
      rows.push([
        date,
        dayName,
        session.type === "homework" ? "Homework" : "Exam Revision",
        session.title,
        session.subject,
        session.duration,
        session.status || "planned",
      ]);
    });
  });

  return rows;
}

/**
 * Convert tasks to CSV format
 */
export function tasksToCSV(tasks) {
  const rows = [];

  rows.push([
    "Task ID",
    "Name",
    "Subject",
    "Deadline",
    "Duration (minutes)",
    "Status",
    "Created At",
  ]);

  tasks.forEach((task) => {
    rows.push([
      task.id,
      task.name,
      task.subject,
      task.deadline,
      task.estimatedTime,
      task.status,
      safelyFormatDate(task.createdAt),
    ]);
  });

  return rows;
}

/**
 * Convert exams to CSV format
 */
export function examsToCSV(exams) {
  const rows = [];

  rows.push([
    "Exam ID",
    "Subject",
    "Date",
    "Total Revision Time (minutes)",
    "Notes",
    "Created At",
  ]);

  exams.forEach((exam) => {
    rows.push([
      exam.id,
      exam.subject,
      exam.date,
      exam.estimatedTime || 240,
      exam.notes || "",
      safelyFormatDate(exam.createdAt),
    ]);
  });

  return rows;
}

/**
 * Convert 2D array to CSV string
 */
function arrayToCSV(data) {
  return data
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const cellStr = String(cell);
          if (
            cellStr.includes(",") ||
            cellStr.includes('"') ||
            cellStr.includes("\n")
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    )
    .join("\n");
}

/**
 * Trigger CSV download
 */
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export schedule as CSV
 */
export function exportScheduleCSV(schedule, tasks, exams) {
  const rows = scheduleToCSV(schedule, tasks, exams);
  const csvContent = arrayToCSV(rows);
  const filename = `study-schedule-${format(new Date(), "yyyy-MM-dd")}.csv`;
  downloadCSV(csvContent, filename);
}

/**
 * Export tasks as CSV
 */
export function exportTasksCSV(tasks) {
  const rows = tasksToCSV(tasks);
  const csvContent = arrayToCSV(rows);
  const filename = `tasks-${format(new Date(), "yyyy-MM-dd")}.csv`;
  downloadCSV(csvContent, filename);
}

/**
 * Export exams as CSV
 */
export function exportExamsCSV(exams) {
  const rows = examsToCSV(exams);
  const csvContent = arrayToCSV(rows);
  const filename = `exams-${format(new Date(), "yyyy-MM-dd")}.csv`;
  downloadCSV(csvContent, filename);
}

/**
 * Export complete study plan (schedule + tasks + exams)
 */
export function exportCompleteStudyPlan(schedule, tasks, exams) {
  const scheduleRows = scheduleToCSV(schedule, tasks, exams);
  const taskRows = tasksToCSV(tasks);
  const examRows = examsToCSV(exams);

  // Combine all sections
  const allRows = [
    ["WEEKLY SCHEDULE"],
    [""],
    ...scheduleRows,
    [""],
    [""],
    ["TASKS"],
    [""],
    ...taskRows,
    [""],
    [""],
    ["EXAMS"],
    [""],
    ...examRows,
  ];

  const csvContent = arrayToCSV(allRows);
  const filename = `complete-study-plan-${format(
    new Date(),
    "yyyy-MM-dd"
  )}.csv`;
  downloadCSV(csvContent, filename);
}

export default {
  scheduleToCSV,
  tasksToCSV,
  examsToCSV,
  exportScheduleCSV,
  exportTasksCSV,
  exportExamsCSV,
  exportCompleteStudyPlan,
};
