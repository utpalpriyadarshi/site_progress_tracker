import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Portal, Dialog, Button, Chip, FAB, IconButton } from 'react-native-paper';
import VendorQuoteCard from './VendorQuoteCard';
import AddVendorQuoteDialog from './AddVendorQuoteDialog';
import EvaluateQuoteDialog from './EvaluateQuoteDialog';
import { VendorQuote, Vendor, QuoteComparison } from '../types/VendorQuoteTypes';
import { DesignRfq } from '../types/DesignRfqTypes';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import RfqService from '../../services/RfqService';
import { logger } from '../../services/LoggingService';

interface VendorQuotesSheetProps {
  visible: boolean;
  onDismiss: () => void;
  rfq: DesignRfq | null;
  vendors: Vendor[];
  engineerId: string;
  onRfqUpdated: (rfq: DesignRfq) => void;
}

type ViewMode = 'list' | 'compare';

const VendorQuotesSheet: React.FC<VendorQuotesSheetProps> = ({
  visible,
  onDismiss,
  rfq,
  vendors,
  engineerId,
  onRfqUpdated,
}) => {
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [evaluateDialogVisible, setEvaluateDialogVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<VendorQuote | null>(null);
  const [comparison, setComparison] = useState<{
    quotes: QuoteComparison[];
    lowestPrice: number;
    fastestDelivery: number;
    highestCompliance: number;
  } | null>(null);

  useEffect(() => {
    if (visible && rfq) {
      loadQuotes();
    }
  }, [visible, rfq]);

  const loadQuotes = async () => {
    if (!rfq) return;
    setLoading(true);
    try {
      const quotesData = await RfqService.getQuotesForRfq(rfq.id);
      const vendorMap = new Map(vendors.map((v) => [v.id, v]));

      const quotesList: VendorQuote[] = quotesData.map((q: any) => ({
        id: q.id,
        rfqId: q.rfqId,
        vendorId: q.vendorId,
        vendorName: vendorMap.get(q.vendorId)?.vendorName || 'Unknown Vendor',
        quoteReference: q.quoteReference,
        quotedPrice: q.quotedPrice,
        currency: q.currency,
        leadTimeDays: q.leadTimeDays,
        validityDays: q.validityDays,
        paymentTerms: q.paymentTerms,
        warrantyMonths: q.warrantyMonths,
        technicalCompliancePercentage: q.technicalCompliancePercentage,
        technicalDeviations: q.technicalDeviations,
        commercialDeviations: q.commercialDeviations,
        notes: q.notes,
        status: q.status,
        technicalScore: q.technicalScore,
        commercialScore: q.commercialScore,
        overallScore: q.overallScore,
        rank: q.rank,
        submittedAt: q.submittedAt,
        evaluatedAt: q.evaluatedAt,
      }));

      setQuotes(quotesList);
    } catch (error: any) {
      logger.error('[VendorQuotes] Error loading quotes:', error);
      Alert.alert('Error', 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    if (!rfq) return;
    try {
      const analysis = await RfqService.getComparativeAnalysis(rfq.id);
      const vendorMap = new Map(vendors.map((v) => [v.id, v]));

      setComparison({
        quotes: analysis.quotes.map((a) => ({
          quote: {
            id: a.quote.id,
            rfqId: (a.quote as any).rfqId,
            vendorId: (a.quote as any).vendorId,
            vendorName: vendorMap.get((a.quote as any).vendorId)?.vendorName || 'Unknown',
            quotedPrice: a.quote.quotedPrice,
            currency: a.quote.currency,
            leadTimeDays: a.quote.leadTimeDays,
            validityDays: a.quote.validityDays,
            technicalCompliancePercentage: a.quote.technicalCompliancePercentage,
            status: a.quote.status,
            technicalScore: a.quote.technicalScore,
            commercialScore: a.quote.commercialScore,
            overallScore: a.quote.overallScore,
            rank: a.quote.rank,
          },
          priceRank: a.priceRank,
          leadTimeRank: a.leadTimeRank,
          complianceRank: a.complianceRank,
        })),
        lowestPrice: analysis.lowestPrice,
        fastestDelivery: analysis.fastestDelivery,
        highestCompliance: analysis.highestCompliance,
      });
    } catch (error: any) {
      logger.error('[VendorQuotes] Error loading comparison:', error);
    }
  };

  const handleAddQuote = async (data: {
    vendorId: string;
    quotedPrice: number;
    currency: string;
    leadTimeDays: number;
    validityDays: number;
    paymentTerms?: string;
    warrantyMonths?: number;
    technicalCompliancePercentage: number;
    notes?: string;
  }) => {
    if (!rfq) return;
    try {
      await RfqService.addVendorQuote({
        rfqId: rfq.id,
        vendorId: data.vendorId,
        quotedPrice: data.quotedPrice,
        currency: data.currency,
        leadTimeDays: data.leadTimeDays,
        validityDays: data.validityDays,
        paymentTerms: data.paymentTerms,
        warrantyMonths: data.warrantyMonths,
        technicalCompliancePercentage: data.technicalCompliancePercentage,
        notes: data.notes,
      });

      setAddDialogVisible(false);
      await loadQuotes();

      // Update RFQ quote count
      onRfqUpdated({
        ...rfq,
        totalQuotesReceived: rfq.totalQuotesReceived + 1,
        status: rfq.status === 'issued' ? 'quotes_received' : rfq.status,
      });
    } catch (error: any) {
      logger.error('[VendorQuotes] Error adding quote:', error);
      Alert.alert('Error', error.message || 'Failed to add quote');
    }
  };

  const handleEvaluate = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (quote) {
      setSelectedQuote(quote);
      setEvaluateDialogVisible(true);
    }
  };

  const handleSubmitEvaluation = async (data: {
    quoteId: string;
    technicalScore: number;
    commercialScore: number;
    technicalDeviations?: string;
    commercialDeviations?: string;
  }) => {
    if (!rfq) return;
    try {
      await RfqService.evaluateQuote(
        {
          quoteId: data.quoteId,
          technicalScore: data.technicalScore,
          commercialScore: data.commercialScore,
        },
        engineerId
      );

      await RfqService.rankQuotes(rfq.id);

      setEvaluateDialogVisible(false);
      setSelectedQuote(null);
      await loadQuotes();

      onRfqUpdated({
        ...rfq,
        status: 'evaluated',
        evaluationDate: Date.now(),
        evaluatedById: engineerId,
      });
    } catch (error: any) {
      logger.error('[VendorQuotes] Error evaluating quote:', error);
      Alert.alert('Error', error.message || 'Failed to evaluate quote');
    }
  };

  const handleShortlist = async (quoteId: string) => {
    try {
      const quotesCollection = database.collections.get('rfq_vendor_quotes');
      const quoteRecord = await quotesCollection.find(quoteId);
      await database.write(async () => {
        await quoteRecord.update((record: any) => {
          record.status = 'shortlisted';
        });
      });
      await loadQuotes();
    } catch (error: any) {
      logger.error('[VendorQuotes] Error shortlisting:', error);
      Alert.alert('Error', 'Failed to shortlist quote');
    }
  };

  const handleReject = async (quoteId: string) => {
    try {
      const quotesCollection = database.collections.get('rfq_vendor_quotes');
      const quoteRecord = await quotesCollection.find(quoteId);
      await database.write(async () => {
        await quoteRecord.update((record: any) => {
          record.status = 'rejected';
        });
      });
      await loadQuotes();
    } catch (error: any) {
      logger.error('[VendorQuotes] Error rejecting:', error);
      Alert.alert('Error', 'Failed to reject quote');
    }
  };

  const handleAwardL1 = async () => {
    if (!rfq) return;
    const l1Quote = quotes.find((q) => q.rank === 1);
    if (!l1Quote) {
      Alert.alert('Error', 'No L1 vendor found. Please evaluate and rank quotes first.');
      return;
    }

    Alert.alert(
      'Award to L1 Vendor',
      `Award this RFQ to ${l1Quote.vendorName} at ${l1Quote.currency} ${l1Quote.quotedPrice.toLocaleString('en-IN')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Award',
          onPress: async () => {
            try {
              await RfqService.awardRfq(rfq.id, l1Quote.id, l1Quote.quotedPrice, engineerId);
              await loadQuotes();
              onRfqUpdated({
                ...rfq,
                status: 'awarded',
                awardDate: Date.now(),
                awardedValue: l1Quote.quotedPrice,
                winningVendorId: l1Quote.vendorId,
              });
            } catch (error: any) {
              logger.error('[VendorQuotes] Error awarding:', error);
              Alert.alert('Error', error.message || 'Failed to award RFQ');
            }
          },
        },
      ]
    );
  };

  const toggleViewMode = () => {
    if (viewMode === 'list') {
      loadComparison();
      setViewMode('compare');
    } else {
      setViewMode('list');
    }
  };

  if (!rfq) return null;

  const hasEvaluatedQuotes = quotes.some((q) => q.overallScore !== undefined);
  const canAddQuotes = ['issued', 'quotes_received'].includes(rfq.status);
  const canAward = rfq.status === 'evaluated' && hasEvaluatedQuotes;

  const renderCompareView = () => {
    if (!comparison || comparison.quotes.length === 0) {
      return (
        <View style={styles.emptyCompare}>
          <Text style={styles.emptyText}>No quotes to compare</Text>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {/* Header row */}
          <View style={styles.compareRow}>
            <View style={styles.compareLabel}>
              <Text style={styles.compareLabelText}>Metric</Text>
            </View>
            {comparison.quotes.map((cq) => (
              <View key={cq.quote.id} style={styles.compareCell}>
                <Text style={styles.compareVendor} numberOfLines={1}>{cq.quote.vendorName}</Text>
                {cq.quote.rank && (
                  <Text style={[styles.compareRank, cq.quote.rank === 1 && styles.l1Rank]}>
                    L{cq.quote.rank}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Price row */}
          <View style={styles.compareRow}>
            <View style={styles.compareLabel}>
              <Text style={styles.compareLabelText}>Price</Text>
            </View>
            {comparison.quotes.map((cq) => (
              <View
                key={cq.quote.id}
                style={[
                  styles.compareCell,
                  cq.quote.quotedPrice === comparison.lowestPrice && styles.bestCell,
                ]}>
                <Text style={styles.compareCellText}>
                  {cq.quote.currency} {cq.quote.quotedPrice.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>

          {/* Lead Time row */}
          <View style={styles.compareRow}>
            <View style={styles.compareLabel}>
              <Text style={styles.compareLabelText}>Lead Time</Text>
            </View>
            {comparison.quotes.map((cq) => (
              <View
                key={cq.quote.id}
                style={[
                  styles.compareCell,
                  cq.quote.leadTimeDays === comparison.fastestDelivery && styles.bestCell,
                ]}>
                <Text style={styles.compareCellText}>{cq.quote.leadTimeDays} days</Text>
              </View>
            ))}
          </View>

          {/* Compliance row */}
          <View style={styles.compareRow}>
            <View style={styles.compareLabel}>
              <Text style={styles.compareLabelText}>Compliance</Text>
            </View>
            {comparison.quotes.map((cq) => (
              <View
                key={cq.quote.id}
                style={[
                  styles.compareCell,
                  cq.quote.technicalCompliancePercentage === comparison.highestCompliance && styles.bestCell,
                ]}>
                <Text style={styles.compareCellText}>{cq.quote.technicalCompliancePercentage}%</Text>
              </View>
            ))}
          </View>

          {/* Tech Score row */}
          {hasEvaluatedQuotes && (
            <View style={styles.compareRow}>
              <View style={styles.compareLabel}>
                <Text style={styles.compareLabelText}>Tech Score</Text>
              </View>
              {comparison.quotes.map((cq) => (
                <View key={cq.quote.id} style={styles.compareCell}>
                  <Text style={styles.compareCellText}>{cq.quote.technicalScore ?? '-'}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Commercial Score row */}
          {hasEvaluatedQuotes && (
            <View style={styles.compareRow}>
              <View style={styles.compareLabel}>
                <Text style={styles.compareLabelText}>Comm Score</Text>
              </View>
              {comparison.quotes.map((cq) => (
                <View key={cq.quote.id} style={styles.compareCell}>
                  <Text style={styles.compareCellText}>{cq.quote.commercialScore ?? '-'}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Overall Score row */}
          {hasEvaluatedQuotes && (
            <View style={styles.compareRow}>
              <View style={styles.compareLabel}>
                <Text style={styles.compareLabelText}>Overall</Text>
              </View>
              {comparison.quotes.map((cq) => (
                <View
                  key={cq.quote.id}
                  style={[styles.compareCell, cq.quote.rank === 1 && styles.bestCell]}>
                  <Text style={[styles.compareCellText, styles.boldText]}>
                    {cq.quote.overallScore?.toFixed(1) ?? '-'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{rfq.title}</Text>
              <Text style={styles.sheetSubtitle}>{rfq.rfqNumber} - {quotes.length} quote(s)</Text>
            </View>
            <IconButton icon="close" size={24} onPress={onDismiss} />
          </View>
          <View style={styles.viewToggle}>
            <Chip
              mode={viewMode === 'list' ? 'flat' : 'outlined'}
              selected={viewMode === 'list'}
              onPress={() => setViewMode('list')}
              style={styles.viewChip}>
              List
            </Chip>
            <Chip
              mode={viewMode === 'compare' ? 'flat' : 'outlined'}
              selected={viewMode === 'compare'}
              onPress={toggleViewMode}
              style={styles.viewChip}>
              Compare
            </Chip>
          </View>
        </View>

        <Dialog.ScrollArea style={styles.scrollArea}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : viewMode === 'list' ? (
            <FlatList
              data={quotes}
              renderItem={({ item }) => (
                <VendorQuoteCard
                  quote={item}
                  onEvaluate={handleEvaluate}
                  onShortlist={handleShortlist}
                  onReject={handleReject}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No quotes yet</Text>
                  {canAddQuotes && (
                    <Text style={styles.emptyHint}>Tap + to add a vendor quote</Text>
                  )}
                </View>
              }
            />
          ) : (
            <ScrollView contentContainerStyle={styles.listContent}>
              {renderCompareView()}
            </ScrollView>
          )}
        </Dialog.ScrollArea>

        <Dialog.Actions style={styles.sheetActions}>
          {canAward && (
            <Button
              mode="contained"
              onPress={handleAwardL1}
              style={styles.awardButton}
              buttonColor="#4CAF50">
              Award to L1
            </Button>
          )}
          {canAddQuotes && (
            <Button
              mode="contained"
              onPress={() => setAddDialogVisible(true)}
              icon="plus">
              Add Quote
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>

      <AddVendorQuoteDialog
        visible={addDialogVisible}
        onDismiss={() => setAddDialogVisible(false)}
        onSubmit={handleAddQuote}
        vendors={vendors}
      />

      <EvaluateQuoteDialog
        visible={evaluateDialogVisible}
        onDismiss={() => {
          setEvaluateDialogVisible(false);
          setSelectedQuote(null);
        }}
        onSubmit={handleSubmitEvaluation}
        quote={selectedQuote}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
    minHeight: '60%',
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewChip: {
    marginRight: 4,
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  emptyCompare: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  sheetActions: {
    justifyContent: 'flex-end',
    gap: 8,
  },
  awardButton: {
    marginRight: 8,
  },
  // Compare view styles
  compareRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  compareLabel: {
    width: 80,
    padding: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
  },
  compareLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  compareCell: {
    width: 120,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestCell: {
    backgroundColor: '#E8F5E9',
  },
  compareVendor: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  compareRank: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  l1Rank: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  compareCellText: {
    fontSize: 12,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default VendorQuotesSheet;
