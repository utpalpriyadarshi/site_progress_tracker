import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';

interface StatusStep {
  key: string;
  label: string;
}

interface StatusTimelineProps {
  steps: StatusStep[];
  currentStatus: string;
  cancelledStatus?: string;
}

const STATUS_COLORS = {
  completed: COLORS.SUCCESS,
  current: COLORS.INFO,
  pending: '#BDBDBD',
  cancelled: COLORS.ERROR,
};

const StatusTimeline: React.FC<StatusTimelineProps> = ({ steps, currentStatus, cancelledStatus }) => {
  const isCancelled = cancelledStatus && currentStatus === cancelledStatus;

  const currentIndex = isCancelled
    ? -1
    : steps.findIndex((s) => s.key === currentStatus);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        let circleColor: string;
        let lineColor: string;
        let labelColor: string;

        if (isCancelled) {
          circleColor = STATUS_COLORS.pending;
          lineColor = STATUS_COLORS.pending;
          labelColor = '#999';
        } else if (index < currentIndex) {
          circleColor = STATUS_COLORS.completed;
          lineColor = STATUS_COLORS.completed;
          labelColor = STATUS_COLORS.completed;
        } else if (index === currentIndex) {
          circleColor = STATUS_COLORS.current;
          lineColor = STATUS_COLORS.pending;
          labelColor = STATUS_COLORS.current;
        } else {
          circleColor = STATUS_COLORS.pending;
          lineColor = STATUS_COLORS.pending;
          labelColor = '#999';
        }

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepContainer}>
              <View style={[styles.circle, { backgroundColor: circleColor }]}>
                {index < currentIndex && !isCancelled && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor:
                      !isCancelled && index < currentIndex ? STATUS_COLORS.completed : STATUS_COLORS.pending,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
      {isCancelled && (
        <View style={styles.cancelledBadge}>
          <Text style={styles.cancelledText}>CANCELLED</Text>
        </View>
      )}
    </View>
  );
};

export const DOORS_STATUS_STEPS: StatusStep[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'received', label: 'Received' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'approved', label: 'Approved' },
  { key: 'closed', label: 'Closed' },
];

export const RFQ_STATUS_STEPS: StatusStep[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'issued', label: 'Issued' },
  { key: 'quotes_received', label: 'Quotes' },
  { key: 'evaluated', label: 'Evaluated' },
  { key: 'awarded', label: 'Awarded' },
];

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  stepContainer: {
    alignItems: 'center',
    minWidth: 48,
    maxWidth: 60,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  line: {
    height: 2,
    flex: 1,
    marginTop: 9,
    minWidth: 8,
  },
  cancelledBadge: {
    marginLeft: 8,
    backgroundColor: COLORS.ERROR,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  cancelledText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default StatusTimeline;
