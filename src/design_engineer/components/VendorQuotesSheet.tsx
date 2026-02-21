import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Portal, Dialog, Button, Chip, FAB, IconButton } from 'react-native-paper';
import VendorQuoteCard from './VendorQuoteCard';
import AddVendorQuoteDialog from './AddVendorQuoteDialog';
import EvaluateQuoteDialog from './EvaluateQuoteDialog';
import { VendorQuote, Vendor, QuoteComparison } from '../types/VendorQuoteTypes';
import { DesignRfq } from '../types/DesignRfqTypes';
import { database } from '../../../models/database';
import RfqVendorQuoteModel from '../../../models/RfqVendorQuoteModel';
import VendorModel from '../../../models/VendorModel';
import DoorsPackageModel from '../../../models/DoorsPackageModel';
import { Q } from '@nozbe/watermelondb';
import RfqService from '../../services/RfqService';
import { logger } from '../../services/LoggingService';
import { COLORS } from '../../theme/colors';
import { useFlatListProps } from '../../hooks/useFlatListProps';

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
  const flatListProps = useFlatListProps<VendorQuote>();
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
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (visible && rfq) {
      loadQuotes();
    }
  }, [visible, rfq]);

  const loadQuotes = async () => {
    if (!rfq) return;
    setLoading(true);
    try {
      const quotesData: RfqVendorQuoteModel[] = await RfqService.getQuotesForRfq(rfq.id);
      const vendorMap = new Map(vendors.map((v) => [v.id, v]));

      const quotesList: VendorQuote[] = quotesData.map((q: RfqVendorQuoteModel) => ({
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
        // v45: compliance breakup
        techComplied: q.techComplied,
        techCompliedWithComments: q.techCompliedWithComments,
        techNotComplied: q.techNotComplied,
        datasheetComplied: q.datasheetComplied,
        datasheetCompliedWithComments: q.datasheetCompliedWithComments,
        datasheetNotComplied: q.datasheetNotComplied,
        typeTestComplied: q.typeTestComplied,
        typeTestCompliedWithComments: q.typeTestCompliedWithComments,
        typeTestNotComplied: q.typeTestNotComplied,
        routineTestComplied: q.routineTestComplied,
        routineTestCompliedWithComments: q.routineTestCompliedWithComments,
        routineTestNotComplied: q.routineTestNotComplied,
        siteReqComplied: q.siteReqComplied,
        siteReqCompliedWithComments: q.siteReqCompliedWithComments,
        siteReqNotComplied: q.siteReqNotComplied,
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
            rfqId: a.quote.rfqId,
            vendorId: a.quote.vendorId,
            vendorName: vendorMap.get(a.quote.vendorId)?.vendorName || 'Unknown',
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
    vendorName: string;
    quotedPrice: number;
    currency: string;
    leadTimeDays: number;
    validityDays: number;
    paymentTerms?: string;
    warrantyMonths?: number;
    technicalCompliancePercentage: number;
    notes?: string;
    techComplied?: number;
    techCompliedWithComments?: number;
    techNotComplied?: number;
    datasheetComplied?: number;
    datasheetCompliedWithComments?: number;
    datasheetNotComplied?: number;
    typeTestComplied?: number;
    typeTestCompliedWithComments?: number;
    typeTestNotComplied?: number;
    routineTestComplied?: number;
    routineTestCompliedWithComments?: number;
    routineTestNotComplied?: number;
    siteReqComplied?: number;
    siteReqCompliedWithComments?: number;
    siteReqNotComplied?: number;
  }) => {
    if (!rfq) return;
    if (isAddingQuote) return;
    setIsAddingQuote(true);
    try {
      // If no vendorId, create a new vendor record
      let resolvedVendorId = data.vendorId;
      if (!resolvedVendorId && data.vendorName) {
        const newVendor = await database.write(async () => {
          return await database.collections.get<VendorModel>('vendors').create((rec: any) => {
            rec.vendorName = data.vendorName;
            rec.category = 'General';
            rec.contactPerson = '';
            rec.email = '';
            rec.phone = '';
            rec.rating = 0;
            rec.appSyncStatus = 'pending';
          });
        });
        resolvedVendorId = newVendor.id;
      }

      // Use RfqService for base fields, then update compliance breakup
      await RfqService.addVendorQuote({
        rfqId: rfq.id,
        vendorId: resolvedVendorId,
        quotedPrice: data.quotedPrice,
        currency: data.currency,
        leadTimeDays: data.leadTimeDays,
        validityDays: data.validityDays,
        paymentTerms: data.paymentTerms,
        warrantyMonths: data.warrantyMonths,
        technicalCompliancePercentage: data.technicalCompliancePercentage,
        notes: data.notes,
      });

      // Update the latest quote with compliance breakup fields
      const latestQuotes = await database.collections.get<RfqVendorQuoteModel>('rfq_vendor_quotes')
        .query(Q.where('rfq_id', rfq.id), Q.where('vendor_id', resolvedVendorId))
        .fetch();
      if (latestQuotes.length > 0) {
        const latestQuote = latestQuotes[latestQuotes.length - 1];
        await database.write(async () => {
          await latestQuote.update((rec: any) => {
            rec.techComplied = data.techComplied ?? null;
            rec.techCompliedWithComments = data.techCompliedWithComments ?? null;
            rec.techNotComplied = data.techNotComplied ?? null;
            rec.datasheetComplied = data.datasheetComplied ?? null;
            rec.datasheetCompliedWithComments = data.datasheetCompliedWithComments ?? null;
            rec.datasheetNotComplied = data.datasheetNotComplied ?? null;
            rec.typeTestComplied = data.typeTestComplied ?? null;
            rec.typeTestCompliedWithComments = data.typeTestCompliedWithComments ?? null;
            rec.typeTestNotComplied = data.typeTestNotComplied ?? null;
            rec.routineTestComplied = data.routineTestComplied ?? null;
            rec.routineTestCompliedWithComments = data.routineTestCompliedWithComments ?? null;
            rec.routineTestNotComplied = data.routineTestNotComplied ?? null;
            rec.siteReqComplied = data.siteReqComplied ?? null;
            rec.siteReqCompliedWithComments = data.siteReqCompliedWithComments ?? null;
            rec.siteReqNotComplied = data.siteReqNotComplied ?? null;
          });
        });
      }

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
    } finally {
      setIsAddingQuote(false);
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
    if (isEvaluating) return;
    setIsEvaluating(true);
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
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleShortlist = async (quoteId: string) => {
    try {
      const quotesCollection = database.collections.get<RfqVendorQuoteModel>('rfq_vendor_quotes');
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
      const quotesCollection = database.collections.get<RfqVendorQuoteModel>('rfq_vendor_quotes');
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

    // Check local state first (fast path — avoids a DB round-trip when already ranked)
    let l1Quote = quotes.find((q) => q.rank === 1);

    // Delegate to service if not in local state: it will auto-rank evaluated quotes if needed
    if (!l1Quote) {
      try {
        const l1Model = await RfqService.getOrRankL1Quote(rfq.id);
        if (l1Model) {
          await loadQuotes(); // refresh UI state after potential auto-ranking
          const vendorMap = new Map(vendors.map((v) => [v.id, v]));
          l1Quote = {
            id: l1Model.id,
            rfqId: l1Model.rfqId,
            vendorId: l1Model.vendorId,
            vendorName: vendorMap.get(l1Model.vendorId)?.vendorName || 'Unknown Vendor',
            quotedPrice: l1Model.quotedPrice,
            currency: l1Model.currency,
            leadTimeDays: l1Model.leadTimeDays,
            validityDays: l1Model.validityDays,
            technicalCompliancePercentage: l1Model.technicalCompliancePercentage,
            status: l1Model.status,
            overallScore: l1Model.overallScore,
            rank: l1Model.rank,
          } as VendorQuote;
        }
      } catch (err) {
        logger.error('[VendorQuotes] Error auto-ranking:', err);
      }
    }

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

              // Write compliance breakup back to DOORS package
              if (rfq.doorsPackageId) {
                try {
                  const doorsCollection = database.collections.get<DoorsPackageModel>('doors_packages');
                  const doorsPkg = await doorsCollection.find(rfq.doorsPackageId);

                  // Calculate per-category percentages from winning quote
                  const calcPct = (c?: number, wc?: number, nc?: number) => {
                    const total = (c || 0) + (wc || 0) + (nc || 0);
                    return total > 0 ? Math.round(((c || 0) + (wc || 0)) / total * 100) : 0;
                  };

                  const totalComplied = (l1Quote.techComplied || 0) + (l1Quote.techCompliedWithComments || 0) +
                    (l1Quote.datasheetComplied || 0) + (l1Quote.datasheetCompliedWithComments || 0) +
                    (l1Quote.typeTestComplied || 0) + (l1Quote.typeTestCompliedWithComments || 0) +
                    (l1Quote.routineTestComplied || 0) + (l1Quote.routineTestCompliedWithComments || 0) +
                    (l1Quote.siteReqComplied || 0) + (l1Quote.siteReqCompliedWithComments || 0);
                  const totalAll = totalComplied +
                    (l1Quote.techNotComplied || 0) + (l1Quote.datasheetNotComplied || 0) +
                    (l1Quote.typeTestNotComplied || 0) + (l1Quote.routineTestNotComplied || 0) +
                    (l1Quote.siteReqNotComplied || 0);

                  await database.write(async () => {
                    await doorsPkg.update((rec: any) => {
                      rec.compliantRequirements = totalComplied;
                      rec.compliancePercentage = totalAll > 0 ? Math.round(totalComplied / totalAll * 100) : 0;
                      rec.technicalReqCompliance = calcPct(l1Quote.techComplied, l1Quote.techCompliedWithComments, l1Quote.techNotComplied);
                      rec.datasheetCompliance = calcPct(l1Quote.datasheetComplied, l1Quote.datasheetCompliedWithComments, l1Quote.datasheetNotComplied);
                      rec.typeTestCompliance = calcPct(l1Quote.typeTestComplied, l1Quote.typeTestCompliedWithComments, l1Quote.typeTestNotComplied);
                      rec.routineTestCompliance = calcPct(l1Quote.routineTestComplied, l1Quote.routineTestCompliedWithComments, l1Quote.routineTestNotComplied);
                      rec.siteReqCompliance = calcPct(l1Quote.siteReqComplied, l1Quote.siteReqCompliedWithComments, l1Quote.siteReqNotComplied);
                      rec.updatedAt = Date.now();
                    });
                  });
                } catch (compErr: any) {
                  logger.error('[VendorQuotes] Error updating DOORS compliance:', compErr);
                }
              }

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

  const hasEvaluatedQuotes = quotes.some((q) => q.technicalScore != null);
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

          {/* Price row — highlight lowest among qualified */}
          <View style={styles.compareRow}>
            <View style={styles.compareLabel}>
              <Text style={styles.compareLabelText}>Price</Text>
            </View>
            {(() => {
              const qualifiedPrices = comparison.quotes
                .filter((cq) => (cq.quote.technicalScore || 0) >= 70)
                .map((cq) => cq.quote.quotedPrice);
              const lowestQualifiedPrice = qualifiedPrices.length > 0 ? Math.min(...qualifiedPrices) : null;
              return comparison.quotes.map((cq) => {
                const isLowestQualified = lowestQualifiedPrice != null &&
                  cq.quote.quotedPrice === lowestQualifiedPrice &&
                  (cq.quote.technicalScore || 0) >= 70;
                return (
                  <View
                    key={cq.quote.id}
                    style={[styles.compareCell, isLowestQualified && styles.bestCell]}>
                    <Text style={styles.compareCellText}>
                      {cq.quote.currency} {cq.quote.quotedPrice.toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              });
            })()}
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

          {/* Overall Compliance row */}
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

          {/* Per-category compliance breakup rows */}
          {['Tech Req', 'Datasheet', 'Type Test', 'Routine', 'Site Req'].map((catLabel, idx) => {
            const catKeys = [
              { c: 'techComplied', wc: 'techCompliedWithComments', nc: 'techNotComplied' },
              { c: 'datasheetComplied', wc: 'datasheetCompliedWithComments', nc: 'datasheetNotComplied' },
              { c: 'typeTestComplied', wc: 'typeTestCompliedWithComments', nc: 'typeTestNotComplied' },
              { c: 'routineTestComplied', wc: 'routineTestCompliedWithComments', nc: 'routineTestNotComplied' },
              { c: 'siteReqComplied', wc: 'siteReqCompliedWithComments', nc: 'siteReqNotComplied' },
            ][idx];
            const hasData = comparison.quotes.some((cq) => {
              const q = cq.quote as unknown as Record<string, number | undefined>;
              return q[catKeys.c] !== undefined || q[catKeys.wc] !== undefined || q[catKeys.nc] !== undefined;
            });
            if (!hasData) return null;
            return (
              <View key={catLabel} style={styles.compareRow}>
                <View style={styles.compareLabel}>
                  <Text style={styles.compareLabelText}>{catLabel}</Text>
                </View>
                {comparison.quotes.map((cq) => {
                  const q = cq.quote as unknown as Record<string, number | undefined>;
                  const c = q[catKeys.c] || 0;
                  const wc = q[catKeys.wc] || 0;
                  const nc = q[catKeys.nc] || 0;
                  const total = c + wc + nc;
                  const pct = total > 0 ? Math.round((c + wc) / total * 100) : 0;
                  return (
                    <View key={cq.quote.id} style={styles.compareCell}>
                      <Text style={styles.compareCellText}>{total > 0 ? `${pct}%` : '-'}</Text>
                      {total > 0 && (
                        <Text style={[styles.compareCellText, { fontSize: 9, color: '#999' }]}>
                          {c}/{wc}/{nc}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}

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

          {/* Qualification row */}
          {hasEvaluatedQuotes && (
            <View style={styles.compareRow}>
              <View style={styles.compareLabel}>
                <Text style={styles.compareLabelText}>Qualification</Text>
              </View>
              {comparison.quotes.map((cq) => {
                const qualified = (cq.quote.technicalScore || 0) >= 70;
                return (
                  <View
                    key={cq.quote.id}
                    style={[styles.compareCell, qualified && cq.quote.rank === 1 && styles.bestCell]}>
                    <Text style={[styles.compareCellText, styles.boldText, { color: qualified ? '#2E7D32' : '#C62828' }]}>
                      {qualified ? 'Qualified' : 'Disqualified'}
                    </Text>
                  </View>
                );
              })}
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
              {...flatListProps}
              data={quotes}
              renderItem={({ item }) => (
                <VendorQuoteCard
                  quote={item}
                  onEvaluate={handleEvaluate}
                  onShortlist={handleShortlist}
                  onReject={handleReject}
                />
              )}
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
              buttonColor={COLORS.SUCCESS}>
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
        isSubmitting={isAddingQuote}
      />

      <EvaluateQuoteDialog
        visible={evaluateDialogVisible}
        onDismiss={() => {
          setEvaluateDialogVisible(false);
          setSelectedQuote(null);
        }}
        onSubmit={handleSubmitEvaluation}
        quote={selectedQuote}
        isSubmitting={isEvaluating}
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
    backgroundColor: COLORS.SUCCESS_BG,
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
    color: COLORS.SUCCESS,
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
