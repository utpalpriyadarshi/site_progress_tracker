/**
 * EmptyState Component
 *
 * Context-aware empty state with:
 * - Icon or illustration
 * - Title and description
 * - Actionable suggestions
 * - Primary action button
 * - Secondary action (optional)
 * - Accessibility support
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon="document"
 *   title="No invoices yet"
 *   description="Create your first invoice to get started"
 *   suggestions={['Add vendor details', 'Link to purchase order']}
 *   primaryAction={{
 *     label: 'Create Invoice',
 *     onPress: () => navigation.navigate('CreateInvoice'),
 *   }}
 * />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAccessibility } from '../../../utils/accessibility';

export type EmptyStateIconType =
  | 'document'
  | 'chart'
  | 'wallet'
  | 'search'
  | 'filter'
  | 'error'
  | 'budget'
  | 'cost'
  | 'invoice'
  | 'report';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
  testID?: string;
}

export interface EmptyStateProps {
  icon?: EmptyStateIconType;
  title: string;
  description: string;
  suggestions?: string[];
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
  testID?: string;
}

// Simple emoji-based icons for empty states
const EMPTY_STATE_ICONS: Record<EmptyStateIconType, string> = {
  document: '📄',
  chart: '📊',
  wallet: '💰',
  search: '🔍',
  filter: '🔽',
  error: '⚠️',
  budget: '📋',
  cost: '💵',
  invoice: '🧾',
  report: '📈',
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document',
  title,
  description,
  suggestions,
  primaryAction,
  secondaryAction,
  compact = false,
  testID,
}) => {
  const { announce } = useAccessibility();

  // Announce empty state when mounted
  React.useEffect(() => {
    const suggestionText = suggestions?.length
      ? ` Suggestions: ${suggestions.join(', ')}.`
      : '';
    announce(`${title}. ${description}${suggestionText}`);
  }, [title, description, suggestions, announce]);

  const iconEmoji = EMPTY_STATE_ICONS[icon] || EMPTY_STATE_ICONS.document;

  return (
    <View
      style={[styles.container, compact && styles.containerCompact]}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${description}`}
      testID={testID}
    >
      {/* Icon */}
      <View
        style={[styles.iconContainer, compact && styles.iconContainerCompact]}
        accessibilityElementsHidden
      >
        <Text style={[styles.icon, compact && styles.iconCompact]}>{iconEmoji}</Text>
      </View>

      {/* Title */}
      <Text
        style={[styles.title, compact && styles.titleCompact]}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Description */}
      <Text style={[styles.description, compact && styles.descriptionCompact]}>
        {description}
      </Text>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && !compact && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try these:</Text>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionBullet}>•</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {primaryAction && (
          <TouchableOpacity
            style={[styles.primaryButton, compact && styles.buttonCompact]}
            onPress={primaryAction.onPress}
            accessibilityRole="button"
            accessibilityLabel={primaryAction.label}
            accessibilityHint={`Tap to ${primaryAction.label.toLowerCase()}`}
            testID={primaryAction.testID}
          >
            <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
          </TouchableOpacity>
        )}

        {secondaryAction && !compact && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={secondaryAction.onPress}
            accessibilityRole="button"
            accessibilityLabel={secondaryAction.label}
            accessibilityHint={`Tap to ${secondaryAction.label.toLowerCase()}`}
            testID={secondaryAction.testID}
          >
            <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    margin: 16,
  },
  containerCompact: {
    padding: 16,
    margin: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f4fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconContainerCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 12,
  },
  icon: {
    fontSize: 36,
  },
  iconCompact: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 16,
  },
  descriptionCompact: {
    fontSize: 13,
    marginBottom: 12,
    maxWidth: 240,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  suggestionBullet: {
    fontSize: 13,
    color: '#1976D2',
    marginRight: 8,
    width: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  actionsContainer: {
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonCompact: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 120,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EmptyState;
