import { isBefore, startOfDay, addDays } from "date-fns";

/**
 * Validation utilities for form inputs
 * Implements validation rules from CSIA requirements
 */

export const validation = {
  /**
   * Validate task data
   */
  validateTask(taskData) {
    const errors = {};
    const today = startOfDay(new Date());
    const deadline = new Date(taskData.deadline);

    // Task name validation
    if (!taskData.name || !taskData.name.trim()) {
      errors.name = "Task name is required";
    } else if (taskData.name.length > 100) {
      errors.name = "Task name must be less than 100 characters";
    }

    // Subject validation
    if (!taskData.subject) {
      errors.subject = "Subject is required";
    }

    // Deadline validation
    if (!taskData.deadline) {
      errors.deadline = "Deadline is required";
    } else if (isBefore(deadline, today)) {
      errors.deadline = "Deadline cannot be in the past";
    }

    // Duration validation
    if (!taskData.estimatedTime) {
      errors.estimatedTime = "Estimated time is required";
    } else {
      const time = parseInt(taskData.estimatedTime);
      if (isNaN(time)) {
        errors.estimatedTime = "Estimated time must be a number";
      } else if (time <= 0) {
        errors.estimatedTime = "Estimated time must be greater than 0";
      } else if (time > 480) {
        errors.estimatedTime =
          "Estimated time cannot exceed 8 hours (480 minutes)";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate exam data
   */
  validateExam(examData) {
    const errors = {};
    const tomorrow = addDays(startOfDay(new Date()), 1);
    const examDate = new Date(examData.date);

    // Subject validation
    if (!examData.subject) {
      errors.subject = "Subject is required";
    }

    // Date validation
    if (!examData.date) {
      errors.date = "Exam date is required";
    } else if (isBefore(examDate, tomorrow)) {
      errors.date = "Exam date must be tomorrow or later";
    }

    // Estimated time validation
    if (examData.estimatedTime) {
      const time = parseInt(examData.estimatedTime);
      if (isNaN(time)) {
        errors.estimatedTime = "Revision time must be a number";
      } else if (time <= 0) {
        errors.estimatedTime = "Revision time must be greater than 0";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate study session limit
   */
  validateStudySessionLimit(minutes) {
    if (!minutes || isNaN(minutes)) {
      return {
        isValid: false,
        error: "Study session limit must be a number",
      };
    }

    const time = parseInt(minutes);
    if (time < 60) {
      return {
        isValid: false,
        error: "Study session limit must be at least 60 minutes",
      };
    }

    if (time > 960) {
      return {
        isValid: false,
        error: "Study session limit cannot exceed 16 hours (960 minutes)",
      };
    }

    return { isValid: true };
  },

  /**
   * Sanitize text input
   */
  sanitizeText(text) {
    if (!text) return "";
    return text.trim().replace(/[<>]/g, "");
  },

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   */
  validatePassword(password) {
    const errors = [];

    if (!password) {
      return {
        isValid: false,
        errors: ["Password is required"],
      };
    }

    if (password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

export default validation;
