/**
 * paperTheme — Custom react-native-paper MD3 theme
 *
 * Wires the app's COLORS constants into Paper's theme system so that
 * ALL Paper components (Button, Chip, ProgressBar, Switch, FAB, etc.)
 * automatically use the correct brand colours without per-component
 * color props.
 *
 * Usage:
 *   import { appTheme } from './src/theme/paperTheme';
 *   <PaperProvider theme={appTheme}>
 */

import { MD3LightTheme } from 'react-native-paper';
import { COLORS } from './colors';

export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    // Brand
    primary:              COLORS.PRIMARY,
    primaryContainer:     COLORS.PRIMARY_LIGHT,
    onPrimary:            COLORS.SURFACE,
    onPrimaryContainer:   COLORS.PRIMARY_DARK,

    // Secondary (use INFO blue for secondary actions)
    secondary:            COLORS.INFO,
    secondaryContainer:   COLORS.INFO_BG,
    onSecondary:          COLORS.SURFACE,

    // Error
    error:                COLORS.ERROR,
    errorContainer:       COLORS.ERROR_BG,
    onError:              COLORS.SURFACE,
    onErrorContainer:     COLORS.ERROR,

    // Surface & background
    background:           COLORS.BACKGROUND,
    surface:              COLORS.SURFACE,
    surfaceVariant:       COLORS.PRIMARY_LIGHT,
    onBackground:         COLORS.TEXT_PRIMARY,
    onSurface:            COLORS.TEXT_PRIMARY,
    onSurfaceVariant:     COLORS.TEXT_SECONDARY,

    // Outline / dividers
    outline:              COLORS.BORDER,
    outlineVariant:       COLORS.DIVIDER,

    // Disabled
    surfaceDisabled:      COLORS.DIVIDER,
    onSurfaceDisabled:    COLORS.TEXT_DISABLED,
  },
};

export type AppTheme = typeof appTheme;
