/**
 * AppMode Configuration
 *
 * Manages application mode switching between Demo and Production modes
 *
 * **Demo Mode**: For testing and demonstrations
 * - Shows empty state with "Load Sample BOMs" button
 * - Allows manual loading of mock Metro Railway data
 * - No auto-loading of BOMs
 * - Useful for: Testing, demos, training, screenshots
 *
 * **Production Mode**: For real project usage
 * - Auto-loads BOMs created by Project Manager
 * - No mock data loading
 * - Seamless data flow from PM → Logistics
 * - Useful for: Real projects like AEP 01
 */

export type AppModeType = 'demo' | 'production';

class AppModeConfig {
  private currentMode: AppModeType;

  constructor() {
    // Initialize mode based on environment and stored preference
    this.currentMode = this.detectInitialMode();
  }

  /**
   * Detect initial mode based on:
   * 1. Stored user preference (AsyncStorage)
   * 2. Development environment (__DEV__)
   * 3. Default to production
   */
  private detectInitialMode(): AppModeType {
    // Check if running in development
    if (__DEV__) {
      // In development, check localStorage/AsyncStorage for saved preference
      const savedMode = this.getSavedMode();
      return savedMode || 'demo'; // Default to demo in dev mode
    }

    // Production builds always use production mode
    return 'production';
  }

  /**
   * Get saved mode from storage (stub for now)
   */
  private getSavedMode(): AppModeType | null {
    try {
      // TODO: Implement AsyncStorage read when available
      // const saved = await AsyncStorage.getItem('app_mode');
      // return saved as AppModeType;
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current app mode
   */
  getMode(): AppModeType {
    return this.currentMode;
  }

  /**
   * Set app mode
   */
  setMode(mode: AppModeType): void {
    this.currentMode = mode;
    this.saveMode(mode);
    console.log(`[AppMode] Switched to ${mode.toUpperCase()} mode`);
  }

  /**
   * Save mode preference to storage (stub for now)
   */
  private saveMode(mode: AppModeType): void {
    try {
      // TODO: Implement AsyncStorage write when available
      // await AsyncStorage.setItem('app_mode', mode);
      console.log(`[AppMode] Saved mode preference: ${mode}`);
    } catch (error) {
      console.error('[AppMode] Failed to save mode:', error);
    }
  }

  /**
   * Check if currently in demo mode
   */
  isDemoMode(): boolean {
    return this.currentMode === 'demo';
  }

  /**
   * Check if currently in production mode
   */
  isProductionMode(): boolean {
    return this.currentMode === 'production';
  }

  /**
   * Toggle between modes (useful for settings screen)
   */
  toggleMode(): AppModeType {
    const newMode: AppModeType = this.currentMode === 'demo' ? 'production' : 'demo';
    this.setMode(newMode);
    return newMode;
  }

  /**
   * Get mode description for UI display
   */
  getModeDescription(): string {
    if (this.isDemoMode()) {
      return 'Demo Mode - Using sample data for testing';
    }
    return 'Production Mode - Using real project data';
  }

  /**
   * Get mode-specific behavior flags
   */
  getBehaviorFlags() {
    return {
      mode: this.currentMode,
      showLoadSampleButton: this.isDemoMode(),
      autoLoadBOMs: this.isProductionMode(),
      allowMockData: this.isDemoMode(),
      showModeIndicator: __DEV__, // Only show mode indicator in development
    };
  }
}

// Export singleton instance
export const AppMode = new AppModeConfig();

// Export helper functions
export const isDemoMode = () => AppMode.isDemoMode();
export const isProductionMode = () => AppMode.isProductionMode();
export const setAppMode = (mode: AppModeType) => AppMode.setMode(mode);
export const toggleAppMode = () => AppMode.toggleMode();
export const getAppMode = () => AppMode.getMode();
