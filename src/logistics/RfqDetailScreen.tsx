import React, { useState, useMemo } from 'react';
import { logger } from '../services/LoggingService';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { database } from '../../models/database';
import RfqModel from '../../models/RfqModel';
import RfqVendorQuoteModel from '../../models/RfqVendorQuoteModel';
import VendorModel from '../../models/VendorModel';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import { Q } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import { switchMap } from 'rxjs/operators';
import { useAuth } from '../auth/AuthContext';
import RfqService from '../services/RfqService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

/**
 * RFQ Detail Screen
 *
 * Display RFQ details with tabs:
 * - Overview: RFQ summary and timeline
 * - Quotes: All vendor quotes
 * - Evaluation: Quote comparison and scoring
 * - Actions: Issue, Award, Cancel
 *
 * Phase 3: Activity 4 - Days 5-7
 */

interface RfqDetailScreenProps {
  navigation: any;
  route: any;
  rfq: RfqModel;
  quotes: RfqVendorQuoteModel[];
  doorsPackage?: DoorsPackageModel;
}

type TabId = 'overview' | 'quotes' | 'evaluation';

// Helper component for quote cards (extracted to fix hooks order issue)
const QuoteCard: React.FC<{ quote: RfqVendorQuoteModel; formatCurrency: (amount: number) => string }> = ({ quote, formatCurrency }) => {
  const [vendor, setVendor] = useState<VendorModel | null>(null);

  React.useEffect(() => {
    const fetchVendor = async () => {
      const v = await database.collections
        .get<VendorModel>('vendors')
        .find(quote.vendorId);
      setVendor(v);
    };
    fetchVendor();
  }, [quote.vendorId]);

  const getRankBadge = (rank?: number) => {
    if (!rank) return null;
    const colors = ['#10B981', '#3B82F6', '#F59E0B'];
    const labels = ['L1', 'L2', 'L3'];
    if (rank > 3) return null;
    return (
      <View style={[styles.rankBadge, { backgroundColor: colors[rank - 1] }]}>
        <Text style={styles.rankBadgeText}>{labels[rank - 1]}</Text>
      </View>
    );
  };

  return (
    <View key={quote.id} style={styles.quoteCard}>
      <View style={styles.quoteHeader}>
        <View>
          <Text style={styles.vendorName}>{vendor?.vendorName || 'Loading...'}</Text>
          <Text style={styles.vendorCode}>{vendor?.vendorCode || ''}</Text>
        </View>
        {getRankBadge(quote.rank)}
      </View>

      <View style={styles.quoteDetails}>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteLabel}>Quoted Price:</Text>
          <Text style={styles.quotePrice}>{formatCurrency(quote.quotedPrice)}</Text>
        </View>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteLabel}>Lead Time:</Text>
          <Text style={styles.quoteValue}>{quote.leadTimeDays} days</Text>
        </View>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteLabel}>Compliance:</Text>
          <Text style={styles.quoteValue}>{quote.technicalCompliancePercentage}%</Text>
        </View>
        {quote.overallScore && (
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Overall Score:</Text>
            <Text style={[styles.quoteValue, styles.scoreValue]}>
              {quote.overallScore.toFixed(1)}/100
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.statusChip, styles.quoteStatusChip]}>
        <Text style={styles.statusText}>{quote.status.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const RfqDetailScreen: React.FC<RfqDetailScreenProps> = ({
  navigation,
  route,
  rfq,
  quotes,
  doorsPackage,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      logger.info('[RfqDetail] Screen focused, refreshing');
      setRefreshKey((prev) => prev + 1);
    }, [])
  );

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return '#6B7280';
      case 'issued':
        return '#3B82F6';
      case 'quotes_received':
        return '#06B6D4';
      case 'evaluated':
        return '#8B5CF6';
      case 'awarded':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Format date
  const formatDate = (timestamp: number | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  // Issue RFQ
  const handleIssueRfq = async () => {
    if (rfq.status !== 'draft') {
      Alert.alert('Error', 'Only draft RFQs can be issued');
      return;
    }

    Alert.alert('Confirm Issue', `Issue RFQ to ${rfq.totalVendorsInvited} vendor(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Issue',
        onPress: async () => {
          try {
            setLoading(true);
            await RfqService.issueRfq(rfq.id);
            Alert.alert('Success', 'RFQ issued successfully');
            setRefreshKey((prev) => prev + 1);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to issue RFQ');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Rank quotes
  const handleRankQuotes = async () => {
    if (quotes.length === 0) {
      Alert.alert('Error', 'No quotes to rank');
      return;
    }

    const unevaluatedQuotes = quotes.filter((q) => !q.overallScore);
    if (unevaluatedQuotes.length > 0) {
      Alert.alert('Error', `${unevaluatedQuotes.length} quote(s) are not yet evaluated`);
      return;
    }

    try {
      setLoading(true);
      await RfqService.rankQuotes(rfq.id);
      Alert.alert('Success', 'Quotes ranked successfully');
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to rank quotes');
    } finally {
      setLoading(false);
    }
  };

  // Cancel RFQ
  const handleCancelRfq = () => {
    if (rfq.status === 'awarded') {
      Alert.alert('Error', 'Cannot cancel an awarded RFQ');
      return;
    }

    Alert.alert('Confirm Cancellation', 'Are you sure you want to cancel this RFQ?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await RfqService.cancelRfq(rfq.id, 'Cancelled by user');
            Alert.alert('Success', 'RFQ cancelled');
            setRefreshKey((prev) => prev + 1);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to cancel RFQ');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Render Overview Tab
  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* RFQ Details */}
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>RFQ Information</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>RFQ Number:</Text>
          <Text style={styles.detailValue}>{rfq.rfqNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <View style={[styles.statusChip, { backgroundColor: getStatusColor(rfq.status) }]}>
            <Text style={styles.statusText}>{rfq.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>DOORS ID:</Text>
          <Text style={styles.detailValue}>{rfq.doorsId}</Text>
        </View>
        {doorsPackage && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Equipment:</Text>
            <Text style={styles.detailValue}>{doorsPackage.equipmentName}</Text>
          </View>
        )}
      </View>

      {/* Timeline */}
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{formatDate(rfq.createdAt.getTime())}</Text>
        </View>
        {rfq.issueDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issued:</Text>
            <Text style={styles.detailValue}>{formatDate(rfq.issueDate)}</Text>
          </View>
        )}
        {rfq.closingDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Closing:</Text>
            <Text style={styles.detailValue}>{formatDate(rfq.closingDate)}</Text>
          </View>
        )}
        {rfq.evaluationDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Evaluated:</Text>
            <Text style={styles.detailValue}>{formatDate(rfq.evaluationDate)}</Text>
          </View>
        )}
        {rfq.awardDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Awarded:</Text>
            <Text style={styles.detailValue}>{formatDate(rfq.awardDate)}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Expected Delivery:</Text>
          <Text style={styles.detailValue}>{rfq.expectedDeliveryDays || 'N/A'} days</Text>
        </View>
      </View>

      {/* Description */}
      {rfq.description && (
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{rfq.description}</Text>
        </View>
      )}

      {/* Statistics */}
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Quote Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{rfq.totalVendorsInvited}</Text>
            <Text style={styles.statBoxLabel}>Vendors Invited</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{rfq.totalQuotesReceived}</Text>
            <Text style={styles.statBoxLabel}>Quotes Received</Text>
          </View>
        </View>
      </View>

      {/* Award Details */}
      {rfq.status === 'awarded' && rfq.awardedValue && (
        <View style={[styles.detailSection, styles.awardSection]}>
          <Text style={styles.sectionTitle}>Award Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Awarded Value:</Text>
            <Text style={[styles.detailValue, styles.awardValue]}>
              {formatCurrency(rfq.awardedValue)}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  // Render Quotes Tab
  const renderQuotesTab = () => {
    const sortedQuotes = [...quotes].sort((a, b) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      return a.quotedPrice - b.quotedPrice;
    });

    return (
      <ScrollView style={styles.tabContent}>
        {sortedQuotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Quotes Yet</Text>
            <Text style={styles.emptySubtitle}>
              Vendors will submit quotes after RFQ is issued
            </Text>
          </View>
        ) : (
          sortedQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} formatCurrency={formatCurrency} />
          ))
        )}
      </ScrollView>
    );
  };

  // Render Evaluation Tab
  const renderEvaluationTab = () => {
    if (quotes.length === 0) {
      return (
        <View style={[styles.tabContent, styles.emptyState]}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Quotes to Evaluate</Text>
        </View>
      );
    }

    const evaluatedQuotes = quotes.filter((q) => q.overallScore);
    const pendingQuotes = quotes.filter((q) => !q.overallScore);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Evaluation Summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Quotes:</Text>
            <Text style={styles.detailValue}>{quotes.length}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Evaluated:</Text>
            <Text style={styles.detailValue}>{evaluatedQuotes.length}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pending:</Text>
            <Text style={styles.detailValue}>{pendingQuotes.length}</Text>
          </View>
        </View>

        {evaluatedQuotes.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Ranking</Text>
            {evaluatedQuotes
              .sort((a, b) => (a.rank || 999) - (b.rank || 999))
              .map((quote) => (
                <View key={quote.id} style={styles.rankingRow}>
                  <Text style={styles.rankingRank}>#{quote.rank || '?'}</Text>
                  <Text style={styles.rankingVendor}>{quote.vendorId.slice(0, 8)}...</Text>
                  <Text style={styles.rankingScore}>{quote.overallScore?.toFixed(1)}</Text>
                </View>
              ))}
          </View>
        )}

        {pendingQuotes.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Pending Evaluation</Text>
            <Text style={styles.warningText}>
              {pendingQuotes.length} quote(s) need to be evaluated before ranking
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{rfq.rfqNumber}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quotes' && styles.tabActive]}
          onPress={() => setActiveTab('quotes')}
        >
          <Text style={[styles.tabText, activeTab === 'quotes' && styles.tabTextActive]}>
            Quotes ({quotes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'evaluation' && styles.tabActive]}
          onPress={() => setActiveTab('evaluation')}
        >
          <Text style={[styles.tabText, activeTab === 'evaluation' && styles.tabTextActive]}>
            Evaluation
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'quotes' && renderQuotesTab()}
      {activeTab === 'evaluation' && renderEvaluationTab()}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        {rfq.status === 'draft' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.issueButton]}
            onPress={handleIssueRfq}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Issue RFQ</Text>
            )}
          </TouchableOpacity>
        )}

        {rfq.status === 'quotes_received' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.rankButton]}
            onPress={handleRankQuotes}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Rank Quotes</Text>
            )}
          </TouchableOpacity>
        )}

        {rfq.status !== 'awarded' && rfq.status !== 'cancelled' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelRfq}
            disabled={loading}
          >
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 50,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  awardSection: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  awardValue: {
    color: '#059669',
    fontSize: 16,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  vendorCode: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quoteDetails: {
    marginBottom: 12,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  quoteLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  quotePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  scoreValue: {
    color: '#3B82F6',
  },
  quoteStatusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#6B7280',
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rankingRank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    width: 40,
  },
  rankingVendor: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  rankingScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  warningText: {
    fontSize: 13,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  issueButton: {
    backgroundColor: '#3B82F6',
  },
  rankButton: {
    backgroundColor: '#8B5CF6',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
  },
});

// HOC to inject observables
const enhance = withObservables(['route'], ({ route }: any) => {
  const rfqId = route.params?.rfqId;
  return {
    rfq: database.collections.get<RfqModel>('rfqs').findAndObserve(rfqId),
    quotes: database.collections
      .get<RfqVendorQuoteModel>('rfq_vendor_quotes')
      .query(Q.where('rfq_id', rfqId))
      .observe(),
    doorsPackage: database.collections
      .get<RfqModel>('rfqs')
      .findAndObserve(rfqId)
      .pipe(
        // @ts-ignore
        switchMap((rfq: RfqModel) =>
          database.collections.get<DoorsPackageModel>('doors_packages').findAndObserve(rfq.doorsPackageId)
        )
      ),
  };
});

const EnhancedRfqDetailScreen = enhance(RfqDetailScreen);

// Wrap with ErrorBoundary for graceful error handling
const RfqDetailScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - RfqDetailScreen">
    <EnhancedRfqDetailScreen />
  </ErrorBoundary>
);

export default RfqDetailScreenWithBoundary;
