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

const EXAMS_COLLECTION = "exams";

/**
 * Exam Service - Handles all exam-related database operations
 */

export const examService = {
  /**
   * Create a new exam
   */
  async createExam(userId, examData) {
    try {
      const now = new Date();
      const exam = {
        userId,
        subject: examData.subject,
        date: examData.date,
        estimatedTime: parseInt(examData.estimatedTime) || 240, // Default 4 hours
        notes: examData.notes || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, EXAMS_COLLECTION), exam);
      // Return with local Date objects so UI can show them immediately
      return { ...exam, id: docRef.id, createdAt: now, updatedAt: now };
    } catch (error) {
      console.error("Error creating exam:", error);
      throw error;
    }
  },

  /**
   * Get all exams for a user
   */
  async getUserExams(userId) {
    try {
      const q = query(
        collection(db, EXAMS_COLLECTION),
        where("userId", "==", userId),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching exams:", error);
      throw error;
    }
  },

  /**
   * Get upcoming exams only
   */
  async getUpcomingExams(userId) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const q = query(
        collection(db, EXAMS_COLLECTION),
        where("userId", "==", userId),
        where("date", ">=", today),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching upcoming exams:", error);
      throw error;
    }
  },

  /**
   * Update an exam
   */
  async updateExam(examId, updates) {
    try {
      const examRef = doc(db, EXAMS_COLLECTION, examId);
      await updateDoc(examRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { id: examId, ...updates };
    } catch (error) {
      console.error("Error updating exam:", error);
      throw error;
    }
  },

  /**
   * Delete an exam
   */
  async deleteExam(examId) {
    try {
      await deleteDoc(doc(db, EXAMS_COLLECTION, examId));
      return examId;
    } catch (error) {
      console.error("Error deleting exam:", error);
      throw error;
    }
  },
};

export default examService;
