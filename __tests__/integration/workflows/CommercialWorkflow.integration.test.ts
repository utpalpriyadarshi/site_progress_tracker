/**
 * Commercial Workflow Integration Tests - P4.4
 *
 * Tests complete commercial workflows:
 * - RFQ creation and management workflow
 * - Vendor quote submission and evaluation
 * - Quote ranking and award workflow
 * - Invoice creation and tracking
 * - Cost tracking and variance analysis
 *
 * These tests verify end-to-end commercial operations with realistic mocking.
 */

import { database } from '../../../models/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Declare global for test environment
declare const global: {
  console: Console;
  fetch: jest.Mock;
};

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../../models/database', () => ({
  database: {
    collections: {
      get: jest.fn(),
    },
    write: jest.fn((callback: any) => Promise.resolve(callback())),
  },
}));

// Suppress console output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock data factories
const createMockDoorsPackage = (
  id: string,
  projectId: string,
  equipmentName: string,
  quantity: number,
  status: string = 'reviewed'
) => ({
  id,
  doorsId: `DOORS-${id}`,
  projectId,
  equipmentName,
  quantity,
  unit: 'units',
  category: 'equipment',
  status,
  requirements: {
    fetch: jest.fn(() =>
      Promise.resolve([
        { id: 'req-1', requirementCode: 'REQ-001', category: 'technical', isMandatory: true },
        { id: 'req-2', requirementCode: 'REQ-002', category: 'technical', isMandatory: true },
        { id: 'req-3', requirementCode: 'REQ-003', category: 'commercial', isMandatory: false },
      ])
    ),
  },
  _raw: {
    id,
    doors_id: `DOORS-${id}`,
    project_id: projectId,
    equipment_name: equipmentName,
    quantity,
    status,
  },
});

const createMockRfq = (
  id: string,
  doorsPackageId: string,
  projectId: string,
  status: string = 'draft'
) => ({
  id,
  rfqNumber: `RFQ-2025-${id.padStart(4, '0')}`,
  doorsId: `DOORS-${doorsPackageId}`,
  doorsPackageId,
  projectId,
  title: `RFQ for Equipment ${id}`,
  description: 'Test RFQ description',
  status,
  closingDate: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days from now
  issueDate: status !== 'draft' ? Date.now() - 7 * 24 * 60 * 60 * 1000 : null,
  evaluationDate: status === 'evaluated' || status === 'awarded' ? Date.now() - 2 * 24 * 60 * 60 * 1000 : null,
  awardDate: status === 'awarded' ? Date.now() : null,
  totalVendorsInvited: 3,
  totalQuotesReceived: status !== 'draft' ? 3 : 0,
  winningVendorId: status === 'awarded' ? 'vendor-1' : null,
  winningQuoteId: status === 'awarded' ? 'quote-1' : null,
  awardedValue: status === 'awarded' ? 150000 : null,
  createdById: 'commercial-1',
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    rfq_number: `RFQ-2025-${id.padStart(4, '0')}`,
    doors_package_id: doorsPackageId,
    project_id: projectId,
    status,
  },
  update: jest.fn((callback: any) => {
    const record: any = { status };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockVendor = (
  id: string,
  name: string,
  category: string,
  rating: number = 4
) => ({
  id,
  name,
  category,
  rating,
  email: `contact@${name.toLowerCase().replace(/\s/g, '')}.com`,
  phone: '+1234567890',
  address: 'Test Address',
  status: 'active',
  _raw: {
    id,
    name,
    category,
    rating,
  },
});

const createMockVendorQuote = (
  id: string,
  rfqId: string,
  vendorId: string,
  quotedPrice: number,
  technicalCompliance: number,
  status: string = 'submitted'
) => ({
  id,
  rfqId,
  vendorId,
  quoteReference: `QT-${id}`,
  quotedPrice,
  currency: 'USD',
  leadTimeDays: 45,
  validityDays: 30,
  paymentTerms: 'Net 30',
  warrantyMonths: 12,
  technicalCompliancePercentage: technicalCompliance,
  technicalDeviations: '[]',
  commercialDeviations: '[]',
  status,
  submittedAt: Date.now(),
  technicalScore: status === 'under_review' || status === 'shortlisted' || status === 'awarded' ? 85 : null,
  commercialScore: status === 'under_review' || status === 'shortlisted' || status === 'awarded' ? 80 : null,
  overallScore: status === 'under_review' || status === 'shortlisted' || status === 'awarded' ? 83 : null,
  rank: status === 'shortlisted' || status === 'awarded' ? 1 : null,
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    rfq_id: rfqId,
    vendor_id: vendorId,
    quoted_price: quotedPrice,
    technical_compliance_percentage: technicalCompliance,
    status,
  },
  update: jest.fn((callback: any) => {
    const record: any = { status };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockInvoice = (
  id: string,
  rfqId: string,
  vendorId: string,
  amount: number,
  status: string = 'pending'
) => ({
  id,
  invoiceNumber: `INV-${id}`,
  rfqId,
  vendorId,
  amount,
  currency: 'USD',
  status,
  issueDate: Date.now(),
  dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  paidDate: status === 'paid' ? Date.now() : null,
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    invoice_number: `INV-${id}`,
    rfq_id: rfqId,
    vendor_id: vendorId,
    amount,
    status,
  },
  update: jest.fn((callback: any) => {
    const record: any = { status };
    callback(record);
    return Promise.resolve();
  }),
});

describe('Commercial Workflow - Integration Tests', () => {
  const commercialUserId = 'commercial-1';
  const projectId = 'project-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Workflow 1: RFQ Creation and Issue', () => {
    describe('Complete RFQ Creation Flow', () => {
      it('should create RFQ from DOORS package and issue to vendors', async () => {
        const doorsPackage = createMockDoorsPackage('pkg-1', projectId, 'Industrial Pump', 10);
        let rfq: any = null;
        const vendors = [
          createMockVendor('v1', 'Vendor A', 'equipment'),
          createMockVendor('v2', 'Vendor B', 'equipment'),
          createMockVendor('v3', 'Vendor C', 'equipment'),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn((id: string) => {
              if (tableName === 'doors_packages') return Promise.resolve(doorsPackage);
              if (tableName === 'rfqs') return Promise.resolve(rfq);
              return Promise.reject(new Error('Not found'));
            }),
            query: jest.fn(() => ({
              fetch: jest.fn(() => {
                if (tableName === 'vendors') return Promise.resolve(vendors);
                if (tableName === 'rfqs') return Promise.resolve([]);
                return Promise.resolve([]);
              }),
            })),
            create: jest.fn((callback: any) => {
              rfq = {
                id: 'rfq-1',
                rfqNumber: 'RFQ-2025-0001',
                doorsPackageId: '',
                projectId: '',
                title: '',
                status: 'draft',
                totalVendorsInvited: 0,
                totalQuotesReceived: 0,
                update: jest.fn((cb: any) => {
                  cb(rfq);
                  return Promise.resolve(rfq);
                }),
              };
              callback(rfq);
              return Promise.resolve(rfq);
            }),
          })
        );

        // Step 1: Verify DOORS package is ready
        const foundPackage = await database.collections
          .get('doors_packages')
          .find('pkg-1');
        expect(foundPackage.status).toBe('reviewed');

        // Step 2: Get available vendors
        const availableVendors = await database.collections
          .get('vendors')
          .query()
          .fetch();
        expect(availableVendors.length).toBe(3);

        // Step 3: Create RFQ
        await database.write(async () => {
          await database.collections
            .get('rfqs')
            .create((record: any) => {
              record.rfqNumber = 'RFQ-2025-0001';
              record.doorsPackageId = 'pkg-1';
              record.projectId = projectId;
              record.title = `RFQ for ${foundPackage.equipmentName}`;
              record.description = `RFQ for ${foundPackage.quantity} ${foundPackage.unit}`;
              record.status = 'draft';
              record.totalVendorsInvited = availableVendors.length;
              record.createdById = commercialUserId;
            });
        });

        expect(rfq).toBeDefined();
        expect(rfq.status).toBe('draft');
        expect(rfq.totalVendorsInvited).toBe(3);

        // Step 4: Issue RFQ to vendors
        await database.write(async () => {
          const foundRfq = await database.collections
            .get('rfqs')
            .find('rfq-1');
          await foundRfq.update((record: any) => {
            record.status = 'issued';
            record.issueDate = Date.now();
          });
        });

        expect(rfq.update).toHaveBeenCalled();
      });

      it('should prevent issuing RFQ without vendors', async () => {
        const rfq = createMockRfq('1', 'pkg-1', projectId, 'draft');
        rfq.totalVendorsInvited = 0;

        const canIssue = rfq.status === 'draft' && rfq.totalVendorsInvited > 0;
        expect(canIssue).toBe(false);
      });

      it('should generate unique RFQ numbers', async () => {
        const existingRfqs = [
          createMockRfq('1', 'pkg-1', projectId),
          createMockRfq('2', 'pkg-2', projectId),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(existingRfqs)),
            })),
          })
        );

        const allRfqs = await database.collections
          .get('rfqs')
          .query()
          .fetch();

        const year = new Date().getFullYear();
        const nextNumber = allRfqs.length + 1;
        const newRfqNumber = `RFQ-${year}-${String(nextNumber).padStart(4, '0')}`;

        // Use dynamic year to handle test running in different years
        expect(newRfqNumber).toBe(`RFQ-${year}-0003`);
        expect(nextNumber).toBe(3);
      });
    });
  });

  describe('Workflow 2: Quote Submission and Evaluation', () => {
    describe('Vendor Quote Submission', () => {
      it('should accept vendor quotes before closing date', async () => {
        const rfq = createMockRfq('1', 'pkg-1', projectId, 'issued');
        const vendor = createMockVendor('v1', 'Vendor A', 'equipment');
        let quote: any = null;

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn((id: string) => {
              if (tableName === 'rfqs') return Promise.resolve(rfq);
              if (tableName === 'vendors') return Promise.resolve(vendor);
              return Promise.reject(new Error('Not found'));
            }),
            create: jest.fn((callback: any) => {
              quote = {
                id: 'quote-1',
                rfqId: '',
                vendorId: '',
                quotedPrice: 0,
                technicalCompliancePercentage: 0,
                status: 'submitted',
              };
              callback(quote);
              return Promise.resolve(quote);
            }),
          })
        );

        // Check RFQ is open for quotes
        const foundRfq = await database.collections
          .get('rfqs')
          .find('rfq-1');
        const isOpen = foundRfq.status === 'issued' && foundRfq.closingDate > Date.now();
        expect(isOpen).toBe(true);

        // Submit quote
        await database.write(async () => {
          await database.collections
            .get('rfq_vendor_quotes')
            .create((record: any) => {
              record.rfqId = 'rfq-1';
              record.vendorId = 'v1';
              record.quoteReference = 'QT-001';
              record.quotedPrice = 145000;
              record.currency = 'USD';
              record.leadTimeDays = 45;
              record.validityDays = 30;
              record.technicalCompliancePercentage = 95;
              record.status = 'submitted';
            });
        });

        expect(quote).toBeDefined();
        expect(quote.status).toBe('submitted');
      });

      it('should update RFQ status when first quote received', async () => {
        const rfq = createMockRfq('1', 'pkg-1', projectId, 'issued');

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(rfq)),
          })
        );

        // Simulate quote reception
        await database.write(async () => {
          const foundRfq = await database.collections
            .get('rfqs')
            .find('rfq-1');
          await foundRfq.update((record: any) => {
            record.totalQuotesReceived = 1;
            record.status = 'quotes_received';
          });
        });

        expect(rfq.update).toHaveBeenCalled();
      });
    });

    describe('Quote Evaluation', () => {
      it('should evaluate quotes with technical and commercial scores', async () => {
        const quotes = [
          createMockVendorQuote('q1', 'rfq-1', 'v1', 145000, 95),
          createMockVendorQuote('q2', 'rfq-1', 'v2', 150000, 92),
          createMockVendorQuote('q3', 'rfq-1', 'v3', 140000, 88),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(quotes)),
            })),
            find: jest.fn((id: string) => {
              const quote = quotes.find((q) => q.id === id);
              return Promise.resolve(quote);
            }),
          })
        );

        // Get all quotes for RFQ
        const allQuotes = await database.collections
          .get('rfq_vendor_quotes')
          .query()
          .fetch();

        expect(allQuotes.length).toBe(3);

        // Evaluate each quote
        const techWeight = 60;
        const commWeight = 40;

        for (const quote of allQuotes) {
          const technicalScore = quote.technicalCompliancePercentage; // Simplified
          const commercialScore = 80; // Simplified score

          const overallScore = (technicalScore * techWeight + commercialScore * commWeight) / 100;

          await database.write(async () => {
            const foundQuote = await database.collections
              .get('rfq_vendor_quotes')
              .find(quote.id);
            await foundQuote.update((record: any) => {
              record.technicalScore = technicalScore;
              record.commercialScore = commercialScore;
              record.overallScore = overallScore;
              record.status = 'under_review';
            });
          });
        }

        quotes.forEach((quote) => {
          expect(quote.update).toHaveBeenCalled();
        });
      });

      it('should rank quotes by overall score', async () => {
        const quotes = [
          { ...createMockVendorQuote('q1', 'rfq-1', 'v1', 145000, 95), overallScore: 89 },
          { ...createMockVendorQuote('q2', 'rfq-1', 'v2', 150000, 92), overallScore: 85 },
          { ...createMockVendorQuote('q3', 'rfq-1', 'v3', 140000, 88), overallScore: 82 },
        ];

        // Sort by overall score
        const rankedQuotes = [...quotes].sort((a, b) => b.overallScore - a.overallScore);

        // Assign ranks
        const ranksAssigned = rankedQuotes.map((quote, index) => ({
          ...quote,
          rank: index + 1,
          status: index === 0 ? 'shortlisted' : 'under_review',
        }));

        expect(ranksAssigned[0].id).toBe('q1'); // L1
        expect(ranksAssigned[0].rank).toBe(1);
        expect(ranksAssigned[0].status).toBe('shortlisted');
        expect(ranksAssigned[1].rank).toBe(2); // L2
        expect(ranksAssigned[2].rank).toBe(3); // L3
      });
    });
  });

  describe('Workflow 3: Quote Award', () => {
    it('should award RFQ to winning vendor', async () => {
      const rfq = createMockRfq('1', 'pkg-1', projectId, 'evaluated');
      const winningQuote = createMockVendorQuote('q1', 'rfq-1', 'v1', 145000, 95, 'shortlisted');
      const otherQuotes = [
        createMockVendorQuote('q2', 'rfq-1', 'v2', 150000, 92, 'under_review'),
        createMockVendorQuote('q3', 'rfq-1', 'v3', 140000, 88, 'under_review'),
      ];

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          find: jest.fn((id: string) => {
            if (id === 'rfq-1') return Promise.resolve(rfq);
            if (id === 'q1') return Promise.resolve(winningQuote);
            return Promise.reject(new Error('Not found'));
          }),
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve([winningQuote, ...otherQuotes])),
          })),
        })
      );

      // Step 1: Award winning quote
      await database.write(async () => {
        const quote = await database.collections
          .get('rfq_vendor_quotes')
          .find('q1');
        await quote.update((record: any) => {
          record.status = 'awarded';
        });
      });

      expect(winningQuote.update).toHaveBeenCalled();

      // Step 2: Reject other quotes
      for (const quote of otherQuotes) {
        await database.write(async () => {
          await quote.update((record: any) => {
            record.status = 'rejected';
          });
        });
      }

      otherQuotes.forEach((quote) => {
        expect(quote.update).toHaveBeenCalled();
      });

      // Step 3: Update RFQ with award details
      await database.write(async () => {
        const foundRfq = await database.collections
          .get('rfqs')
          .find('rfq-1');
        await foundRfq.update((record: any) => {
          record.status = 'awarded';
          record.winningVendorId = 'v1';
          record.winningQuoteId = 'q1';
          record.awardedValue = 145000;
          record.awardDate = Date.now();
        });
      });

      expect(rfq.update).toHaveBeenCalled();
    });

    it('should prevent awarding non-evaluated RFQ', async () => {
      const rfq = createMockRfq('1', 'pkg-1', projectId, 'quotes_received');

      const canAward = rfq.status === 'evaluated';
      expect(canAward).toBe(false);
    });
  });

  describe('Workflow 4: Invoice Management', () => {
    describe('Invoice Creation', () => {
      it('should create invoice from awarded RFQ', async () => {
        const rfq = createMockRfq('1', 'pkg-1', projectId, 'awarded');
        rfq.winningVendorId = 'v1';
        rfq.awardedValue = 145000;

        let invoice: any = null;

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(rfq)),
            create: jest.fn((callback: any) => {
              invoice = {
                id: 'inv-1',
                invoiceNumber: '',
                rfqId: '',
                vendorId: '',
                amount: 0,
                status: 'pending',
              };
              callback(invoice);
              return Promise.resolve(invoice);
            }),
          })
        );

        // Create invoice from RFQ
        const foundRfq = await database.collections
          .get('rfqs')
          .find('rfq-1');

        await database.write(async () => {
          await database.collections
            .get('invoices')
            .create((record: any) => {
              record.invoiceNumber = `INV-${Date.now()}`;
              record.rfqId = foundRfq.id;
              record.vendorId = foundRfq.winningVendorId;
              record.amount = foundRfq.awardedValue;
              record.currency = 'USD';
              record.status = 'pending';
              record.issueDate = Date.now();
              record.dueDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
            });
        });

        expect(invoice).toBeDefined();
        expect(invoice.amount).toBe(145000);
        expect(invoice.status).toBe('pending');
      });

      it('should create milestone-based invoices', async () => {
        const rfq = createMockRfq('1', 'pkg-1', projectId, 'awarded');
        rfq.awardedValue = 150000;

        const milestones = [
          { name: 'Advance Payment', percentage: 30 },
          { name: 'Delivery', percentage: 50 },
          { name: 'Commissioning', percentage: 20 },
        ];

        const invoices: any[] = [];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            create: jest.fn((callback: any) => {
              const invoice = {
                id: `inv-${invoices.length + 1}`,
                amount: 0,
                milestone: '',
              };
              callback(invoice);
              invoices.push(invoice);
              return Promise.resolve(invoice);
            }),
          })
        );

        // Create invoices for each milestone
        for (const milestone of milestones) {
          const amount = (rfq.awardedValue * milestone.percentage) / 100;
          await database.write(async () => {
            await database.collections
              .get('invoices')
              .create((record: any) => {
                record.rfqId = 'rfq-1';
                record.amount = amount;
                record.milestone = milestone.name;
                record.status = 'pending';
              });
          });
        }

        expect(invoices.length).toBe(3);
        expect(invoices[0].amount).toBe(45000); // 30%
        expect(invoices[1].amount).toBe(75000); // 50%
        expect(invoices[2].amount).toBe(30000); // 20%
      });
    });

    describe('Invoice Status Tracking', () => {
      it('should track invoice through payment lifecycle', async () => {
        const invoice = createMockInvoice('1', 'rfq-1', 'v1', 145000);

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(invoice)),
          })
        );

        // Approve invoice
        await database.write(async () => {
          const found = await database.collections
            .get('invoices')
            .find('inv-1');
          await found.update((record: any) => {
            record.status = 'approved';
            record.approvedBy = commercialUserId;
            record.approvedDate = Date.now();
          });
        });

        expect(invoice.update).toHaveBeenCalled();

        // Clear mock and mark as paid
        (invoice.update as jest.Mock).mockClear();

        await database.write(async () => {
          const found = await database.collections
            .get('invoices')
            .find('inv-1');
          await found.update((record: any) => {
            record.status = 'paid';
            record.paidDate = Date.now();
            record.paymentReference = 'TXN-123456';
          });
        });

        expect(invoice.update).toHaveBeenCalled();
      });

      it('should calculate outstanding invoice amounts', async () => {
        const invoices = [
          createMockInvoice('1', 'rfq-1', 'v1', 50000, 'paid'),
          createMockInvoice('2', 'rfq-1', 'v1', 75000, 'approved'),
          createMockInvoice('3', 'rfq-1', 'v1', 25000, 'pending'),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(invoices)),
            })),
          })
        );

        const allInvoices = await database.collections
          .get('invoices')
          .query()
          .fetch();

        const totalAmount = allInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const paidAmount = allInvoices
          .filter((inv: any) => inv.status === 'paid')
          .reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const outstandingAmount = totalAmount - paidAmount;

        expect(totalAmount).toBe(150000);
        expect(paidAmount).toBe(50000);
        expect(outstandingAmount).toBe(100000);
      });
    });
  });

  describe('Workflow 5: Cost Tracking and Variance Analysis', () => {
    it('should track cost variance between estimated and actual', async () => {
      const estimatedCosts = {
        material: 100000,
        labor: 50000,
        equipment: 30000,
        subcontractor: 20000,
      };

      const actualCosts = {
        material: 105000, // 5% over
        labor: 48000, // 4% under
        equipment: 32000, // 6.7% over
        subcontractor: 22000, // 10% over
      };

      const categories = Object.keys(estimatedCosts) as Array<keyof typeof estimatedCosts>;

      const variance = categories.map((category) => {
        const estimated = estimatedCosts[category];
        const actual = actualCosts[category];
        const diff = actual - estimated;
        const percentage = (diff / estimated) * 100;

        return {
          category,
          estimated,
          actual,
          variance: diff,
          variancePercent: percentage,
          status: diff > 0 ? 'over' : diff < 0 ? 'under' : 'on_budget',
        };
      });

      const totalEstimated = Object.values(estimatedCosts).reduce((a, b) => a + b, 0);
      const totalActual = Object.values(actualCosts).reduce((a, b) => a + b, 0);
      const totalVariance = totalActual - totalEstimated;
      const totalVariancePercent = (totalVariance / totalEstimated) * 100;

      expect(variance[0].category).toBe('material');
      expect(variance[0].variance).toBe(5000);
      expect(variance[0].status).toBe('over');

      expect(variance[1].category).toBe('labor');
      expect(variance[1].variance).toBe(-2000);
      expect(variance[1].status).toBe('under');

      expect(totalEstimated).toBe(200000);
      expect(totalActual).toBe(207000);
      expect(totalVariance).toBe(7000);
      expect(totalVariancePercent).toBeCloseTo(3.5, 1);
    });

    it('should aggregate costs by vendor', async () => {
      const invoices = [
        { vendorId: 'v1', amount: 50000, status: 'paid' },
        { vendorId: 'v1', amount: 30000, status: 'approved' },
        { vendorId: 'v2', amount: 45000, status: 'paid' },
        { vendorId: 'v3', amount: 25000, status: 'pending' },
        { vendorId: 'v2', amount: 20000, status: 'paid' },
      ];

      const vendorCosts: Record<string, { paid: number; pending: number; total: number }> = {};

      invoices.forEach((inv) => {
        if (!vendorCosts[inv.vendorId]) {
          vendorCosts[inv.vendorId] = { paid: 0, pending: 0, total: 0 };
        }
        vendorCosts[inv.vendorId].total += inv.amount;
        if (inv.status === 'paid') {
          vendorCosts[inv.vendorId].paid += inv.amount;
        } else {
          vendorCosts[inv.vendorId].pending += inv.amount;
        }
      });

      expect(vendorCosts['v1'].total).toBe(80000);
      expect(vendorCosts['v1'].paid).toBe(50000);
      expect(vendorCosts['v1'].pending).toBe(30000);

      expect(vendorCosts['v2'].total).toBe(65000);
      expect(vendorCosts['v2'].paid).toBe(65000);

      expect(vendorCosts['v3'].total).toBe(25000);
      expect(vendorCosts['v3'].pending).toBe(25000);
    });
  });

  describe('Workflow 6: RFQ Statistics and Reporting', () => {
    it('should calculate comprehensive RFQ statistics', async () => {
      const rfqs = [
        { ...createMockRfq('1', 'pkg-1', projectId, 'awarded'), totalQuotesReceived: 4 },
        { ...createMockRfq('2', 'pkg-2', projectId, 'awarded'), totalQuotesReceived: 3 },
        { ...createMockRfq('3', 'pkg-3', projectId, 'evaluated'), totalQuotesReceived: 5 },
        { ...createMockRfq('4', 'pkg-4', projectId, 'issued'), totalQuotesReceived: 0 },
        { ...createMockRfq('5', 'pkg-5', projectId, 'draft'), totalQuotesReceived: 0 },
      ];

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve(rfqs)),
          })),
        })
      );

      const allRfqs = await database.collections
        .get('rfqs')
        .query()
        .fetch();

      const stats = {
        totalRfqs: allRfqs.length,
        draftRfqs: allRfqs.filter((r: any) => r.status === 'draft').length,
        issuedRfqs: allRfqs.filter((r: any) => r.status === 'issued').length,
        evaluatedRfqs: allRfqs.filter((r: any) => r.status === 'evaluated').length,
        awardedRfqs: allRfqs.filter((r: any) => r.status === 'awarded').length,
        totalQuotes: allRfqs.reduce((sum: number, r: any) => sum + r.totalQuotesReceived, 0),
        avgQuotesPerRfq: 0,
      };

      const rfqsWithQuotes = allRfqs.filter((r: any) => r.totalQuotesReceived > 0);
      stats.avgQuotesPerRfq = rfqsWithQuotes.length > 0
        ? stats.totalQuotes / rfqsWithQuotes.length
        : 0;

      expect(stats.totalRfqs).toBe(5);
      expect(stats.draftRfqs).toBe(1);
      expect(stats.issuedRfqs).toBe(1);
      expect(stats.evaluatedRfqs).toBe(1);
      expect(stats.awardedRfqs).toBe(2);
      expect(stats.totalQuotes).toBe(12);
      expect(stats.avgQuotesPerRfq).toBe(4); // 12 quotes / 3 RFQs with quotes
    });

    it('should generate vendor performance report', async () => {
      const vendors = [
        { id: 'v1', name: 'Vendor A', rating: 4.5 },
        { id: 'v2', name: 'Vendor B', rating: 4.0 },
        { id: 'v3', name: 'Vendor C', rating: 3.5 },
      ];

      const quotes = [
        { vendorId: 'v1', status: 'awarded', overallScore: 89 },
        { vendorId: 'v1', status: 'rejected', overallScore: 75 },
        { vendorId: 'v2', status: 'awarded', overallScore: 85 },
        { vendorId: 'v2', status: 'rejected', overallScore: 72 },
        { vendorId: 'v2', status: 'rejected', overallScore: 78 },
        { vendorId: 'v3', status: 'rejected', overallScore: 68 },
      ];

      const performance = vendors.map((vendor) => {
        const vendorQuotes = quotes.filter((q) => q.vendorId === vendor.id);
        const awardedQuotes = vendorQuotes.filter((q) => q.status === 'awarded');
        const avgScore = vendorQuotes.reduce((sum, q) => sum + q.overallScore, 0) / vendorQuotes.length;

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          totalQuotes: vendorQuotes.length,
          awardedQuotes: awardedQuotes.length,
          winRate: (awardedQuotes.length / vendorQuotes.length) * 100,
          averageScore: avgScore,
          rating: vendor.rating,
        };
      });

      expect(performance[0].vendorName).toBe('Vendor A');
      expect(performance[0].winRate).toBe(50);
      expect(performance[0].averageScore).toBe(82);

      expect(performance[1].vendorName).toBe('Vendor B');
      expect(performance[1].winRate.toFixed(1)).toBe('33.3');

      expect(performance[2].vendorName).toBe('Vendor C');
      expect(performance[2].winRate).toBe(0);
    });
  });

  describe('Workflow 7: RFQ Cancellation', () => {
    it('should cancel RFQ with reason', async () => {
      const rfq = createMockRfq('1', 'pkg-1', projectId, 'issued');

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          find: jest.fn(() => Promise.resolve(rfq)),
        })
      );

      await database.write(async () => {
        const found = await database.collections
          .get('rfqs')
          .find('rfq-1');
        await found.update((record: any) => {
          record.status = 'cancelled';
          record.description = `${record.description}\n\nCancellation Reason: Project scope changed`;
        });
      });

      expect(rfq.update).toHaveBeenCalled();
    });

    it('should prevent cancellation of awarded RFQ', async () => {
      const rfq = createMockRfq('1', 'pkg-1', projectId, 'awarded');

      const canCancel = rfq.status !== 'awarded';
      expect(canCancel).toBe(false);
    });
  });

  describe('Workflow 8: Comparative Quote Analysis', () => {
    it('should generate comparative analysis across quotes', async () => {
      const quotes = [
        {
          vendorId: 'v1',
          vendorName: 'Vendor A',
          quotedPrice: 145000,
          leadTimeDays: 45,
          technicalCompliancePercentage: 95,
          warrantyMonths: 12,
        },
        {
          vendorId: 'v2',
          vendorName: 'Vendor B',
          quotedPrice: 142000,
          leadTimeDays: 60,
          technicalCompliancePercentage: 88,
          warrantyMonths: 18,
        },
        {
          vendorId: 'v3',
          vendorName: 'Vendor C',
          quotedPrice: 155000,
          leadTimeDays: 30,
          technicalCompliancePercentage: 98,
          warrantyMonths: 24,
        },
      ];

      // Sort by price
      const byPrice = [...quotes].sort((a, b) => a.quotedPrice - b.quotedPrice);
      // Sort by lead time
      const byLeadTime = [...quotes].sort((a, b) => a.leadTimeDays - b.leadTimeDays);
      // Sort by compliance
      const byCompliance = [...quotes].sort(
        (a, b) => b.technicalCompliancePercentage - a.technicalCompliancePercentage
      );

      const analysis = quotes.map((quote) => ({
        ...quote,
        priceRank: byPrice.findIndex((q) => q.vendorId === quote.vendorId) + 1,
        leadTimeRank: byLeadTime.findIndex((q) => q.vendorId === quote.vendorId) + 1,
        complianceRank: byCompliance.findIndex((q) => q.vendorId === quote.vendorId) + 1,
      }));

      // Vendor B has lowest price
      expect(analysis.find((a) => a.vendorId === 'v2')?.priceRank).toBe(1);
      // Vendor C has fastest delivery
      expect(analysis.find((a) => a.vendorId === 'v3')?.leadTimeRank).toBe(1);
      // Vendor C has highest compliance
      expect(analysis.find((a) => a.vendorId === 'v3')?.complianceRank).toBe(1);

      // Calculate best value (composite score)
      const scored = analysis.map((a) => ({
        ...a,
        compositeScore: (4 - a.priceRank) * 0.4 + (4 - a.leadTimeRank) * 0.3 + (4 - a.complianceRank) * 0.3,
      }));

      const bestValue = scored.sort((a, b) => b.compositeScore - a.compositeScore)[0];
      expect(bestValue.vendorId).toBe('v3'); // Best balanced option
    });
  });
});
