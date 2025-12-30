import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";

export default function ExamForm({ onSubmit, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    estimatedTime: 240, // 4 hours default for revision
    notes: "",
  });

  const [errors, setErrors] = useState({});

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History",
    "Geography",
    "Computer Science",
    "Economics",
    "Other",
  ];

  const validate = () => {
    const newErrors = {};

    if (!formData.subject) {
      newErrors.subject = "Subject is required";
    }

    const examDate = new Date(formData.date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (examDate < tomorrow) {
      newErrors.date = "Exam date must be tomorrow or later";
    }

    if (formData.estimatedTime <= 0) {
      newErrors.estimatedTime = "Revision time must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      setLoading(true);
      try {
        await onSubmit(formData);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 my-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Exam</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.subject ? "border-red-300" : "border-gray-300"
              }`}
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.date ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Revision Time (minutes) *
            </label>
            <input
              type="number"
              name="estimatedTime"
              value={formData.estimatedTime}
              onChange={handleChange}
              min="30"
              step="30"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.estimatedTime ? "border-red-300" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Approximately {Math.floor(formData.estimatedTime / 60)}h{" "}
              {formData.estimatedTime % 60}m total
            </p>
            {errors.estimatedTime && (
              <p className="mt-1 text-sm text-red-600">
                {errors.estimatedTime}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Additional notes about this exam..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Adding..." : "Add Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
