/**
 * Zoom level controls for Gantt chart
 */

import React from 'react';
import { Card, SegmentedButtons } from 'react-native-paper';
import { StyleSheet } from 'react-native';
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
    <Card style={styles.card}>
      <Card.Content>
        <SegmentedButtons
          value={zoomLevel}
          onValueChange={(value) => onZoomChange(value as ZoomLevel)}
          buttons={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
          style={styles.segmentedButtons}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  segmentedButtons: {
    marginVertical: 8,
  },
});
