import { useState } from "react";
import TaskItem from "./TaskItem";
import { Filter, Search } from "lucide-react";

export default function TaskList({ tasks, onEdit, onDelete, onComplete }) {
  const [filter, setFilter] = useState("all"); // all, pending, completed
  const [searchTerm, setSearchTerm] = useState("");

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Filter by status
    if (filter === "pending" && task.status !== "pending") return false;
    if (filter === "completed" && task.status !== "completed") return false;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        task.name.toLowerCase().includes(search) ||
        task.subject.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Sort by deadline (earliest first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    return new Date(a.deadline) - new Date(b.deadline);
  });

  return (
    <div className="bg-white rounded-xl shadow-xs p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Tasks</h2>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm sm:text-base"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {sortedTasks.length} of {tasks.length} tasks
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm || filter !== "all"
              ? "No tasks found matching your filters"
              : 'No tasks yet. Click "Add Task" to get started!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
