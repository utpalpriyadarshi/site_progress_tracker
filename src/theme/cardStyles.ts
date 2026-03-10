import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

/**
 * CARD_STYLES — shared card style constants.
 *
 * Usage:
 *   <Card mode="elevated" style={CARD_STYLES.card}>
 *   <Card mode="elevated" style={[CARD_STYLES.card, CARD_STYLES.cardSpacing]}>
 */
export const CARD_STYLES = StyleSheet.create({
  /** Standard list/content card */
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
  },
  /** Vertical spacing between cards in a list */
  cardSpacing: {
    marginBottom: 12,
  },
  /** Card with horizontal padding for edge-to-edge lists */
  cardHorizontal: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  /** Compact card (less padding) */
  cardCompact: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    marginBottom: 8,
  },
});

/** Default Paper Card mode for the app — use on every <Card> */
export const CARD_MODE = 'elevated' as const;
