/**
 * TutorialService
 *
 * Manages tutorial state per user and role using AsyncStorage.
 * Tracks whether a tutorial has been shown, the current step,
 * and completion/dismissal status.
 *
 * Storage key format: @tutorial:{userId}:{role}
 *
 * @version 1.0.0
 * @since v2.13 - App Tutorial & Demo Data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialState {
  completed: boolean;
  currentStep: number;
  dismissedAt?: string;
  completedAt?: string;
}

const DEFAULT_STATE: TutorialState = {
  completed: false,
  currentStep: 0,
};

function getKey(userId: string, role: string): string {
  return `@tutorial:${userId}:${role}`;
}

class TutorialService {
  /**
   * Returns true if the tutorial should be shown:
   * - No stored state (first login), OR
   * - Not completed and not dismissed
   */
  static async shouldShowTutorial(userId: string, role: string): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(getKey(userId, role));
      if (!raw) return true;

      const state: TutorialState = JSON.parse(raw);
      return !state.completed && !state.dismissedAt;
    } catch {
      return true;
    }
  }

  /**
   * Returns the full tutorial state, or default if none exists.
   */
  static async getTutorialProgress(userId: string, role: string): Promise<TutorialState> {
    try {
      const raw = await AsyncStorage.getItem(getKey(userId, role));
      if (!raw) return { ...DEFAULT_STATE };
      return JSON.parse(raw);
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  /**
   * Saves the current step the user is on.
   */
  static async markStepCompleted(userId: string, role: string, step: number): Promise<void> {
    try {
      const state = await TutorialService.getTutorialProgress(userId, role);
      state.currentStep = step;
      await AsyncStorage.setItem(getKey(userId, role), JSON.stringify(state));
    } catch (error) {
      console.error('TutorialService.markStepCompleted failed:', error);
    }
  }

  /**
   * Marks the tutorial as fully completed.
   */
  static async markTutorialCompleted(userId: string, role: string): Promise<void> {
    try {
      const state = await TutorialService.getTutorialProgress(userId, role);
      state.completed = true;
      state.completedAt = new Date().toISOString();
      await AsyncStorage.setItem(getKey(userId, role), JSON.stringify(state));
    } catch (error) {
      console.error('TutorialService.markTutorialCompleted failed:', error);
    }
  }

  /**
   * Marks the tutorial as dismissed (user tapped "Skip").
   */
  static async dismissTutorial(userId: string, role: string, currentStep: number): Promise<void> {
    try {
      const state = await TutorialService.getTutorialProgress(userId, role);
      state.currentStep = currentStep;
      state.dismissedAt = new Date().toISOString();
      await AsyncStorage.setItem(getKey(userId, role), JSON.stringify(state));
    } catch (error) {
      console.error('TutorialService.dismissTutorial failed:', error);
    }
  }

  /**
   * Clears tutorial state so it shows again on next login.
   * Used by Admin "Reset Tutorial" and drawer menu "Tutorial" restart.
   */
  static async resetTutorial(userId: string, role: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(getKey(userId, role));
    } catch (error) {
      console.error('TutorialService.resetTutorial failed:', error);
    }
  }
}

export default TutorialService;
