import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { CheckCircle, XCircle, Circle, Clock } from "lucide-react";

export default function WeeklyCalendar({
  schedule,
  selectedDate,
  onDateSelect,
  onSessionStatusChange,
}) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getStatusIcon = (status) => {
    switch (status) {
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

  const getSessionColor = (type) => {
    return type === "homework"
      ? "bg-blue-100 border-blue-300"
      : "bg-green-100 border-green-300";
  };

  return (
    <div className="bg-white rounded-xl shadow-xs p-4 sm:p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Schedule</h2>

      <div className="overflow-x-auto -mx-4 sm:mx-0 pb-4">
        <div className="grid grid-cols-7 gap-2 min-w-[800px] lg:min-w-0 px-4 sm:px-0">
          {weekDays.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const daySchedule = schedule[dateKey] || {
              sessions: [],
              totalMinutes: 0,
            };
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                onClick={() => onDateSelect(day)}
                className={`min-h-[200px] p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : isToday
                    ? "border-blue-300 bg-blue-25"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Day Header */}
                <div className="text-center mb-3">
                  <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={`text-base sm:text-lg font-bold ${
                      isToday ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    {daySchedule.totalMinutes}m
                  </div>
                </div>

                {/* Sessions */}
                <div className="space-y-1.5 sm:space-y-2">
                  {daySchedule.sessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className={`p-1.5 sm:p-2 rounded border ${getSessionColor(
                        session.type
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">
                            {session.title}
                          </p>
                          <p className="text-[9px] sm:text-xs text-gray-600">
                            {session.duration}m
                          </p>
                        </div>
                        <div className="shrink-0">
                          {getStatusIcon(session.status)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {daySchedule.sessions.length > 3 && (
                    <div className="text-[10px] sm:text-xs text-center text-gray-500 font-medium">
                      +{daySchedule.sessions.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span className="text-gray-600">Homework</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-600">Exam Revision</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
          <span className="text-gray-600">Rescheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
          <span className="text-gray-600">Missed</span>
        </div>
      </div>
    </div>
  );
}
