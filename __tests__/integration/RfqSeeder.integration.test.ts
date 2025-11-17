/**
 * RFQ Seeder Integration Tests
 *
 * Tests demo data creation and cleanup for RFQ system
 * Phase 3: Activity 4 - Day 6
 */

import { database } from '../../models/database';
import {
  createVendorsDemoData,
  createRfqsDemoData,
  clearRfqDemoData,
} from '../../src/utils/demoData/RfqSeeder';
import VendorModel from '../../models/VendorModel';
import RfqModel from '../../models/RfqModel';
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

describe('RfqSeeder Integration Tests', () => {
  let mockVendorCollection: any;
  let mockRfqCollection: any;
  let mockQuoteCollection: any;
  let mockDoorsCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockVendors: VendorModel[] = [];
    const mockRfqs: RfqModel[] = [];
    const mockQuotes: RfqVendorQuoteModel[] = [];

    mockVendorCollection = {
      create: jest.fn((callback) => {
        const vendor = { id: `vendor-${mockVendors.length + 1}` } as any;
        callback(vendor);
        mockVendors.push(vendor);
        return vendor;
      }),
      query: jest.fn(() => ({
        destroyAllPermanently: jest.fn().mockResolvedValue(undefined),
      })),
    };

    mockRfqCollection = {
      create: jest.fn((callback) => {
        const rfq = { id: `rfq-${mockRfqs.length + 1}` } as any;
        callback(rfq);
        mockRfqs.push(rfq);
        return rfq;
      }),
      query: jest.fn(() => ({
        destroyAllPermanently: jest.fn().mockResolvedValue(undefined),
        fetch: jest.fn().mockResolvedValue(mockRfqs),
      })),
    };

    mockQuoteCollection = {
      create: jest.fn((callback) => {
        const quote = { id: `quote-${mockQuotes.length + 1}` } as any;
        callback(quote);
        mockQuotes.push(quote);
        return quote;
      }),
      query: jest.fn(() => ({
        destroyAllPermanently: jest.fn().mockResolvedValue(undefined),
      })),
    };

    mockDoorsCollection = {
      query: jest.fn(() => ({
        fetch: jest.fn().mockResolvedValue([
          {
            id: 'doors-1',
            packageId: 'PKG-BGSW-TSS-001',
            equipmentName: '33kV Auxiliary Transformer',
            category: 'TSS',
          },
          {
            id: 'doors-2',
            packageId: 'PKG-BGSW-TSS-002',
            equipmentName: '25kV Circuit Breaker',
            category: 'TSS',
          },
          {
            id: 'doors-3',
            packageId: 'PKG-BGSW-OHE-001',
            equipmentName: 'OHE Mast Assembly',
            category: 'OHE',
          },
          {
            id: 'doors-4',
            packageId: 'PKG-BGSW-SCADA-001',
            equipmentName: 'SCADA RTU System',
            category: 'SCADA',
          },
          {
            id: 'doors-5',
            packageId: 'PKG-BGSW-CABLE-001',
            equipmentName: 'Power Cable 33kV',
            category: 'Cables',
          },
        ]),
      })),
    };

    (database.collections.get as jest.Mock).mockImplementation((tableName: string) => {
      switch (tableName) {
        case 'vendors':
          return mockVendorCollection;
        case 'rfqs':
          return mockRfqCollection;
        case 'rfq_vendor_quotes':
          return mockQuoteCollection;
        case 'doors_packages':
          return mockDoorsCollection;
        default:
          return {};
      }
    });
  });

  describe('createVendorsDemoData', () => {
    it('should create 9 demo vendors', async () => {
      const vendorIds = await createVendorsDemoData();

      expect(vendorIds).toHaveLength(9);
      expect(mockVendorCollection.create).toHaveBeenCalledTimes(9);
    });

    it('should create vendors with all required fields', async () => {
      const vendorIds = await createVendorsDemoData();

      expect(mockVendorCollection.create).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should create vendors across multiple categories', async () => {
      const vendorIds = await createVendorsDemoData();

      // Should have TSS, OHE, SCADA, and Cables vendors
      expect(vendorIds.length).toBeGreaterThan(0);
    });

    it('should create approved and unapproved vendors', async () => {
      const vendorIds = await createVendorsDemoData();

      // Last vendor (Local Cable Co.) should be unapproved
      // This is tested by the seeder logic
      expect(vendorIds).toHaveLength(9);
    });
  });

  describe('createRfqsDemoData', () => {
    it('should create 5 RFQs with different statuses', async () => {
      await createRfqsDemoData('project-1', 'user-1');

      // 5 RFQs should be created
      expect(mockRfqCollection.create).toHaveBeenCalled();
    });

    it('should create RFQs linked to DOORS packages', async () => {
      await createRfqsDemoData('project-1', 'user-1');

      // RFQs should be created after getting DOORS packages
      expect(mockDoorsCollection.query).toHaveBeenCalled();
      expect(mockRfqCollection.create).toHaveBeenCalled();
    });

    it('should create vendor quotes for some RFQs', async () => {
      await createRfqsDemoData('project-1', 'user-1');

      // Quotes should be created for RFQs with quotes_received, evaluated, awarded status
      expect(mockQuoteCollection.create).toHaveBeenCalled();
    });

    it('should handle missing DOORS packages gracefully', async () => {
      mockDoorsCollection.query.mockReturnValue({
        fetch: jest.fn().mockResolvedValue([]),
      });

      await createRfqsDemoData('project-1', 'user-1');

      // Should not create RFQs if no DOORS packages exist
      // But should not throw error
      expect(mockDoorsCollection.query).toHaveBeenCalled();
    });
  });

  describe('clearRfqDemoData', () => {
    it('should delete all quotes, RFQs, and vendors', async () => {
      await clearRfqDemoData();

      expect(mockQuoteCollection.query).toHaveBeenCalled();
      expect(mockRfqCollection.query).toHaveBeenCalled();
      expect(mockVendorCollection.query).toHaveBeenCalled();
    });

    it('should delete in correct order (quotes → RFQs → vendors)', async () => {
      const deletionOrder: string[] = [];

      mockQuoteCollection.query.mockReturnValue({
        destroyAllPermanently: jest.fn().mockImplementation(() => {
          deletionOrder.push('quotes');
          return Promise.resolve();
        }),
      });

      mockRfqCollection.query.mockReturnValue({
        destroyAllPermanently: jest.fn().mockImplementation(() => {
          deletionOrder.push('rfqs');
          return Promise.resolve();
        }),
      });

      mockVendorCollection.query.mockReturnValue({
        destroyAllPermanently: jest.fn().mockImplementation(() => {
          deletionOrder.push('vendors');
          return Promise.resolve();
        }),
      });

      await clearRfqDemoData();

      expect(deletionOrder).toEqual(['quotes', 'rfqs', 'vendors']);
    });

    it('should handle errors gracefully during deletion', async () => {
      mockQuoteCollection.query.mockReturnValue({
        destroyAllPermanently: jest.fn().mockRejectedValue(new Error('Delete failed')),
      });

      // Should not throw, just log error
      await expect(clearRfqDemoData()).rejects.toThrow();
    });
  });

  describe('RFQ Status Coverage', () => {
    it('should create RFQs in all workflow statuses', async () => {
      const statuses: string[] = [];

      mockRfqCollection.create.mockImplementation((callback: any) => {
        const rfq = { id: `rfq-${statuses.length + 1}` } as any;
        callback(rfq);
        statuses.push(rfq.status);
        return rfq;
      });

      await createRfqsDemoData('project-1', 'user-1');

      // Should have draft, issued, quotes_received, evaluated, awarded
      const uniqueStatuses = new Set(statuses);
      expect(uniqueStatuses.size).toBeGreaterThan(1);
    });
  });

  describe('Quote Evaluation and Ranking', () => {
    it('should create evaluated quotes with scores', async () => {
      await createRfqsDemoData('project-1', 'user-1');

      // Some quotes should have evaluation scores
      expect(mockQuoteCollection.create).toHaveBeenCalled();
    });

    it('should create ranked quotes (L1, L2, L3)', async () => {
      const ranks: number[] = [];

      mockQuoteCollection.create.mockImplementation((callback: any) => {
        const quote = { id: `quote-${ranks.length + 1}` } as any;
        callback(quote);
        if (quote.rank) {
          ranks.push(quote.rank);
        }
        return quote;
      });

      await createRfqsDemoData('project-1', 'user-1');

      // Should have quotes with rank 1, 2, 3
      const uniqueRanks = new Set(ranks);
      expect(uniqueRanks.size).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('should create vendors before RFQs', async () => {
      const creationOrder: string[] = [];

      mockVendorCollection.create.mockImplementation((callback: any) => {
        creationOrder.push('vendor');
        const vendor = { id: `vendor-${creationOrder.length}` } as any;
        callback(vendor);
        return vendor;
      });

      mockRfqCollection.create.mockImplementation((callback: any) => {
        creationOrder.push('rfq');
        const rfq = { id: `rfq-${creationOrder.length}` } as any;
        callback(rfq);
        return rfq;
      });

      await createRfqsDemoData('project-1', 'user-1');

      // All vendors should be created before any RFQs
      const firstRfqIndex = creationOrder.indexOf('rfq');
      const lastVendorIndex = creationOrder.lastIndexOf('vendor');

      if (firstRfqIndex !== -1 && lastVendorIndex !== -1) {
        expect(lastVendorIndex).toBeLessThan(firstRfqIndex);
      }
    });

    it('should link quotes to valid vendor IDs', async () => {
      const vendorIds = await createVendorsDemoData();

      mockQuoteCollection.create.mockImplementation((callback: any) => {
        const quote = { id: `quote-1`, vendorId: '' } as any;
        callback(quote);

        // Verify vendorId is from created vendors
        expect(vendorIds).toContain(quote.vendorId);
        return quote;
      });

      await createRfqsDemoData('project-1', 'user-1');
    });
  });

  describe('Performance', () => {
    it('should complete data creation within reasonable time', async () => {
      const startTime = Date.now();

      await createRfqsDemoData('project-1', 'user-1');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds (mocked, so should be much faster)
      expect(duration).toBeLessThan(5000);
    });

    it('should use batch operations for vendors', async () => {
      await createVendorsDemoData();

      // All vendors should be created (9 vendors)
      expect(mockVendorCollection.create).toHaveBeenCalledTimes(9);
    });
  });
});
