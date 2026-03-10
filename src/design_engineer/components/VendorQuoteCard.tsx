import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { VendorQuote } from '../types/VendorQuoteTypes';
import { COLORS } from '../../theme/colors';

interface VendorQuoteCardProps {
  quote: VendorQuote;
  onEvaluate?: (quoteId: string) => void;
  onShortlist?: (quoteId: string) => void;
  onReject?: (quoteId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted':
      return COLORS.INFO;
    case 'under_review':
      return COLORS.WARNING;
    case 'shortlisted':
      return COLORS.SUCCESS;
    case 'rejected':
      return COLORS.ERROR;
    case 'awarded':
      return '#7B1FA2';
    default:
      return COLORS.DISABLED;
  }
};

const getRankLabel = (rank: number) => {
  return `L${rank}`;
};

const VendorQuoteCard: React.FC<VendorQuoteCardProps> = ({
  quote,
  onEvaluate,
  onShortlist,
  onReject,
}) => {
  const isL1 = quote.rank === 1;
  const canEvaluate = quote.status === 'submitted' || quote.status === 'under_review';
  const canShortlistReject = quote.technicalScore != null && quote.status !== 'awarded';

  return (
    <Card mode="elevated" style={[styles.card, isL1 && styles.l1Card]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.vendorName}>{quote.vendorName}</Text>
            {quote.quoteReference && (
              <Text style={styles.quoteRef}>Ref: {quote.quoteReference}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {quote.rank !== undefined && (
              <Chip
                mode="flat"
                compact
                style={{ backgroundColor: isL1 ? COLORS.SUCCESS : COLORS.DISABLED }}
                textStyle={styles.rankChipText}>
                {getRankLabel(quote.rank)}
              </Chip>
            )}
            <Chip
              mode="flat"
              compact
              style={{ backgroundColor: getStatusColor(quote.status) }}
              textStyle={styles.statusChipText}>
              {quote.status.replace(/_/g, ' ').toUpperCase()}
            </Chip>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {quote.currency} {quote.quotedPrice.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.leadTime}>{quote.leadTimeDays} days delivery</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Compliance:</Text>
          <Text style={styles.value}>{quote.technicalCompliancePercentage}%</Text>
        </View>

        {quote.warrantyMonths !== undefined && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Warranty:</Text>
            <Text style={styles.value}>{quote.warrantyMonths} months</Text>
          </View>
        )}

        {quote.paymentTerms && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Payment:</Text>
            <Text style={styles.value}>{quote.paymentTerms}</Text>
          </View>
        )}

        {quote.technicalScore != null && (
          <View style={styles.scoresSection}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Tech Score</Text>
              <Text style={styles.scoreValue}>{quote.technicalScore}</Text>
            </View>
            <View style={styles.scoreItem}>
              <View style={[
                styles.qualificationBadge,
                { backgroundColor: (quote.technicalScore || 0) >= 70 ? COLORS.SUCCESS_BG : COLORS.ERROR_BG },
              ]}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: (quote.technicalScore || 0) >= 70 ? '#2E7D32' : '#C62828',
                }}>
                  {(quote.technicalScore || 0) >= 70 ? 'Qualified' : 'Disqualified'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          {canEvaluate && onEvaluate && (
            <Button
              mode="contained"
              compact
              onPress={() => onEvaluate(quote.id)}
              style={styles.actionButton}>
              Evaluate
            </Button>
          )}
          {canShortlistReject && onShortlist && quote.status !== 'shortlisted' && (
            <Button
              mode="outlined"
              compact
              onPress={() => onShortlist(quote.id)}
              style={styles.actionButton}>
              Shortlist
            </Button>
          )}
          {canShortlistReject && onReject && quote.status !== 'rejected' && (
            <Button
              mode="outlined"
              compact
              textColor={COLORS.ERROR}
              onPress={() => onReject(quote.id)}
              style={styles.actionButton}>
              Reject
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  l1Card: {
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quoteRef: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rankChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  leadTime: {
    fontSize: 13,
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#666',
    width: 100,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    color: '#000',
    flex: 1,
  },
  scoresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#666',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  qualificationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    marginLeft: 4,
  },
});

export default VendorQuoteCard;
