import { useState } from "react";
import { CheckCircle, XCircle, Circle, Clock, BookOpen, Loader2 } from "lucide-react";
import { dateHelpers } from "../../utils/dateHelpers";

export default function SessionCard({
  session,
  onStatusChange,
  compact = false,
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusClick = async (newStatus) => {
    if (onStatusChange) {
      setIsUpdating(true);
      try {
        await onStatusChange(session.id, newStatus);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const getStatusIcon = () => {
    if (isUpdating) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    switch (session.status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "missed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "rescheduled":
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = () => {
    return session.type === "homework"
      ? "bg-blue-100 border-blue-300 text-blue-800"
      : "bg-green-100 border-green-300 text-green-800";
  };

  const getTypeIcon = () => {
    return session.type === "homework" ? (
      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
    ) : (
      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
    );
  };

  if (compact) {
    return (
      <div className={`p-2 rounded border ${getTypeColor()}`}>
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{session.title}</p>
            <p className="text-xs opacity-75">{session.duration}m</p>
          </div>
          {getStatusIcon()}
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 rounded-lg p-3 sm:p-4 transition-all ${getTypeColor()}`}>
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Type Icon */}
        <div className="p-1.5 sm:p-2 bg-white rounded-lg shrink-0">
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{session.title}</h4>
              <p className="text-xs sm:text-sm opacity-75 truncate">{session.subject}</p>
            </div>
            <div className="shrink-0 mt-1">
              {getStatusIcon()}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-sm opacity-75 mb-3">
            <span>{dateHelpers.minutesToHoursString(session.duration)}</span>
            <span className="hidden xs:inline">•</span>
            <span className="capitalize">
              {session.type === "homework" ? "Homework" : "Exam Revision"}
            </span>
          </div>

          {/* Action Buttons */}
          {session.status === "planned" && onStatusChange && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusClick("completed")}
                disabled={isUpdating}
                className="flex-1 py-1.5 px-2 sm:px-3 bg-white hover:bg-green-50 border border-green-300 text-green-700 rounded text-[11px] sm:text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Complete"}
              </button>
              <button
                onClick={() => handleStatusClick("missed")}
                disabled={isUpdating}
                className="flex-1 py-1.5 px-2 sm:px-3 bg-white hover:bg-red-50 border border-red-300 text-red-700 rounded text-[11px] sm:text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Missed"}
              </button>
            </div>
          )}

          {/* Status Badge for Completed/Missed */}
          {session.status !== "planned" && (
            <div className="pt-2 border-t border-current opacity-50">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">{session.status}</p>
            </div>
          )}
        </div>
      </div>

      {/* Rescheduled Notice */}
      {session.status === "rescheduled" && (
        <div className="mt-3 pt-2.5 border-t border-current opacity-50">
          <p className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Rescheduled from missed session
          </p>
        </div>
      )}
    </div>
  );
}
