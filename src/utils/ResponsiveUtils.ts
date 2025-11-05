/**
 * Responsive Layout Utilities
 *
 * Provides responsive design utilities for mobile optimization,
 * breakpoints, and adaptive layouts.
 *
 * Week 9 - Performance & Polish
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

// ============================================================================
// Device Information
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Device breakpoints (in dp/pt)
 */
export const Breakpoints = {
  small: 0, // Small phones
  medium: 375, // iPhone 8, SE
  large: 414, // iPhone Plus, Pixel
  tablet: 768, // iPad, tablets
  desktop: 1024, // Desktop, large tablets
} as const;

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): keyof typeof Breakpoints {
  if (SCREEN_WIDTH >= Breakpoints.desktop) return 'desktop';
  if (SCREEN_WIDTH >= Breakpoints.tablet) return 'tablet';
  if (SCREEN_WIDTH >= Breakpoints.large) return 'large';
  if (SCREEN_WIDTH >= Breakpoints.medium) return 'medium';
  return 'small';
}

/**
 * Check if device is tablet
 */
export function isTablet(): boolean {
  return SCREEN_WIDTH >= Breakpoints.tablet;
}

/**
 * Check if device is small phone
 */
export function isSmallPhone(): boolean {
  return SCREEN_WIDTH < Breakpoints.medium;
}

/**
 * Get device type
 */
export function getDeviceType(): 'phone' | 'tablet' | 'desktop' {
  if (SCREEN_WIDTH >= Breakpoints.desktop) return 'desktop';
  if (SCREEN_WIDTH >= Breakpoints.tablet) return 'tablet';
  return 'phone';
}

// ============================================================================
// Responsive Scaling
// ============================================================================

/**
 * Base width for scaling (iPhone 11 Pro)
 */
const BASE_WIDTH = 375;

/**
 * Scale size based on screen width
 */
export function scale(size: number): number {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

/**
 * Vertical scale based on screen height
 */
export function verticalScale(size: number): number {
  const BASE_HEIGHT = 812; // iPhone 11 Pro
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

/**
 * Moderate scale with factor
 */
export function moderateScale(size: number, factor: number = 0.5): number {
  return size + (scale(size) - size) * factor;
}

/**
 * Normalize font size for different screen densities
 */
export function normalizeFontSize(size: number): number {
  const scaledSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
}

// ============================================================================
// Responsive Values
// ============================================================================

/**
 * Get value based on breakpoint
 */
export function responsive<T>(values: {
  small?: T;
  medium?: T;
  large?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const breakpoint = getCurrentBreakpoint();

  return values[breakpoint] ?? values.default;
}

/**
 * Get spacing based on device size
 */
export function getSpacing(base: number = 16): {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
} {
  const multiplier = isTablet() ? 1.5 : 1;

  return {
    xs: Math.round(base * 0.25 * multiplier),
    sm: Math.round(base * 0.5 * multiplier),
    md: Math.round(base * multiplier),
    lg: Math.round(base * 1.5 * multiplier),
    xl: Math.round(base * 2 * multiplier),
  };
}

// ============================================================================
// Grid System
// ============================================================================

/**
 * Calculate column width for grid layout
 */
export function getColumnWidth(columns: number, gutter: number = 16): number {
  const totalGutter = gutter * (columns - 1);
  return (SCREEN_WIDTH - totalGutter) / columns;
}

/**
 * Get number of columns based on screen size
 */
export function getOptimalColumns(minItemWidth: number = 150): number {
  return Math.max(1, Math.floor(SCREEN_WIDTH / minItemWidth));
}

/**
 * Grid layout helper
 */
export function getGridLayout(
  itemCount: number,
  minColumns: number = 1,
  maxColumns: number = 4,
  gutter: number = 16
): {
  columns: number;
  itemWidth: number;
  itemsPerRow: number[];
} {
  const deviceColumns = responsive({
    small: minColumns,
    medium: Math.min(2, maxColumns),
    large: Math.min(3, maxColumns),
    tablet: Math.min(3, maxColumns),
    desktop: maxColumns,
    default: minColumns,
  });

  const columns = Math.min(deviceColumns, itemCount);
  const itemWidth = getColumnWidth(columns, gutter);

  // Calculate items per row
  const rows = Math.ceil(itemCount / columns);
  const itemsPerRow: number[] = [];

  for (let i = 0; i < rows; i++) {
    const itemsInRow = Math.min(columns, itemCount - i * columns);
    itemsPerRow.push(itemsInRow);
  }

  return { columns, itemWidth, itemsPerRow };
}

// ============================================================================
// Touch Target Sizing
// ============================================================================

/**
 * Minimum touch target size (44pt iOS, 48dp Android)
 */
export const MIN_TOUCH_TARGET = Platform.select({
  ios: 44,
  android: 48,
  default: 44,
});

/**
 * Ensure minimum touch target size
 */
export function getTouchTargetSize(size: number): number {
  return Math.max(size, MIN_TOUCH_TARGET);
}

// ============================================================================
// Typography Scaling
// ============================================================================

/**
 * Responsive font sizes
 */
export function getFontSizes(): {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
} {
  const baseSize = responsive({
    small: 14,
    medium: 16,
    large: 16,
    tablet: 18,
    desktop: 18,
    default: 16,
  });

  return {
    xs: normalizeFontSize(baseSize * 0.75),
    sm: normalizeFontSize(baseSize * 0.875),
    base: normalizeFontSize(baseSize),
    lg: normalizeFontSize(baseSize * 1.125),
    xl: normalizeFontSize(baseSize * 1.25),
    xxl: normalizeFontSize(baseSize * 1.5),
    xxxl: normalizeFontSize(baseSize * 2),
  };
}

/**
 * Line height multiplier
 */
export function getLineHeight(fontSize: number, multiplier: number = 1.5): number {
  return Math.round(fontSize * multiplier);
}

// ============================================================================
// Safe Area Helpers
// ============================================================================

/**
 * Get safe area padding for iOS notch
 */
export function getSafeAreaPadding(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  // Simplified version - in production would use react-native-safe-area-context
  const hasNotch = Platform.OS === 'ios' && SCREEN_HEIGHT >= 812;

  return {
    top: hasNotch ? 44 : 20,
    bottom: hasNotch ? 34 : 0,
    left: 0,
    right: 0,
  };
}

// ============================================================================
// Orientation Helpers
// ============================================================================

/**
 * Check if device is in landscape mode
 */
export function isLandscape(): boolean {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
}

/**
 * Check if device is in portrait mode
 */
export function isPortrait(): boolean {
  return SCREEN_HEIGHT > SCREEN_WIDTH;
}

/**
 * Get orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  return isLandscape() ? 'landscape' : 'portrait';
}

// ============================================================================
// Platform Helpers
// ============================================================================

/**
 * Get platform-specific value
 */
export function platformSelect<T>(values: {
  ios?: T;
  android?: T;
  web?: T;
  default: T;
}): T {
  return Platform.select({
    ios: values.ios ?? values.default,
    android: values.android ?? values.default,
    web: values.web ?? values.default,
    default: values.default,
  }) as T;
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

/**
 * Check if running on web
 */
export function isWeb(): boolean {
  return Platform.OS === 'web';
}

// ============================================================================
// Adaptive Card Sizing
// ============================================================================

/**
 * Get card dimensions based on screen size
 */
export function getCardDimensions(): {
  padding: number;
  borderRadius: number;
  shadowRadius: number;
  elevation: number;
} {
  return responsive({
    small: {
      padding: 12,
      borderRadius: 8,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      padding: 16,
      borderRadius: 8,
      shadowRadius: 4,
      elevation: 3,
    },
    large: {
      padding: 16,
      borderRadius: 12,
      shadowRadius: 4,
      elevation: 3,
    },
    tablet: {
      padding: 20,
      borderRadius: 12,
      shadowRadius: 6,
      elevation: 4,
    },
    desktop: {
      padding: 24,
      borderRadius: 16,
      shadowRadius: 8,
      elevation: 5,
    },
    default: {
      padding: 16,
      borderRadius: 8,
      shadowRadius: 4,
      elevation: 3,
    },
  });
}

// ============================================================================
// Screen Dimensions
// ============================================================================

/**
 * Get screen dimensions
 */
export function getScreenDimensions(): {
  width: number;
  height: number;
  isSmall: boolean;
  isTablet: boolean;
  isLandscape: boolean;
} {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: isSmallPhone(),
    isTablet: isTablet(),
    isLandscape: isLandscape(),
  };
}

// ============================================================================
// Export Constants
// ============================================================================

export const SCREEN_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

export const DEVICE_INFO = {
  type: getDeviceType(),
  breakpoint: getCurrentBreakpoint(),
  isTablet: isTablet(),
  isSmallPhone: isSmallPhone(),
  isLandscape: isLandscape(),
  platform: Platform.OS,
};

// ============================================================================
// Export Default
// ============================================================================

export default {
  Breakpoints,
  getCurrentBreakpoint,
  isTablet,
  isSmallPhone,
  getDeviceType,
  scale,
  verticalScale,
  moderateScale,
  normalizeFontSize,
  responsive,
  getSpacing,
  getColumnWidth,
  getOptimalColumns,
  getGridLayout,
  MIN_TOUCH_TARGET,
  getTouchTargetSize,
  getFontSizes,
  getLineHeight,
  getSafeAreaPadding,
  isLandscape,
  isPortrait,
  getOrientation,
  platformSelect,
  isIOS,
  isAndroid,
  isWeb,
  getCardDimensions,
  getScreenDimensions,
  SCREEN_DIMENSIONS,
  DEVICE_INFO,
};
