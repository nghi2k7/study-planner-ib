import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, BookOpen, Loader2, Trash2 } from "lucide-react";

export default function DailyTaskList({
  schedule,
  selectedDate,
  onSessionStatusChange,
  onDeleteSession, // New prop
}) {
  const [updatingId, setUpdatingId] = useState(null);
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const daySchedule = schedule[dateKey] || { sessions: [], totalMinutes: 0 };

  const handleStatusUpdate = async (sessionId, status) => {
    setUpdatingId(sessionId);
    try {
      await onSessionStatusChange(sessionId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusClick = (sessionId, currentStatus) => {
    if (currentStatus === "planned") {
      // Show options: complete or missed
      const newStatus = window.confirm("Mark as completed? (Cancel for missed)")
        ? "completed"
        : "missed";
      handleStatusUpdate(sessionId, newStatus);
    }
  };

  const getTypeIcon = (type) => {
    return type === "homework" ? (
      <div className="p-2 bg-blue-100 rounded-lg">
        <BookOpen className="w-5 h-5 text-blue-600" />
      </div>
    ) : (
      <div className="p-2 bg-green-100 rounded-lg">
        <Clock className="w-5 h-5 text-green-600" />
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "missed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Missed
          </span>
        );
      case "rescheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <Clock className="w-3 h-3" />
            Rescheduled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Planned
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {format(selectedDate, "EEEE, MMMM d")}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {daySchedule.sessions.length} sessions · {daySchedule.totalMinutes}{" "}
          minutes
        </p>
      </div>

      {daySchedule.sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No sessions scheduled</p>
          <p className="text-sm text-gray-400 mt-1">
            Generate a schedule to see your tasks
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {daySchedule.sessions.map((session) => (
            <div
              key={session.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {getTypeIcon(session.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {session.title}
                      </h3>
                      <p className="text-sm text-gray-600">{session.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(session.status)}
                      {onDeleteSession && (
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                          title="Remove session from today"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{session.duration} minutes</span>
                    <span className="capitalize">
                      {session.type.replace("_", " ")}
                    </span>
                  </div>

                  {(session.status === "planned" || session.status === "rescheduled") && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() =>
                          handleStatusUpdate(session.id, "completed")
                        }
                        disabled={updatingId === session.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {updatingId === session.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Mark Complete"
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate(session.id, "missed")
                        }
                        disabled={updatingId === session.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {updatingId === session.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Mark Missed"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Summary */}
      {daySchedule.sessions.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="flex sm:flex-col items-center justify-between sm:justify-center">
              <p className="text-xs text-gray-600">Homework</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  daySchedule.sessions.filter((s) => s.type === "homework")
                    .length
                }
              </p>
            </div>
            <div className="flex sm:flex-col items-center justify-between sm:justify-center">
              <p className="text-xs text-gray-600">Revision</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  daySchedule.sessions.filter((s) => s.type === "exam_revision")
                    .length
                }
              </p>
            </div>
            <div className="flex sm:flex-col items-center justify-between sm:justify-center">
              <p className="text-xs text-gray-600">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(daySchedule.totalMinutes / 60)}h{" "}
                {daySchedule.totalMinutes % 60}m
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
