import { StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

/**
 * Shared StyleSheet constants for screen layout and card structure.
 *
 * Usage:
 *   import { commonStyles } from '../../styles/common';
 *   <View style={commonStyles.screen}>
 *     <ScrollView contentContainerStyle={commonStyles.content}>
 *       <Text style={commonStyles.sectionTitle}>Section</Text>
 *     </ScrollView>
 *   </View>
 */
export const commonStyles = StyleSheet.create({
  // ─── Screen layout ────────────────────────────────────────────────────
  /** Root screen container: fills available space with the app background colour. */
  screen: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  /** ScrollView/FlatList contentContainerStyle: 16px padding on all sides. */
  content: {
    padding: 16,
  },
  /** Section heading inside a screen (e.g. above a group of cards). */
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    marginTop: 16,
  },

  // ─── Card primitives ──────────────────────────────────────────────────
  /** Base card container: standard elevation, margin, and border radius. */
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  /** Card header row: title on the left, status/actions on the right. */
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  /** Primary title text inside a card. */
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },

  // ─── Detail rows (label / value pairs) ───────────────────────────────
  /** Horizontal row containing a label and a value. */
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  /** Left-aligned label in a detail row. */
  detailLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
    flex: 1,
  },
  /** Right-aligned value in a detail row. */
  detailValue: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    flex: 2,
  },

  // ─── Action row ───────────────────────────────────────────────────────
  /** Bottom row of buttons on a card or screen. */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
    flexWrap: 'wrap',
  },
});
