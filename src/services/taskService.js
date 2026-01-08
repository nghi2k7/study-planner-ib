import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const TASKS_COLLECTION = "tasks";

/**
 * Task Service - Handles all task-related database operations
 */

export const taskService = {
  /**
   * Create a new task
   */
  async createTask(userId, taskData) {
    try {
      const now = new Date();
      const task = {
        userId,
        name: taskData.name,
        subject: taskData.subject,
        deadline: taskData.deadline,
        estimatedTime: parseInt(taskData.estimatedTime),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, TASKS_COLLECTION), task);
      // Return with local Date objects so UI can show them immediately
      return { ...task, id: docRef.id, createdAt: now, updatedAt: now };
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  /**
   * Get all tasks for a user
   */
  async getUserTasks(userId) {
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where("userId", "==", userId),
        orderBy("deadline", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  },

  /**
   * Get pending tasks only
   */
  async getPendingTasks(userId) {
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where("userId", "==", userId),
        where("status", "==", "pending"),
        orderBy("deadline", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching pending tasks:", error);
      throw error;
    }
  },

  /**
   * Update a task
   */
  async updateTask(taskId, updates) {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { id: taskId, ...updates };
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId) {
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
      return taskId;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  /**
   * Mark task as complete
   */
  async markTaskComplete(taskId) {
    return this.updateTask(taskId, {
      status: "completed",
      completedAt: serverTimestamp(),
    });
  },

  /**
   * Bulk update task statuses
   */
  async bulkUpdateTaskStatus(taskIds, status) {
    try {
      const promises = taskIds.map((id) => this.updateTask(id, { status }));
      await Promise.all(promises);
      return taskIds;
    } catch (error) {
      console.error("Error bulk updating tasks:", error);
      throw error;
    }
  },
};

export default taskService;
