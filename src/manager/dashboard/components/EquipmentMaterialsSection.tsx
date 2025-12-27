import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider } from 'react-native-paper';
import { formatCurrency } from '../utils/dashboardFormatters';

interface EquipmentMaterialsData {
  pm300Progress: number;
  pm300Status: string;
  pm400Progress: number;
  pm400Status: string;
  totalPOs: number;
  posDraft: number;
  posIssued: number;
  posInProgress: number;
  posDelivered: number;
  posClosed: number;
  totalPOValue: number;
  upcomingDeliveries: number;
  delayedDeliveries: number;
}

interface EquipmentMaterialsSectionProps {
  data: EquipmentMaterialsData;
}

export const EquipmentMaterialsSection: React.FC<EquipmentMaterialsSectionProps> = ({ data }) => {
  const {
    pm300Progress,
    pm300Status,
    pm400Progress,
    pm400Status,
    totalPOs,
    posDraft,
    posIssued,
    posInProgress,
    posDelivered,
    posClosed,
    totalPOValue,
    upcomingDeliveries,
    delayedDeliveries,
  } = data;

  return (
    <>
      {/* 4.1 Procurement Pipeline (PM300 & PM400) */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Procurement & Manufacturing Pipeline</Title>
          <View style={styles.pipelineRow}>
            {/* PM300 */}
            <View style={styles.pipelineItem}>
              <Paragraph style={styles.pipelineLabel}>Procurement (PM300)</Paragraph>
              <Title style={styles.pipelineValue}>{pm300Progress}%</Title>
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      pm300Status === 'completed'
                        ? '#4CAF50'
                        : pm300Status === 'in_progress'
                        ? '#2196F3'
                        : '#9E9E9E',
                  },
                ]}
                textStyle={{ color: '#fff', fontSize: 11 }}
              >
                {pm300Status.replace('_', ' ').toUpperCase()}
              </Chip>
            </View>

            <Divider style={styles.verticalDivider} />

            {/* PM400 */}
            <View style={styles.pipelineItem}>
              <Paragraph style={styles.pipelineLabel}>Manufacturing (PM400)</Paragraph>
              <Title style={styles.pipelineValue}>{pm400Progress}%</Title>
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      pm400Status === 'completed'
                        ? '#4CAF50'
                        : pm400Status === 'in_progress'
                        ? '#2196F3'
                        : '#9E9E9E',
                  },
                ]}
                textStyle={{ color: '#fff', fontSize: 11 }}
              >
                {pm400Status.replace('_', ' ').toUpperCase()}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 4.2 Purchase Orders Summary */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Purchase Orders</Title>
          <View style={styles.poSummaryRow}>
            <View style={styles.poSummaryLeft}>
              <Title style={styles.poTotalValue}>{formatCurrency(totalPOValue)}</Title>
              <Paragraph style={styles.poTotalLabel}>Total PO Value</Paragraph>
              <Paragraph style={styles.poCount}>{totalPOs} Purchase Orders</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.poSummaryRight}>
              <Paragraph style={styles.poStatusItem}>📝 {posDraft} Draft</Paragraph>
              <Paragraph style={styles.poStatusItem}>📤 {posIssued} Issued</Paragraph>
              <Paragraph style={styles.poStatusItem}>⏳ {posInProgress} In Progress</Paragraph>
              <Paragraph style={styles.poStatusItem}>📦 {posDelivered} Delivered</Paragraph>
              <Paragraph style={styles.poStatusItem}>✅ {posClosed} Closed</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 4.3 Delivery Schedule */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Delivery Schedule</Title>
          <View style={styles.deliveryRow}>
            <View style={styles.deliveryMetric}>
              <Title style={styles.deliveryValue}>{upcomingDeliveries}</Title>
              <Paragraph style={styles.deliveryLabel}>Upcoming (30 days)</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.deliveryMetric}>
              <Title style={[styles.deliveryValue, { color: delayedDeliveries > 0 ? '#F44336' : '#666' }]}>
                {delayedDeliveries}
              </Title>
              <Paragraph style={styles.deliveryLabel}>Delayed Deliveries</Paragraph>
            </View>
          </View>
          {delayedDeliveries > 0 && (
            <Paragraph style={styles.warningText}>
              ⚠️ {delayedDeliveries} deliveries are past their expected date
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    margin: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pipelineRow: {
    flexDirection: 'row',
  },
  pipelineItem: {
    flex: 1,
    alignItems: 'center',
  },
  pipelineLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  pipelineValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statusChip: {
    marginTop: 8,
  },
  verticalDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  poSummaryRow: {
    flexDirection: 'row',
  },
  poSummaryLeft: {
    flex: 2,
    alignItems: 'center',
  },
  poTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  poTotalLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  poCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  poSummaryRight: {
    flex: 3,
    justifyContent: 'center',
  },
  poStatusItem: {
    fontSize: 12,
    color: '#333',
    marginVertical: 2,
  },
  deliveryRow: {
    flexDirection: 'row',
  },
  deliveryMetric: {
    flex: 1,
    alignItems: 'center',
  },
  deliveryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#666',
  },
  deliveryLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
