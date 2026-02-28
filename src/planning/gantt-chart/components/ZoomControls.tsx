/**
 * Zoom level controls for Gantt chart
 */

import React from 'react';
import { SegmentedButtons } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { ZoomLevel } from '../utils/ganttConstants';

interface ZoomControlsProps {
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  onZoomChange,
}) => {
  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={zoomLevel}
        onValueChange={(value) => onZoomChange(value as ZoomLevel)}
        buttons={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
