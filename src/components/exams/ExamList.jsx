import { Edit2, Trash2, BookOpen, Calendar, Clock } from "lucide-react";
import { dateHelpers } from "../../utils/dateHelpers";

export default function ExamList({ exams, onEdit, onDelete }) {
  // Sort exams by date (earliest first)
  const sortedExams = [...exams].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  // Separate upcoming and past exams
  const upcomingExams = sortedExams.filter(
    (exam) => !dateHelpers.isPast(exam.date)
  );
  const pastExams = sortedExams.filter((exam) => dateHelpers.isPast(exam.date));

  const handleDelete = (exam) => {
    if (window.confirm(`Delete exam "${exam.subject}"?`)) {
      onDelete(exam.id);
    }
  };

  const ExamCard = ({ exam, isPast = false }) => {
    const daysUntil = dateHelpers.daysUntil(exam.date);

    return (
      <div
        className={`border-2 rounded-lg p-3 sm:p-4 transition-all ${
          isPast
            ? "bg-gray-50 border-gray-200 opacity-60"
            : "bg-white border-green-200 hover:border-green-300"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 w-full">
            {/* Icon */}
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isPast ? "bg-gray-200" : "bg-green-100"
              }`}
            >
              <BookOpen
                className={`w-5 h-5 ${
                  isPast ? "text-gray-500" : "text-green-600"
                }`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 w-full">
              <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">{exam.subject}</h3>

              <div className="space-y-1.5 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{dateHelpers.formatWithYear(exam.date)}</span>
                  {!isPast && (
                    <span className="text-blue-600 font-medium">
                      ({dateHelpers.getRelativeTime(exam.date)})
                    </span>
                  )}
                  {isPast && (
                    <span className="text-gray-500 font-medium">(Past)</span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    Total revision:{" "}
                    {dateHelpers.minutesToHoursString(
                      exam.estimatedTime || 240
                    )}
                  </span>
                </div>

                {exam.notes && (
                  <p className="text-gray-600 mt-2 text-[11px] sm:text-xs italic border-l-2 border-gray-200 pl-2">
                    "{exam.notes}"
                  </p>
                )}
              </div>

              {/* Days Until Badge */}
              {!isPast && daysUntil <= 7 && (
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                      daysUntil <= 3
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {daysUntil === 0
                      ? "Today!"
                      : daysUntil === 1
                      ? "Tomorrow!"
                      : `${daysUntil} days left`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 pt-2 sm:pt-0 mt-2 sm:mt-0">
            <button
              onClick={() => onEdit(exam)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              title="Edit exam"
            >
              <Edit2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleDelete(exam)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete exam"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xs p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">All Exams</h2>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Upcoming Exams ({upcomingExams.length})
          </h3>
          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      )}

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Past Exams ({pastExams.length})
          </h3>
          <div className="space-y-3">
            {pastExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} isPast />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {exams.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-500 font-medium">No exams scheduled</p>
          <p className="text-sm text-gray-400 mt-1">
            Click "Add Exam" to schedule your first exam
          </p>
        </div>
      )}
    </div>
  );
}
