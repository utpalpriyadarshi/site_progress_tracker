import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import RfqModel from '../../models/RfqModel';
import RfqVendorQuoteModel from '../../models/RfqVendorQuoteModel';
import VendorModel from '../../models/VendorModel';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import DoorsRequirementModel from '../../models/DoorsRequirementModel';

/**
 * RfqService - Service for managing Request for Quotations (RFQs)
 *
 * Handles:
 * - RFQ creation from DOORS packages
 * - Vendor quote management
 * - Technical and commercial evaluation
 * - Quote ranking and award
 * - RFQ lifecycle management
 *
 * Phase 3: Activity 4 - Days 4-7
 */

export interface RfqCreateData {
  doorsPackageId: string;
  title?: string;
  description?: string;
  closingDate?: number;
  expectedDeliveryDays?: number;
  vendorIds: string[]; // Array of vendor IDs to invite
  technicalSpecifications?: any; // Will be JSON stringified
  commercialTerms?: any; // Will be JSON stringified
}

export interface VendorQuoteData {
  rfqId: string;
  vendorId: string;
  quoteReference?: string;
  quotedPrice: number;
  currency: string;
  leadTimeDays: number;
  validityDays: number;
  paymentTerms?: string;
  warrantyMonths?: number;
  technicalCompliancePercentage: number;
  technicalDeviations?: string[];
  commercialDeviations?: string[];
  notes?: string;
  attachments?: string[];
}

export interface QuoteEvaluationData {
  quoteId: string;
  technicalScore: number; // 0-100
  commercialScore: number; // 0-100
  technicalWeightage?: number; // default 60%
  commercialWeightage?: number; // default 40%
}

export interface RfqFilters {
  status?: string;
  projectId?: string;
  createdById?: string;
  dateFrom?: number;
  dateTo?: number;
  searchText?: string;
}

export interface RfqStatistics {
  totalRfqs: number;
  draftRfqs: number;
  issuedRfqs: number;
  evaluatedRfqs: number;
  awardedRfqs: number;
  averageQuotesPerRfq: number;
  averageEvaluationTime: number; // days
}

class RfqService {
  private rfqsCollection = database.collections.get<RfqModel>('rfqs');
  private quotesCollection = database.collections.get<RfqVendorQuoteModel>('rfq_vendor_quotes');
  private vendorsCollection = database.collections.get<VendorModel>('vendors');
  private doorsPackagesCollection = database.collections.get<DoorsPackageModel>('doors_packages');
  private doorsRequirementsCollection = database.collections.get<DoorsRequirementModel>('doors_requirements');

  /**
   * Create RFQ from DOORS package
   */
  async createRfq(data: RfqCreateData, userId: string): Promise<RfqModel> {
    // Fetch DOORS package
    const doorsPackage = await this.doorsPackagesCollection.find(data.doorsPackageId);

    // Generate RFQ number
    const rfqNumber = await this.generateRfqNumber();

    // Prepare title
    const title = data.title || `RFQ for ${doorsPackage.equipmentName}`;

    // Get requirements for technical specifications
    const requirements = await doorsPackage.requirements.fetch();
    const techSpecs = data.technicalSpecifications || this.extractTechnicalSpecifications(requirements);

    const rfq = await database.write(async () => {
      return await this.rfqsCollection.create((record) => {
        record.rfqNumber = rfqNumber;
        record.doorsId = doorsPackage.doorsId;
        record.doorsPackageId = doorsPackage.id;
        record.projectId = doorsPackage.projectId;
        record.title = title;
        record.description = data.description || `RFQ for ${doorsPackage.equipmentName} (${doorsPackage.quantity} ${doorsPackage.unit})`;
        record.status = 'draft';
        record.closingDate = data.closingDate;
        record.expectedDeliveryDays = data.expectedDeliveryDays || 60;
        record.technicalSpecifications = JSON.stringify(techSpecs);
        record.commercialTerms = JSON.stringify(data.commercialTerms || {});
        record.totalVendorsInvited = data.vendorIds.length;
        record.totalQuotesReceived = 0;
        record.createdById = userId;
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
    });

    return rfq;
  }

  /**
   * Issue RFQ to vendors (change status from draft to issued)
   */
  async issueRfq(rfqId: string): Promise<RfqModel> {
    const rfq = await this.rfqsCollection.find(rfqId);

    if (rfq.status !== 'draft') {
      throw new Error(`Cannot issue RFQ with status: ${rfq.status}`);
    }

    if (rfq.totalVendorsInvited === 0) {
      throw new Error('Cannot issue RFQ without inviting vendors');
    }

    return await database.write(async () => {
      return await rfq.update((record) => {
        record.status = 'issued';
        record.issueDate = Date.now();
        record.version = record.version + 1;
      });
    });
  }

  /**
   * Add vendor quote to RFQ
   */
  async addVendorQuote(data: VendorQuoteData): Promise<RfqVendorQuoteModel> {
    const rfq = await this.rfqsCollection.find(data.rfqId);

    if (!['issued', 'quotes_received'].includes(rfq.status)) {
      throw new Error(`Cannot add quotes to RFQ with status: ${rfq.status}`);
    }

    // Check if closing date has passed
    if (rfq.closingDate && Date.now() > rfq.closingDate) {
      throw new Error('RFQ closing date has passed');
    }

    const quote = await database.write(async () => {
      return await this.quotesCollection.create((record) => {
        record.rfqId = data.rfqId;
        record.vendorId = data.vendorId;
        record.quoteReference = data.quoteReference;
        record.quotedPrice = data.quotedPrice;
        record.currency = data.currency;
        record.leadTimeDays = data.leadTimeDays;
        record.validityDays = data.validityDays;
        record.paymentTerms = data.paymentTerms;
        record.warrantyMonths = data.warrantyMonths;
        record.technicalCompliancePercentage = data.technicalCompliancePercentage;
        record.technicalDeviations = JSON.stringify(data.technicalDeviations || []);
        record.commercialDeviations = JSON.stringify(data.commercialDeviations || []);
        record.notes = data.notes;
        record.attachments = JSON.stringify(data.attachments || []);
        record.status = 'submitted';
        record.submittedAt = Date.now();
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
    });

    // Update RFQ status and quote count
    await database.write(async () => {
      await rfq.update((record) => {
        record.totalQuotesReceived = record.totalQuotesReceived + 1;
        if (record.status === 'issued') {
          record.status = 'quotes_received';
        }
        record.version = record.version + 1;
      });
    });

    return quote;
  }

  /**
   * Evaluate vendor quote (assign scores)
   */
  async evaluateQuote(
    evaluation: QuoteEvaluationData,
    userId: string
  ): Promise<RfqVendorQuoteModel> {
    const quote = await this.quotesCollection.find(evaluation.quoteId);

    // IR L1 method: overallScore = technicalScore (commercial score not used in ranking)
    return await database.write(async () => {
      return await quote.update((record) => {
        record.technicalScore = evaluation.technicalScore;
        record.commercialScore = evaluation.commercialScore;
        record.overallScore = evaluation.technicalScore;
        record.status = 'under_review';
        record.evaluatedAt = Date.now();
        record.evaluatedById = userId;
        record.version = record.version + 1;
      });
    });
  }

  /**
   * Rank all quotes for an RFQ using Indian Railway L1 method:
   * 1. Technical score >= 70 to qualify
   * 2. Among qualified, L1 = lowest quoted price
   * 3. Tie-break: higher technical score wins
   */
  async rankQuotes(rfqId: string): Promise<void> {
    const allQuotes = await this.quotesCollection
      .query(Q.where('rfq_id', rfqId), Q.where('technical_score', Q.notEq(null)))
      .fetch();

    // Separate qualified (tech >= 70) and disqualified
    const qualified = allQuotes.filter((q) => (q.technicalScore || 0) >= 70);
    const disqualified = allQuotes.filter((q) => (q.technicalScore || 0) < 70);

    // Sort qualified by price ASC, then tech score DESC for tie-break
    const sortedQualified = qualified.sort((a, b) => {
      if (a.quotedPrice !== b.quotedPrice) return a.quotedPrice - b.quotedPrice;
      return (b.technicalScore || 0) - (a.technicalScore || 0);
    });

    await database.write(async () => {
      // Assign ranks to qualified vendors
      for (let i = 0; i < sortedQualified.length; i++) {
        await sortedQualified[i].update((record) => {
          record.rank = i + 1; // L1, L2, L3...
          if (i === 0) {
            record.status = 'shortlisted'; // L1 vendor
          }
        });
      }

      // Disqualified vendors get no rank, stay under_review
      for (const q of disqualified) {
        await q.update((record) => {
          record.rank = null as any;
        });
      }
    });

    // Update RFQ status to evaluated
    const rfq = await this.rfqsCollection.find(rfqId);
    await database.write(async () => {
      await rfq.update((record) => {
        record.status = 'evaluated';
        record.evaluationDate = Date.now();
      });
    });
  }

  /**
   * Award RFQ to winning vendor
   */
  async awardRfq(
    rfqId: string,
    winningQuoteId: string,
    awardedValue: number,
    userId: string
  ): Promise<RfqModel> {
    const rfq = await this.rfqsCollection.find(rfqId);
    const winningQuote = await this.quotesCollection.find(winningQuoteId);

    if (rfq.status !== 'evaluated') {
      throw new Error('RFQ must be evaluated before awarding');
    }

    // Award winning quote, reject others, and update RFQ in a single transaction
    const allQuotes = await this.quotesCollection.query(Q.where('rfq_id', rfqId)).fetch();

    return await database.write(async () => {
      // Award the winning quote
      await winningQuote.update((record) => {
        record.status = 'awarded';
      });

      // Reject other quotes
      for (const quote of allQuotes) {
        if (quote.id !== winningQuoteId && quote.status !== 'awarded') {
          await quote.update((record) => {
            record.status = 'rejected';
          });
        }
      }

      // Update RFQ with award details
      return await rfq.update((record) => {
        record.status = 'awarded';
        record.winningVendorId = winningQuote.vendorId;
        record.winningQuoteId = winningQuoteId;
        record.awardedValue = awardedValue;
        record.awardDate = Date.now();
        record.evaluatedById = userId;
        record.version = record.version + 1;
      });
    });
  }

  /**
   * Cancel RFQ
   */
  async cancelRfq(rfqId: string, reason?: string): Promise<RfqModel> {
    const rfq = await this.rfqsCollection.find(rfqId);

    if (rfq.status === 'awarded') {
      throw new Error('Cannot cancel an awarded RFQ');
    }

    return await database.write(async () => {
      return await rfq.update((record) => {
        record.status = 'cancelled';
        record.description = `${record.description}\n\nCancellation Reason: ${reason || 'Not specified'}`;
        record.version = record.version + 1;
      });
    });
  }

  /**
   * Get RFQs with filters
   */
  async getRfqs(filters?: RfqFilters): Promise<RfqModel[]> {
    let query = this.rfqsCollection.query();
    const conditions: any[] = [];

    if (filters?.status) {
      conditions.push(Q.where('status', filters.status));
    }

    if (filters?.projectId) {
      conditions.push(Q.where('project_id', filters.projectId));
    }

    if (filters?.createdById) {
      conditions.push(Q.where('created_by_id', filters.createdById));
    }

    if (filters?.dateFrom) {
      conditions.push(Q.where('created_at', Q.gte(filters.dateFrom)));
    }

    if (filters?.dateTo) {
      conditions.push(Q.where('created_at', Q.lte(filters.dateTo)));
    }

    if (filters?.searchText) {
      conditions.push(
        Q.or(
          Q.where('rfq_number', Q.like(`%${Q.sanitizeLikeString(filters.searchText)}%`)),
          Q.where('title', Q.like(`%${Q.sanitizeLikeString(filters.searchText)}%`))
        )
      );
    }

    if (conditions.length > 0) {
      query = this.rfqsCollection.query(...conditions);
    }

    return await query.fetch();
  }

  /**
   * Get vendor quotes for an RFQ
   */
  async getQuotesForRfq(rfqId: string): Promise<RfqVendorQuoteModel[]> {
    return await this.quotesCollection.query(Q.where('rfq_id', rfqId)).fetch();
  }

  /**
   * Get RFQ statistics
   */
  async getRfqStatistics(projectId?: string): Promise<RfqStatistics> {
    const conditions: any[] = [];
    if (projectId) {
      conditions.push(Q.where('project_id', projectId));
    }

    const allRfqs = await this.rfqsCollection.query(...conditions).fetch();

    const draftRfqs = allRfqs.filter((r) => r.status === 'draft').length;
    const issuedRfqs = allRfqs.filter((r) => r.status === 'issued').length;
    const evaluatedRfqs = allRfqs.filter((r) => r.status === 'evaluated').length;
    const awardedRfqs = allRfqs.filter((r) => r.status === 'awarded').length;

    const totalQuotes = allRfqs.reduce((sum, rfq) => sum + rfq.totalQuotesReceived, 0);
    const avgQuotesPerRfq = allRfqs.length > 0 ? totalQuotes / allRfqs.length : 0;

    // Calculate average evaluation time
    const evaluatedRfqsWithDates = allRfqs.filter((r) => r.evaluationDate && r.issueDate);
    const totalEvalTime = evaluatedRfqsWithDates.reduce((sum, rfq) => {
      const days = (rfq.evaluationDate! - rfq.issueDate!) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    const avgEvaluationTime =
      evaluatedRfqsWithDates.length > 0 ? totalEvalTime / evaluatedRfqsWithDates.length : 0;

    return {
      totalRfqs: allRfqs.length,
      draftRfqs,
      issuedRfqs,
      evaluatedRfqs,
      awardedRfqs,
      averageQuotesPerRfq: Math.round(avgQuotesPerRfq * 10) / 10,
      averageEvaluationTime: Math.round(avgEvaluationTime * 10) / 10,
    };
  }

  /**
   * Generate unique RFQ number
   */
  private async generateRfqNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const allRfqs = await this.rfqsCollection.query().fetch();
    const count = allRfqs.length + 1;
    return `RFQ-${year}-${String(count).padStart(4, '0')}`;
  }

  /**
   * Extract technical specifications from DOORS requirements
   */
  private extractTechnicalSpecifications(requirements: DoorsRequirementModel[]): any {
    const categorySet = new Set<string>();
    requirements.forEach((r) => categorySet.add(r.category));
    const categories = Array.from(categorySet);

    return {
      totalRequirements: requirements.length,
      mandatoryRequirements: requirements.filter((r) => r.isMandatory).length,
      categories,
      requirementCodes: requirements.map((r) => r.requirementCode),
      complianceThreshold: 90, // Minimum compliance percentage required
    };
  }

  /**
   * Get comparative analysis of all quotes for an RFQ
   */
  async getComparativeAnalysis(rfqId: string): Promise<{
    quotes: Array<{
      quote: RfqVendorQuoteModel;
      vendor: VendorModel;
      priceRank: number;
      leadTimeRank: number;
      complianceRank: number;
    }>;
    lowestPrice: number;
    fastestDelivery: number;
    highestCompliance: number;
  }> {
    const quotes = await this.quotesCollection.query(Q.where('rfq_id', rfqId)).fetch();

    // Get all vendors
    const vendorIds = quotes.map((q) => q.vendorId);
    const vendors = await this.vendorsCollection.query(Q.where('id', Q.oneOf(vendorIds))).fetch();
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    // Sort for rankings
    const sortedByPrice = [...quotes].sort((a, b) => a.quotedPrice - b.quotedPrice);
    const sortedByLeadTime = [...quotes].sort((a, b) => a.leadTimeDays - b.leadTimeDays);
    const sortedByCompliance = [...quotes].sort(
      (a, b) => b.technicalCompliancePercentage - a.technicalCompliancePercentage
    );

    const analysis = quotes.map((quote) => ({
      quote,
      vendor: vendorMap.get(quote.vendorId)!,
      priceRank: sortedByPrice.findIndex((q) => q.id === quote.id) + 1,
      leadTimeRank: sortedByLeadTime.findIndex((q) => q.id === quote.id) + 1,
      complianceRank: sortedByCompliance.findIndex((q) => q.id === quote.id) + 1,
    }));

    return {
      quotes: analysis,
      lowestPrice: sortedByPrice[0]?.quotedPrice || 0,
      fastestDelivery: sortedByLeadTime[0]?.leadTimeDays || 0,
      highestCompliance: sortedByCompliance[0]?.technicalCompliancePercentage || 0,
    };
  }
}

export default new RfqService();
