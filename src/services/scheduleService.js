import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

const SESSIONS_COLLECTION = "sessions";
const SCHEDULE_LOGS_COLLECTION = "scheduleLogs";

/**
 * Schedule Service - Handles schedule and session storage
 */

export const scheduleService = {
  /**
   * Save generated schedule sessions
   */
  async saveSchedule(userId, sessions, weekStartDate) {
    try {
      const batch = writeBatch(db);

      // Delete existing sessions for this week
      await this.clearWeekSchedule(userId, weekStartDate);

      // Add new sessions
      const sessionRefs = [];
      sessions.forEach((session) => {
        // Use the session's own ID if it exists, otherwise generate one
        const sessionRef = session.id 
          ? doc(db, SESSIONS_COLLECTION, session.id)
          : doc(collection(db, SESSIONS_COLLECTION));
          
        batch.set(sessionRef, {
          userId,
          weekStart: weekStartDate,
          ...session,
          id: sessionRef.id, // Ensure the ID field matches the doc ID
          createdAt: serverTimestamp(),
        });
        sessionRefs.push(sessionRef.id);
      });

      await batch.commit();

      // Log schedule generation
      await this.logScheduleGeneration(userId, weekStartDate, sessions.length);

      return sessionRefs;
    } catch (error) {
      console.error("Error saving schedule:", error);
      throw error;
    }
  },

  /**
   * Add multiple sessions to existing schedule
   */
  async addSessions(userId, sessions, weekStartDate) {
    try {
      const batch = writeBatch(db);
      const sessionRefs = [];

      sessions.forEach((session) => {
        // Use the session's own ID if it exists, otherwise generate one
        const sessionRef = session.id 
          ? doc(db, SESSIONS_COLLECTION, session.id)
          : doc(collection(db, SESSIONS_COLLECTION));

        batch.set(sessionRef, {
          userId,
          weekStart: weekStartDate,
          ...session,
          id: sessionRef.id, // Ensure the ID field matches the doc ID
          createdAt: serverTimestamp(),
        });
        sessionRefs.push(sessionRef.id);
      });

      await batch.commit();
      return sessionRefs;
    } catch (error) {
      console.error("Error adding sessions:", error);
      throw error;
    }
  },

  /**
   * Get schedule for a specific week
   */
  async getWeekSchedule(userId, weekStartDate) {
    try {
      const q = query(
        collection(db, SESSIONS_COLLECTION),
        where("userId", "==", userId),
        where("weekStart", "==", weekStartDate)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching schedule:", error);
      throw error;
    }
  },

  /**
   * Clear all sessions for a specific week
   */
  async clearWeekSchedule(userId, weekStartDate) {
    try {
      const q = query(
        collection(db, SESSIONS_COLLECTION),
        where("userId", "==", userId),
        where("weekStart", "==", weekStartDate)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error clearing schedule:", error);
      throw error;
    }
  },

  /**
   * Update session status (complete/missed)
   */
  async updateSessionStatus(sessionId, status) {
    try {
      const currentUserId = auth.currentUser?.uid;
      console.log("Attempting status update:", { sessionId, status, currentUserId });
      
      const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        status,
        updatedAt: serverTimestamp(),
        ...(status === "completed" && { completedAt: serverTimestamp() }),
        ...(status === "missed" && { missedAt: serverTimestamp() }),
      });
      return { id: sessionId, status };
    } catch (error) {
      console.error("Error updating session status:", error);
      throw error;
    }
  },

  /**
   * Get all missed sessions
   */
  async getMissedSessions(userId) {
    try {
      const q = query(
        collection(db, SESSIONS_COLLECTION),
        where("userId", "==", userId),
        where("status", "==", "missed")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching missed sessions:", error);
      throw error;
    }
  },

  /**
   * Delete a single session
   */
  async deleteSession(sessionId) {
    try {
      const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
      await deleteDoc(sessionRef);
      return { id: sessionId, deleted: true };
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  },

  /**
   * Delete all sessions associated with a specific task
   */
  async deleteSessionsByTaskId(userId, taskId) {
    try {
      const q = query(
        collection(db, SESSIONS_COLLECTION),
        where("userId", "==", userId),
        where("taskId", "==", taskId)
      );
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting sessions by task ID:", error);
      throw error;
    }
  },

  /**
   * Delete all sessions associated with a specific exam
   */
  async deleteSessionsByExamId(userId, examId) {
    try {
      const q = query(
        collection(db, SESSIONS_COLLECTION),
        where("userId", "==", userId),
        where("examId", "==", examId)
      );
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting sessions by exam ID:", error);
      throw error;
    }
  },

  /**
   * Log schedule generation for analytics
   */
  async logScheduleGeneration(userId, weekStart, sessionCount) {
    try {
      await addDoc(collection(db, SCHEDULE_LOGS_COLLECTION), {
        userId,
        weekStart,
        sessionCount,
        generatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging schedule generation:", error);
      // Don't throw - logging is non-critical
    }
  },

  /**
   * Bulk update session statuses
   */
  async bulkUpdateSessions(updates) {
    try {
      const batch = writeBatch(db);

      updates.forEach(({ sessionId, ...data }) => {
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        batch.update(sessionRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      return updates;
    } catch (error) {
      console.error("Error bulk updating sessions:", error);
      throw error;
    }
  },
};

export default scheduleService;
