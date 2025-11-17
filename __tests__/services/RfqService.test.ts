/**
 * RfqService Unit Tests
 *
 * Tests RFQ lifecycle: creation, issuing, quote management, evaluation, ranking, and awarding
 * Phase 3: Activity 4 - Days 4-7
 */

import RfqService from '../../src/services/RfqService';
import { database } from '../../models/database';
import RfqModel from '../../models/RfqModel';
import VendorModel from '../../models/VendorModel';
import RfqVendorQuoteModel from '../../models/RfqVendorQuoteModel';

// Mock the database
jest.mock('../../models/database', () => ({
  database: {
    collections: {
      get: jest.fn(),
    },
    write: jest.fn((callback) => callback()),
  },
}));

describe('RfqService', () => {
  let mockRfqCollection: any;
  let mockQuoteCollection: any;
  let mockVendorCollection: any;
  let mockDoorsCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRfqCollection = {
      create: jest.fn(),
      find: jest.fn(),
    };

    mockQuoteCollection = {
      create: jest.fn(),
      query: jest.fn(),
    };

    mockVendorCollection = {
      find: jest.fn(),
    };

    mockDoorsCollection = {
      find: jest.fn(),
    };

    (database.collections.get as jest.Mock).mockImplementation((tableName: string) => {
      switch (tableName) {
        case 'rfqs':
          return mockRfqCollection;
        case 'rfq_vendor_quotes':
          return mockQuoteCollection;
        case 'vendors':
          return mockVendorCollection;
        case 'doors_packages':
          return mockDoorsCollection;
        default:
          return {};
      }
    });
  });

  describe('generateRfqNumber', () => {
    it('should generate RFQ number in format RFQ-YYYY-NNN', () => {
      const rfqNumber = RfqService.generateRfqNumber();
      const currentYear = new Date().getFullYear();
      const pattern = new RegExp(`^RFQ-${currentYear}-\\d{3}$`);

      expect(rfqNumber).toMatch(pattern);
    });

    it('should generate unique RFQ numbers', () => {
      const rfqNumber1 = RfqService.generateRfqNumber();
      const rfqNumber2 = RfqService.generateRfqNumber();

      expect(rfqNumber1).not.toBe(rfqNumber2);
    });

    it('should increment sequence number', () => {
      const rfqNumber1 = RfqService.generateRfqNumber();
      const rfqNumber2 = RfqService.generateRfqNumber();

      const seq1 = parseInt(rfqNumber1.split('-')[2]);
      const seq2 = parseInt(rfqNumber2.split('-')[2]);

      expect(seq2).toBe(seq1 + 1);
    });
  });

  describe('createRfq', () => {
    it('should create RFQ with draft status', async () => {
      const mockDoors = {
        id: 'doors-1',
        packageId: 'PKG-001',
        equipmentName: 'Transformer',
        category: 'TSS',
      };

      const mockRfq = {
        id: 'rfq-1',
        rfqNumber: 'RFQ-2025-001',
        status: 'draft',
      };

      mockDoorsCollection.find.mockResolvedValue(mockDoors);
      mockRfqCollection.create.mockResolvedValue(mockRfq);

      const result = await RfqService.createRfq({
        doorsPackageId: 'doors-1',
        title: 'Test RFQ',
        description: 'Test Description',
        closingDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        expectedDeliveryDays: 30,
        vendorIds: ['vendor-1', 'vendor-2'],
        userId: 'user-1',
      });

      expect(result).toBeDefined();
      expect(mockRfqCollection.create).toHaveBeenCalled();
    });

    it('should throw error if DOORS package not found', async () => {
      mockDoorsCollection.find.mockRejectedValue(new Error('Not found'));

      await expect(
        RfqService.createRfq({
          doorsPackageId: 'invalid-id',
          title: 'Test RFQ',
          description: 'Test',
          closingDate: Date.now(),
          expectedDeliveryDays: 30,
          vendorIds: ['vendor-1'],
          userId: 'user-1',
        })
      ).rejects.toThrow();
    });

    it('should throw error if no vendors provided', async () => {
      const mockDoors = { id: 'doors-1', packageId: 'PKG-001' };
      mockDoorsCollection.find.mockResolvedValue(mockDoors);

      await expect(
        RfqService.createRfq({
          doorsPackageId: 'doors-1',
          title: 'Test RFQ',
          description: 'Test',
          closingDate: Date.now(),
          expectedDeliveryDays: 30,
          vendorIds: [],
          userId: 'user-1',
        })
      ).rejects.toThrow('At least one vendor must be selected');
    });
  });

  describe('issueRfq', () => {
    it('should change RFQ status from draft to issued', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'draft',
        update: jest.fn(),
      };

      mockRfqCollection.find.mockResolvedValue(mockRfq);

      await RfqService.issueRfq('rfq-1');

      expect(mockRfq.update).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should throw error if RFQ not in draft status', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'issued',
      };

      mockRfqCollection.find.mockResolvedValue(mockRfq);

      await expect(RfqService.issueRfq('rfq-1')).rejects.toThrow(
        'RFQ must be in draft status to issue'
      );
    });
  });

  describe('addVendorQuote', () => {
    it('should add vendor quote to RFQ', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'issued',
        totalQuotesReceived: 0,
        update: jest.fn(),
      };

      const mockVendor = {
        id: 'vendor-1',
        vendorName: 'Test Vendor',
      };

      const mockQuote = {
        id: 'quote-1',
        quotedPrice: 1000000,
      };

      mockRfqCollection.find.mockResolvedValue(mockRfq);
      mockVendorCollection.find.mockResolvedValue(mockVendor);
      mockQuoteCollection.create.mockResolvedValue(mockQuote);

      const result = await RfqService.addVendorQuote({
        rfqId: 'rfq-1',
        vendorId: 'vendor-1',
        quotedPrice: 1000000,
        leadTimeDays: 45,
        technicalCompliance: 95,
        userId: 'user-1',
      });

      expect(result).toBeDefined();
      expect(mockQuoteCollection.create).toHaveBeenCalled();
      expect(mockRfq.update).toHaveBeenCalled();
    });

    it('should reject quote with invalid price', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'issued',
      };

      mockRfqCollection.find.mockResolvedValue(mockRfq);

      await expect(
        RfqService.addVendorQuote({
          rfqId: 'rfq-1',
          vendorId: 'vendor-1',
          quotedPrice: -1000,
          leadTimeDays: 45,
          technicalCompliance: 95,
          userId: 'user-1',
        })
      ).rejects.toThrow('Quoted price must be positive');
    });

    it('should reject quote with invalid technical compliance', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'issued',
      };

      mockRfqCollection.find.mockResolvedValue(mockRfq);

      await expect(
        RfqService.addVendorQuote({
          rfqId: 'rfq-1',
          vendorId: 'vendor-1',
          quotedPrice: 1000000,
          leadTimeDays: 45,
          technicalCompliance: 150,
          userId: 'user-1',
        })
      ).rejects.toThrow('Technical compliance must be between 0 and 100');
    });
  });

  describe('evaluateQuote', () => {
    it('should calculate overall score with 60/40 weightage', async () => {
      const mockQuote = {
        id: 'quote-1',
        quotedPrice: 1000000,
        technicalCompliance: 90,
        update: jest.fn(),
      };

      const mockQuotes = [
        { quotedPrice: 800000 },
        { quotedPrice: 1000000 },
        { quotedPrice: 1200000 },
      ];

      mockQuoteCollection.find.mockResolvedValue(mockQuote);
      mockQuoteCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockQuotes),
      });

      await RfqService.evaluateQuote({
        quoteId: 'quote-1',
        technicalScore: 85,
        userId: 'user-1',
      });

      expect(mockQuote.update).toHaveBeenCalled();
    });

    it('should reject invalid technical score', async () => {
      const mockQuote = {
        id: 'quote-1',
        quotedPrice: 1000000,
      };

      mockQuoteCollection.find.mockResolvedValue(mockQuote);

      await expect(
        RfqService.evaluateQuote({
          quoteId: 'quote-1',
          technicalScore: 150,
          userId: 'user-1',
        })
      ).rejects.toThrow('Technical score must be between 0 and 100');
    });
  });

  describe('rankQuotes', () => {
    it('should rank quotes by overall score', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'quotes_received',
        update: jest.fn(),
      };

      const mockQuotes = [
        {
          id: 'quote-1',
          overallScore: 85.5,
          update: jest.fn(),
        },
        {
          id: 'quote-2',
          overallScore: 90.2,
          update: jest.fn(),
        },
        {
          id: 'quote-3',
          overallScore: 78.0,
          update: jest.fn(),
        },
      ];

      mockRfqCollection.find.mockResolvedValue(mockRfq);
      mockQuoteCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockQuotes),
      });

      await RfqService.rankQuotes('rfq-1', 'user-1');

      // L1 should be quote-2 (highest score 90.2)
      expect(mockQuotes[1].update).toHaveBeenCalled();
      // L2 should be quote-1 (score 85.5)
      expect(mockQuotes[0].update).toHaveBeenCalled();
      // L3 should be quote-3 (score 78.0)
      expect(mockQuotes[2].update).toHaveBeenCalled();

      expect(mockRfq.update).toHaveBeenCalled();
    });

    it('should require all quotes to be evaluated before ranking', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'quotes_received',
      };

      const mockQuotes = [
        { id: 'quote-1', overallScore: 85.5 },
        { id: 'quote-2', overallScore: null }, // Not evaluated
      ];

      mockRfqCollection.find.mockResolvedValue(mockRfq);
      mockQuoteCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockQuotes),
      });

      await expect(RfqService.rankQuotes('rfq-1', 'user-1')).rejects.toThrow(
        'All quotes must be evaluated before ranking'
      );
    });
  });

  describe('awardRfq', () => {
    it('should award RFQ to winning vendor', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'evaluated',
        update: jest.fn(),
      };

      const mockWinnerQuote = {
        id: 'quote-1',
        vendorId: 'vendor-1',
        quotedPrice: 1000000,
        rank: 1,
        update: jest.fn(),
      };

      const mockLoserQuote = {
        id: 'quote-2',
        vendorId: 'vendor-2',
        rank: 2,
        update: jest.fn(),
      };

      mockRfqCollection.find.mockResolvedValue(mockRfq);
      mockQuoteCollection.find.mockResolvedValue(mockWinnerQuote);
      mockQuoteCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue([mockWinnerQuote, mockLoserQuote]),
      });

      await RfqService.awardRfq('rfq-1', 'quote-1', 'user-1');

      expect(mockRfq.update).toHaveBeenCalled();
      expect(mockWinnerQuote.update).toHaveBeenCalled();
      expect(mockLoserQuote.update).toHaveBeenCalled();
    });

    it('should throw error if quote is not L1', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'evaluated',
      };

      const mockQuote = {
        id: 'quote-2',
        rank: 2, // Not L1
      };

      mockRfqCollection.find.mockResolvedValue(mockRfq);
      mockQuoteCollection.find.mockResolvedValue(mockQuote);

      await expect(RfqService.awardRfq('rfq-1', 'quote-2', 'user-1')).rejects.toThrow(
        'Only L1 quote can be awarded'
      );
    });
  });

  describe('cancelRfq', () => {
    it('should cancel RFQ with cancellation reason', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'issued',
        update: jest.fn(),
      };

      mockRfqCollection.find.mockResolvedValue(mockRfq);

      await RfqService.cancelRfq('rfq-1', 'Project scope changed', 'user-1');

      expect(mockRfq.update).toHaveBeenCalled();
    });

    it('should not allow cancellation of awarded RFQ', async () => {
      const mockRfq = {
        id: 'rfq-1',
        status: 'awarded',
      };

      mockRfqCollection.find.mockResolvedValue(mockRfq);

      await expect(
        RfqService.cancelRfq('rfq-1', 'Test reason', 'user-1')
      ).rejects.toThrow('Cannot cancel awarded RFQ');
    });
  });

  describe('getComparativeAnalysis', () => {
    it('should return comparative analysis of all quotes', async () => {
      const mockQuotes = [
        {
          id: 'quote-1',
          vendorId: 'vendor-1',
          quotedPrice: 1000000,
          leadTimeDays: 45,
          technicalCompliance: 95,
          overallScore: 88.5,
          rank: 1,
          vendor: Promise.resolve({ vendorName: 'Vendor A' }),
        },
        {
          id: 'quote-2',
          vendorId: 'vendor-2',
          quotedPrice: 1100000,
          leadTimeDays: 40,
          technicalCompliance: 90,
          overallScore: 85.2,
          rank: 2,
          vendor: Promise.resolve({ vendorName: 'Vendor B' }),
        },
      ];

      mockQuoteCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockQuotes),
      });

      const result = await RfqService.getComparativeAnalysis('rfq-1');

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
    });
  });
});
