/**
 * Key Date Milestone Row Component for Gantt Chart
 *
 * Displays key dates as diamond milestones on the Gantt timeline.
 *
 * @version 1.0.0
 * @since Phase 5c - Key Dates Integration
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import KeyDateModel from '../../../../models/KeyDateModel';
import {
  ZoomLevel,
  TASK_HEIGHT,
  SCREEN_WIDTH,
  LEFT_COLUMN_WIDTH,
  COLUMN_WIDTHS,
} from '../utils/ganttConstants';
import {
  KEY_DATE_CATEGORY_COLORS,
  KEY_DATE_STATUS_COLORS,
} from '../../key-dates/utils/keyDateConstants';
import dayjs from 'dayjs';
import { COLORS } from '../../../theme/colors';

// ==================== Types ====================

interface KeyDateMilestoneRowProps {
  keyDate: KeyDateModel;
  timelineStart: dayjs.Dayjs;
  zoomLevel: ZoomLevel;
  totalTimelineWidth: number;
}

// ==================== Helper Functions ====================

/**
 * Calculate the position of a key date milestone on the timeline
 */
const calculateMilestonePosition = (
  keyDate: KeyDateModel,
  timelineStart: dayjs.Dayjs,
  zoomLevel: ZoomLevel
): number => {
  const targetDate = keyDate.targetDate
    ? dayjs(keyDate.targetDate)
    : dayjs().add(keyDate.targetDays, 'day'); // Fallback if no target date set

  const columnWidth = COLUMN_WIDTHS[zoomLevel];
  const daysDiff = targetDate.diff(timelineStart, 'day');

  switch (zoomLevel) {
    case 'day':
      return daysDiff * columnWidth;
    case 'week':
      return (daysDiff / 7) * columnWidth;
    case 'month':
      return (daysDiff / 30) * columnWidth;
    default:
      return daysDiff * columnWidth;
  }
};

// ==================== Milestone Info Component ====================

interface MilestoneInfoProps {
  keyDate: KeyDateModel;
}

const MilestoneInfo: React.FC<MilestoneInfoProps> = ({ keyDate }) => {
  const categoryColor = KEY_DATE_CATEGORY_COLORS[keyDate.category];

  return (
    <View style={styles.infoContainer}>
      <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
      <View style={styles.infoContent}>
        <Text style={[styles.code, { color: categoryColor }]} numberOfLines={1}>
          {keyDate.code}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {keyDate.description}
        </Text>
      </View>
    </View>
  );
};

// ==================== Milestone Marker Component ====================

interface MilestoneMarkerProps {
  keyDate: KeyDateModel;
  position: number;
  totalWidth: number;
}

const MilestoneMarker: React.FC<MilestoneMarkerProps> = ({
  keyDate,
  position,
  totalWidth,
}) => {
  const statusColor = KEY_DATE_STATUS_COLORS[keyDate.status];
  const categoryColor = KEY_DATE_CATEGORY_COLORS[keyDate.category];
  const isCritical = keyDate.isCritical();

  return (
    <View style={[styles.markerContainer, { width: totalWidth }]}>
      {/* Diamond Milestone Marker */}
      <View
        style={[
          styles.diamond,
          {
            left: position - 10, // Center the 20px diamond
            backgroundColor: statusColor,
            borderColor: isCritical ? COLORS.ERROR : categoryColor,
            borderWidth: isCritical ? 2 : 1,
          },
        ]}
      >
        {/* Inner diamond for visual depth */}
        <View
          style={[
            styles.diamondInner,
            { backgroundColor: statusColor },
          ]}
        />
      </View>

      {/* Vertical line from diamond to show the date point */}
      <View
        style={[
          styles.dateLine,
          {
            left: position,
            backgroundColor: statusColor,
          },
        ]}
      />

      {/* Progress percentage label */}
      <View style={[styles.progressLabel, { left: position + 15 }]}>
        <Text style={styles.progressText}>
          {keyDate.progressPercentage.toFixed(0)}%
        </Text>
      </View>
    </View>
  );
};

// ==================== Main Component ====================

export const KeyDateMilestoneRow: React.FC<KeyDateMilestoneRowProps> = ({
  keyDate,
  timelineStart,
  zoomLevel,
  totalTimelineWidth,
}) => {
  const milestonePosition = calculateMilestonePosition(
    keyDate,
    timelineStart,
    zoomLevel
  );

  return (
    <View style={styles.wrapper}>
      <MilestoneInfo keyDate={keyDate} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ width: SCREEN_WIDTH - LEFT_COLUMN_WIDTH }}
      >
        <MilestoneMarker
          keyDate={keyDate}
          position={milestonePosition}
          totalWidth={totalTimelineWidth}
        />
      </ScrollView>
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: TASK_HEIGHT,
    backgroundColor: '#FFFDE7', // Light yellow to distinguish from regular tasks
  },
  // Info styles
  infoContainer: {
    width: LEFT_COLUMN_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  categoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 8,
  },
  infoContent: {
    flex: 1,
  },
  code: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  // Marker styles
  markerContainer: {
    height: TASK_HEIGHT,
    position: 'relative',
  },
  diamond: {
    position: 'absolute',
    width: 20,
    height: 20,
    top: (TASK_HEIGHT - 20) / 2,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  diamondInner: {
    width: 10,
    height: 10,
    borderRadius: 1,
    opacity: 0.5,
  },
  dateLine: {
    position: 'absolute',
    width: 1,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  progressLabel: {
    position: 'absolute',
    top: (TASK_HEIGHT - 16) / 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
});

export default KeyDateMilestoneRow;
