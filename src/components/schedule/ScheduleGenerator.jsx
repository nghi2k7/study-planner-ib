import { useState } from "react";
import { RefreshCw, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { dateHelpers } from "../../utils/dateHelpers";

export default function ScheduleGenerator({
  tasks,
  exams,
  onGenerate,
  dailyBudget,
  onBudgetChange,
  loading = false,
}) {
  const [showSettings, setShowSettings] = useState(false);

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const upcomingExams = exams.filter((e) => !dateHelpers.isPast(e.date));

  const handleGenerate = () => {
    onGenerate(dailyBudget);
  };

  const handleBudgetInputChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      onBudgetChange(value);
    }
  };

  const getTotalWorkload = () => {
    const taskTime = pendingTasks.reduce((sum, t) => sum + t.estimatedTime, 0);
    const examTime = upcomingExams.reduce(
      (sum, e) => sum + (e.estimatedTime || 240),
      0
    );
    return taskTime + examTime;
  };

  const getEstimatedDays = () => {
    const totalMinutes = getTotalWorkload();
    return Math.ceil(totalMinutes / dailyBudget);
  };

  const canGenerate = pendingTasks.length > 0 || upcomingExams.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-xs p-4 sm:p-6 border-2 border-blue-100">
      <div className="flex items-start justify-between mb-4">
        <div className="pr-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
            Schedule Generator
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Generate an optimized weekly study schedule
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Daily Study Budget (minutes)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="range"
              min="60"
              max="960"
              step="30"
              value={dailyBudget}
              onChange={handleBudgetInputChange}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dailyBudget}
                onChange={handleBudgetInputChange}
                min="60"
                max="960"
                className="w-full sm:w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="sm:hidden text-xs text-gray-500 min-w-max">
                mins
              </span>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-600 mt-1.5">
            {dateHelpers.minutesToHoursString(dailyBudget)} per day
          </p>
        </div>
      )}

      {/* Estimate */}
      {canGenerate && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-indigo-900 font-medium">
              Estimated: {getEstimatedDays()} days needed
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 mt-1 text-[10px] sm:text-xs text-indigo-700">
            <p>
              Total workload:{" "}
              <span className="font-semibold">
                {dateHelpers.minutesToHoursString(getTotalWorkload())}
              </span>
            </p>
            <p>
              Sessions:{" "}
              <span className="font-semibold">
                {pendingTasks.length + upcomingExams.length}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Warnings */}
      {!canGenerate && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
            <span className="font-medium">No tasks or exams to schedule</span>
          </div>
          <p className="text-[10px] sm:text-xs text-yellow-700 mt-1">
            Add some tasks or exams first
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !canGenerate}
        className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
          canGenerate && !loading
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <RefreshCw
          className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`}
        />
        <span>{loading ? "Generating..." : "Generate Schedule"}</span>
      </button>

      {/* Info */}
      <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-3">
        Schedules are generated based on deadlines and daily budget
      </p>
    </div>
  );
}
