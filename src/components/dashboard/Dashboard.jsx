import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { taskService } from "../../services/taskService";
import { examService } from "../../services/examService";
import { scheduleService } from "../../services/scheduleService";
import { SchedulingEngine } from "../../utils/schedulingAlgorithm";
import WeeklyCalendar from "./WeeklyCalendar";
import DailyTaskList from "./DailyTaskList";
import TaskForm from "../tasks/TaskForm";
import ExamForm from "../exams/ExamForm";
import ScheduleGenerator from "../schedule/ScheduleGenerator";
import { exportCompleteStudyPlan } from "../../utils/exportCSV";
import toast from "react-hot-toast";
import {
  Calendar,
  Plus,
  BookOpen,
  Clock,
  RefreshCw,
  Download,
} from "lucide-react";
import { format, startOfWeek } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [dailyBudget, setDailyBudget] = useState(480); // 8 hours default
  const [unscheduledItems, setUnscheduledItems] = useState([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, examsData] = await Promise.all([
        taskService.getUserTasks(user.uid),
        examService.getUserExams(user.uid),
      ]);

      setTasks(tasksData);
      setExams(examsData);

      // Load existing schedule
      const weekStart = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
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

      // Re-run validation on loaded data to show unscheduled items if any
      const engine = new SchedulingEngine(tasksData, examsData, dailyBudget);
      const validation = engine.validateSchedule(scheduleObj);
      setUnscheduledItems(validation.unscheduledItems || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = async (budget = dailyBudget) => {
    try {
      setGenerating(true);
      const startTime = Date.now();

      // Filter pending tasks and upcoming exams
      const pendingTasks = tasks.filter((t) => t.status === "pending");
      const upcomingExams = exams.filter((e) => new Date(e.date) > new Date());

      if (pendingTasks.length === 0 && upcomingExams.length === 0) {
        toast.error("No tasks or exams to schedule");
        return;
      }

      // Run scheduling algorithm
      const engine = new SchedulingEngine(pendingTasks, upcomingExams, budget);
      const newSchedule = engine.generateWeeklySchedule();

      // Validate schedule
      const validation = engine.validateSchedule(newSchedule);
      setUnscheduledItems(validation.unscheduledItems || []);

      if (!validation.isValid) {
        console.warn("Schedule validation issues:", validation.details);
        if (validation.unscheduledItems.length > 0) {
          toast.error(
            "Some items could not be fully scheduled. Check the warnings."
          );
        }
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
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast.error("Failed to generate schedule");
    } finally {
      setGenerating(false);
    }
  };

  const handleTaskCreated = async (taskData) => {
    try {
      const newTask = await taskService.createTask(user.uid, taskData);
      setTasks([...tasks, newTask]);
      setShowTaskForm(false);
      toast.success("Task added successfully");
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleExamCreated = async (examData) => {
    try {
      const newExam = await examService.createExam(user.uid, examData);
      setExams([...exams, newExam]);
      setShowExamForm(false);
      toast.success("Exam added successfully");
    } catch (error) {
      toast.error("Failed to create exam");
    }
  };

  const handleSessionStatusChange = async (sessionId, status) => {
    try {
      await scheduleService.updateSessionStatus(sessionId, status);

      // Update local state for the original session
      const updatedSchedule = { ...schedule };
      let missedSession = null;

      Object.keys(updatedSchedule).forEach((date) => {
        updatedSchedule[date].sessions = updatedSchedule[date].sessions.map(
          (s) => {
            if (s.id === sessionId) {
              const updated = { ...s, status };
              if (status === "missed") missedSession = updated;
              return updated;
            }
            return s;
          }
        );
      });

      setSchedule(updatedSchedule);
      toast.success(`Session marked as ${status}`);

      // If missed, trigger greedy rescheduling as per flowchart
      if (status === "missed" && missedSession) {
        const engine = new SchedulingEngine([], [], dailyBudget);
        const allSessions = Object.values(updatedSchedule).flatMap(
          (d) => d.sessions
        );

        const rescheduledSessions = engine.rescheduleMissedSession(
          missedSession,
          new Date(missedSession.date),
          allSessions
        );

        if (rescheduledSessions.length > 0) {
          const weekStart = format(
            startOfWeek(new Date(), { weekStartsOn: 1 }),
            "yyyy-MM-dd"
          );

          await scheduleService.addSessions(
            user.uid,
            rescheduledSessions,
            weekStart
          );
          toast.success(
            `Rescheduled across ${rescheduledSessions.length} day(s)`
          );

          // Reload all data to refresh the calendar view
          await loadData();
        } else {
          toast.error(
            "No free time available in the next 3 days to reschedule"
          );
        }
      }
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session");
    }
  };

  const handleExportCSV = () => {
    try {
      exportCompleteStudyPlan(schedule, tasks, exams);
      toast.success("Study plan exported as CSV");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export study plan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Study Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                title="Export complete study plan to CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden xs:inline">Export CSV</span>
              </button>
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
              <button
                onClick={() => setShowExamForm(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <BookOpen className="w-4 h-4" />
                <span>Add Exam</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Unscheduled Warnings */}
        {unscheduledItems.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Unscheduled Items Warning
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    The following items could not be fully scheduled within your
                    daily budget:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {unscheduledItems.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{item.name}</span>:{" "}
                        {item.missingMinutes}m remaining
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-medium">
                    Try increasing your daily budget or extending deadlines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter((t) => t.status === "pending").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming Exams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {exams.filter((e) => new Date(e.date) > new Date()).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Daily Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dailyBudget / 60}h
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Calendar */}
          <div className="lg:col-span-2">
            <WeeklyCalendar
              schedule={schedule}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onSessionStatusChange={handleSessionStatusChange}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ScheduleGenerator
              tasks={tasks}
              exams={exams}
              onGenerate={generateSchedule}
              dailyBudget={dailyBudget}
              onBudgetChange={setDailyBudget}
              loading={generating}
            />

            <DailyTaskList
              schedule={schedule}
              selectedDate={selectedDate}
              onSessionStatusChange={handleSessionStatusChange}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTaskForm && (
        <TaskForm
          onSubmit={handleTaskCreated}
          onClose={() => setShowTaskForm(false)}
        />
      )}

      {showExamForm && (
        <ExamForm
          onSubmit={handleExamCreated}
          onClose={() => setShowExamForm(false)}
        />
      )}
    </div>
  );
}
