/**
 * StatusBadge Component Tests
 *
 * Visual and functional tests for StatusBadge component
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { StatusBadge } from './StatusBadge';
import { COLORS } from '../../theme/colors';

/**
 * StatusBadgeShowcase
 *
 * Visual test component showing all status badge variations
 * Use this for visual regression testing and manual verification
 *
 * To view: Import and render this component in any Planning screen
 */
export const StatusBadgeShowcase: React.FC = () => {
  const statuses = [
    'completed',
    'in_progress',
    'planned',
    'delayed',
    'critical',
    'on_hold',
    'not_started',
    'pending',
    'approved',
    'rejected',
    'overdue',
    'paused',
  ];

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        StatusBadge Showcase
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Visual verification of all status badge variants
      </Text>

      {/* Medium Size (Default) */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Medium Size (Default)
        </Text>
        <View style={styles.badgeGrid}>
          {statuses.map((status) => (
            <View key={status} style={styles.badgeRow}>
              <Text variant="bodySmall" style={styles.statusLabel}>
                {status}
              </Text>
              <StatusBadge status={status} />
            </View>
          ))}
        </View>
      </View>

      {/* Small Size */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Small Size
        </Text>
        <View style={styles.badgeGrid}>
          {statuses.map((status) => (
            <View key={status} style={styles.badgeRow}>
              <Text variant="bodySmall" style={styles.statusLabel}>
                {status}
              </Text>
              <StatusBadge status={status} size="small" />
            </View>
          ))}
        </View>
      </View>

      {/* Edge Cases */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Edge Cases
        </Text>
        <View style={styles.badgeGrid}>
          {/* Mixed case */}
          <View style={styles.badgeRow}>
            <Text variant="bodySmall" style={styles.statusLabel}>
              Mixed Case
            </Text>
            <StatusBadge status="In_ProGress" />
          </View>

          {/* With spaces */}
          <View style={styles.badgeRow}>
            <Text variant="bodySmall" style={styles.statusLabel}>
              Spaces
            </Text>
            <StatusBadge status="in progress" />
          </View>

          {/* Unknown status */}
          <View style={styles.badgeRow}>
            <Text variant="bodySmall" style={styles.statusLabel}>
              Unknown
            </Text>
            <StatusBadge status="unknown_status" />
          </View>

          {/* Empty string */}
          <View style={styles.badgeRow}>
            <Text variant="bodySmall" style={styles.statusLabel}>
              Empty
            </Text>
            <StatusBadge status="" />
          </View>
        </View>
      </View>

      {/* Accessibility Labels */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          With Custom Accessibility Labels
        </Text>
        <View style={styles.badgeGrid}>
          <View style={styles.badgeRow}>
            <Text variant="bodySmall" style={styles.statusLabel}>
              Custom A11y
            </Text>
            <StatusBadge
              status="delayed"
              accessibilityLabel="Item is 5 days behind schedule"
            />
          </View>
        </View>
      </View>

      {/* Color Contrast Verification */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Color Contrast Test (White text on all backgrounds)
        </Text>
        <Text variant="bodySmall" style={styles.warningText}>
          ⚠️ All badges should have clearly visible white text
        </Text>
        <View style={styles.badgeGrid}>
          {statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 24,
    color: '#666',
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeGrid: {
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusLabel: {
    flex: 1,
    color: '#666',
    fontFamily: 'monospace',
  },
  warningText: {
    color: COLORS.WARNING,
    marginBottom: 12,
    fontStyle: 'italic',
  },
});

/**
 * Unit Tests (for Jest/React Testing Library)
 */
describe('StatusBadge', () => {
  // Test cases for automated testing
  // Note: These are placeholder test structures

  it('should render with default props', () => {
    // Test: Render with status='completed'
    // Expect: Badge displays 'COMPLETED' with green background
  });

  it('should handle all standard status values', () => {
    // Test: Render with each status value
    // Expect: Correct color and label for each
  });

  it('should format status labels correctly', () => {
    // Test: status='in_progress'
    // Expect: Displays 'IN PROGRESS'
  });

  it('should handle case insensitivity', () => {
    // Test: status='COMPLETED', 'completed', 'CoMpLeTeD'
    // Expect: All display identically
  });

  it('should apply small size correctly', () => {
    // Test: size='small'
    // Expect: height=24, minWidth=60
  });

  it('should apply medium size by default', () => {
    // Test: No size prop
    // Expect: height=28, minWidth=80
  });

  it('should have correct text styling', () => {
    // Test: Check text style
    // Expect: color='white', fontSize=12, fontWeight='bold'
  });

  it('should generate accessibility label', () => {
    // Test: No accessibilityLabel prop
    // Expect: Auto-generated label like 'Status: COMPLETED'
  });

  it('should use custom accessibility label when provided', () => {
    // Test: accessibilityLabel='Custom label'
    // Expect: Uses provided label
  });

  it('should handle unknown status gracefully', () => {
    // Test: status='unknown_value'
    // Expect: Displays 'UNKNOWN VALUE' with fallback grey color (#757575)
  });
});

export default StatusBadgeShowcase;
