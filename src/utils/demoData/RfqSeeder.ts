/**
 * RFQ Demo Data Seeder
 *
 * Creates realistic vendors, RFQs, and vendor quotes for testing
 * Links to existing DOORS packages
 */

import { database } from '../../../models/database';
import VendorModel from '../../../models/VendorModel';
import RfqModel from '../../../models/RfqModel';
import RfqVendorQuoteModel from '../../../models/RfqVendorQuoteModel';
import DoorsPackageModel from '../../../models/DoorsPackageModel';
import { Q } from '@nozbe/watermelondb';

/**
 * Create demo vendors
 */
export async function createVendorsDemoData(): Promise<string[]> {
  console.log('[RfqSeeder] Creating demo vendors...');

  const now = Date.now();
  const vendorIds: string[] = [];

  await database.write(async () => {
    const vendorsCollection = database.collections.get<VendorModel>('vendors');

    // TSS Vendors
    const siemensId = (
      await vendorsCollection.create((v) => {
        v.vendorCode = 'VEN-001';
        v.vendorName = 'Siemens Ltd.';
        v.category = 'TSS';
        v.contactPerson = 'Rajesh Kumar';
        v.email = 'rajesh.kumar@siemens.com';
        v.phone = '+91-11-4567-8900';
        v.address = 'Gurgaon, Haryana, India';
        v.rating = 4.8;
        v.isApproved = true;
        v.performanceScore = 92;
        v.lastDeliveryDate = now - 45 * 24 * 60 * 60 * 1000;
        v.totalOrders = 28;
        v.appSyncStatus = 'pending';
        v.version = 1;
      })
    ).id;
    vendorIds.push(siemensId);

    const abbId = (
      await vendorsCollection.create((v) => {
        v.vendorCode = 'VEN-002';
        v.vendorName = 'ABB India Ltd.';
        v.category = 'TSS';
        v.contactPerson = 'Amit Sharma';
        v.email = 'amit.sharma@abb.com';
        v.phone = '+91-22-6789-1234';
        v.address = 'Mumbai, Maharashtra, India';
        v.rating = 4.6;
        v.isApproved = true;
        v.performanceScore = 88;
        v.lastDeliveryDate = now - 60 * 24 * 60 * 60 * 1000;
        v.totalOrders = 22;
        v.appSyncStatus = 'pending';
        v.version = 1;
      })
    ).id;
    vendorIds.push(abbId);

    const schneider = (
      await vendorsCollection.create((v) => {
        v.vendorCode = 'VEN-003';
        v.vendorName = 'Schneider Electric';
        v.category = 'TSS';
        v.contactPerson = 'Priya Patel';
        v.email = 'priya.patel@schneider.com';
        v.phone = '+91-80-4512-7890';
        v.address = 'Bangalore, Karnataka, India';
        v.rating = 4.5;
        v.isApproved = true;
        v.performanceScore = 85;
        v.lastDeliveryDate = now - 90 * 24 * 60 * 60 * 1000;
        v.totalOrders = 18;
        v.appSyncStatus = 'pending';
        v.version = 1;
      })
    ).id;
    vendorIds.push(schneider);

    // OHE Vendors
    const oheId = (
      await vendorsCollection.create((v) => {
        v.vendorCode = 'VEN-004';
        v.vendorName = 'Kalpataru Power Transmission';
        v.category = 'OHE';
        v.contactPerson = 'Suresh Rao';
        v.email = 'suresh.rao@kalpatarupower.com';
        v.phone = '+91-22-6652-1000';
        v.address = 'Mumbai, Maharashtra, India';
        v.rating = 4.4;
        v.isApproved = true;
        v.performanceScore = 82;
        v.lastDeliveryDate = now - 30 * 24 * 60 * 60 * 1000;
        v.totalOrders = 15;
        v.appSyncStatus = 'pending';
        v.version = 1;
      })
    ).id;
    vendorIds.push(oheId);

    const furlengerId = (
      await vendorsCollection.create((v) => {
        v.vendorCode = 'VEN-005';
        v.vendorName = 'Furlenco OHE Systems';
        v.category = 'OHE';
        v.contactPerson = 'Vikram Singh';
        v.email = 'vikram@furlenco-ohe.com';
        v.phone = '+91-11-2345-6789';
        v.address = 'New Delhi, India';
        v.rating = 4.2;
        v.isApproved = true;
        v.performanceScore = 78;
        v.lastDeliveryDate = now - 75 * 24 * 60 * 60 * 1000;
        v.totalOrders = 12;
        v.appSyncStatus = 'pending';
        v.version = 1;
      })
    ).id;
    vendorIds.push(furlengerId);

    // SCADA Vendors
    const scadaId = (
      await vendorsCollection.create((v) => {
        v.vendorCode = 'VEN-006';
        v.vendorName = 'Honeywell Automation';
        v.category = 'SCADA';
        v.contactPerson = 'Neha Gupta';
        v.email = 'neha.gupta@honeywell.com';
        v.phone = '+91-44-4567-8900';
        v.address = 'Chennai, Tamil Nadu, India';
        v.rating = 4.7;
        v.isApproved = true;
        v.performanceScore = 90;
        v.lastDeliveryDate = now - 20 * 24 * 60 * 60 * 1000;
        v.totalOrders = 10;
        v.appSyncStatus = 'pending';
        v.version = 1;
      })
    ).id;
    vendorIds.push(scadaId);

    // Cables Vendors
    const cablesId = (
      await vendorsCollection.create((v) => {
        v.vendorCode = 'VEN-007';
        v.vendorName = 'KEI Industries';
        v.category = 'Cables';
        v.contactPerson = 'Anil Verma';
        v.email = 'anil.verma@kei.com';
        v.phone = '+91-11-4160-0700';
        v.address = 'New Delhi, India';
        v.rating = 4.3;
        v.isApproved = true;
        v.performanceScore = 80;
        v.lastDeliveryDate = now - 40 * 24 * 60 * 60 * 1000;
        v.totalOrders = 20;
        v.appSyncStatus = 'pending';
        v.version = 1;
      })
    ).id;
    vendorIds.push(cablesId);

    const polycabId = (
      await vendorsCollection.create((v) => {
        v.vendorCode = 'VEN-008';
        v.vendorName = 'Polycab Wires';
        v.category = 'Cables';
        v.contactPerson = 'Ramesh Joshi';
        v.email = 'ramesh.joshi@polycab.com';
        v.phone = '+91-22-3989-8888';
        v.address = 'Mumbai, Maharashtra, India';
        v.rating = 4.1;
        v.isApproved = true;
        v.performanceScore = 75;
        v.lastDeliveryDate = now - 55 * 24 * 60 * 60 * 1000;
        v.totalOrders = 16;
        v.appSyncStatus = 'pending';
        v.version = 1;
      })
    ).id;
    vendorIds.push(polycabId);

    // Non-approved vendor (for testing filters)
    await vendorsCollection.create((v) => {
      v.vendorCode = 'VEN-009';
      v.vendorName = 'New Electro Systems';
      v.category = 'TSS';
      v.contactPerson = 'Unknown';
      v.email = 'contact@newelectro.com';
      v.phone = '+91-11-1234-5678';
      v.address = 'Delhi, India';
      v.rating = 3.5;
      v.isApproved = false; // Not approved
      v.performanceScore = 60;
      v.totalOrders = 2;
      v.appSyncStatus = 'pending';
      v.version = 1;
    });

    console.log(`[RfqSeeder] Created ${vendorIds.length} vendors`);
  });

  return vendorIds;
}

/**
 * Create demo RFQs and vendor quotes
 */
export async function createRfqsDemoData(projectId: string, userId: string): Promise<void> {
  console.log('[RfqSeeder] Creating demo RFQs and quotes...');

  // First ensure vendors exist
  const vendorIds = await createVendorsDemoData();

  // Get DOORS packages to link RFQs to
  const doorsPackages = await database.collections
    .get<DoorsPackageModel>('doors_packages')
    .query(Q.where('project_id', projectId))
    .fetch();

  if (doorsPackages.length === 0) {
    console.warn('[RfqSeeder] No DOORS packages found. Create DOORS demo data first.');
    return;
  }

  const now = Date.now();

  await database.write(async () => {
    const rfqsCollection = database.collections.get<RfqModel>('rfqs');
    const quotesCollection = database.collections.get<RfqVendorQuoteModel>('rfq_vendor_quotes');

    // RFQ 1: Draft - Auxiliary Transformer (if exists)
    const auxTransPkg = doorsPackages.find((p) => p.category === 'TSS' && p.equipmentName.includes('Transformer'));
    if (auxTransPkg) {
      const rfq1 = await rfqsCollection.create((rfq) => {
        rfq.rfqNumber = 'RFQ-2025-001';
        rfq.doorsId = auxTransPkg.doorsId;
        rfq.doorsPackageId = auxTransPkg.id;
        rfq.projectId = projectId;
        rfq.title = `RFQ for ${auxTransPkg.equipmentName}`;
        rfq.description = `Request for Quotation for ${auxTransPkg.equipmentName} (${auxTransPkg.quantity} ${auxTransPkg.unit})`;
        rfq.status = 'draft';
        rfq.closingDate = now + 30 * 24 * 60 * 60 * 1000; // 30 days from now
        rfq.expectedDeliveryDays = 90;
        rfq.technicalSpecifications = JSON.stringify({
          totalRequirements: auxTransPkg.totalRequirements,
          mandatoryRequirements: Math.floor(auxTransPkg.totalRequirements * 0.8),
          categories: ['Technical', 'Datasheet', 'Type Test'],
          complianceThreshold: 85,
        });
        rfq.commercialTerms = JSON.stringify({
          paymentTerms: '30% advance, 60% on delivery, 10% after commissioning',
          warranty: '24 months',
          penalties: 'As per contract',
        });
        rfq.totalVendorsInvited = 3;
        rfq.totalQuotesReceived = 0;
        rfq.createdById = userId;
        rfq.appSyncStatus = 'pending';
        rfq.version = 1;
      });
    }

    // RFQ 2: Issued - Circuit Breaker
    const cbPkg = doorsPackages.find((p) => p.category === 'TSS' && p.equipmentName.includes('Circuit'));
    if (cbPkg && vendorIds.length >= 3) {
      const rfq2 = await rfqsCollection.create((rfq) => {
        rfq.rfqNumber = 'RFQ-2025-002';
        rfq.doorsId = cbPkg.doorsId;
        rfq.doorsPackageId = cbPkg.id;
        rfq.projectId = projectId;
        rfq.title = `RFQ for ${cbPkg.equipmentName}`;
        rfq.description = `Request for Quotation for ${cbPkg.equipmentName} (${cbPkg.quantity} ${cbPkg.unit})`;
        rfq.status = 'issued';
        rfq.issueDate = now - 10 * 24 * 60 * 60 * 1000; // 10 days ago
        rfq.closingDate = now + 20 * 24 * 60 * 60 * 1000; // 20 days from now
        rfq.expectedDeliveryDays = 120;
        rfq.technicalSpecifications = JSON.stringify({
          totalRequirements: cbPkg.totalRequirements,
          mandatoryRequirements: Math.floor(cbPkg.totalRequirements * 0.9),
          categories: ['Technical', 'Type Test', 'Routine Test'],
          complianceThreshold: 90,
        });
        rfq.commercialTerms = JSON.stringify({
          paymentTerms: '20% advance, 70% on delivery, 10% after testing',
          warranty: '36 months',
          penalties: 'LD @ 0.5% per week',
        });
        rfq.totalVendorsInvited = 3;
        rfq.totalQuotesReceived = 0; // Will be updated when quotes added
        rfq.createdById = userId;
        rfq.appSyncStatus = 'pending';
        rfq.version = 1;
      });

      // No quotes yet (vendors haven't responded)
    }

    // RFQ 3: Quotes Received - OHE Mast
    const ohePkg = doorsPackages.find((p) => p.category === 'OHE');
    if (ohePkg && vendorIds.length >= 5) {
      const rfq3 = await rfqsCollection.create((rfq) => {
        rfq.rfqNumber = 'RFQ-2025-003';
        rfq.doorsId = ohePkg.doorsId;
        rfq.doorsPackageId = ohePkg.id;
        rfq.projectId = projectId;
        rfq.title = `RFQ for ${ohePkg.equipmentName}`;
        rfq.description = `Request for Quotation for ${ohePkg.equipmentName} (${ohePkg.quantity} ${ohePkg.unit})`;
        rfq.status = 'quotes_received';
        rfq.issueDate = now - 25 * 24 * 60 * 60 * 1000;
        rfq.closingDate = now - 5 * 24 * 60 * 60 * 1000; // Closed 5 days ago
        rfq.expectedDeliveryDays = 60;
        rfq.technicalSpecifications = JSON.stringify({
          totalRequirements: ohePkg.totalRequirements || 50,
          mandatoryRequirements: 40,
          categories: ['Technical', 'Material', 'Testing'],
          complianceThreshold: 85,
        });
        rfq.commercialTerms = JSON.stringify({
          paymentTerms: '30% advance, 60% on delivery, 10% after installation',
          warranty: '60 months',
          penalties: 'LD @ 1% per week, max 10%',
        });
        rfq.totalVendorsInvited = 2;
        rfq.totalQuotesReceived = 2;
        rfq.createdById = userId;
        rfq.appSyncStatus = 'pending';
        rfq.version = 2;
      });

      // Add vendor quotes for RFQ 3
      await quotesCollection.create((q) => {
        q.rfqId = rfq3.id;
        q.vendorId = vendorIds[3]; // Kalpataru
        q.quoteReference = 'KPT/Q/2025/001';
        q.quotedPrice = 4500000; // ₹45L
        q.currency = 'INR';
        q.leadTimeDays = 55;
        q.validityDays = 90;
        q.paymentTerms = 'As per RFQ';
        q.warrantyMonths = 60;
        q.technicalCompliancePercentage = 90;
        q.technicalDeviations = JSON.stringify(['Minor deviation in coating thickness']);
        q.commercialDeviations = JSON.stringify([]);
        q.notes = 'Best quality OHE masts with proven track record';
        q.status = 'submitted';
        q.submittedAt = now - 3 * 24 * 60 * 60 * 1000;
        q.appSyncStatus = 'pending';
        q.version = 1;
      });

      await quotesCollection.create((q) => {
        q.rfqId = rfq3.id;
        q.vendorId = vendorIds[4]; // Furlenco
        q.quoteReference = 'FUR/OHE/2025/012';
        q.quotedPrice = 4200000; // ₹42L (cheaper)
        q.currency = 'INR';
        q.leadTimeDays = 70; // Longer lead time
        q.validityDays = 60;
        q.paymentTerms = '40% advance required';
        q.warrantyMonths = 48;
        q.technicalCompliancePercentage = 85;
        q.technicalDeviations = JSON.stringify(['Alternative coating method', 'Different supplier for bolts']);
        q.commercialDeviations = JSON.stringify(['Higher advance payment']);
        q.notes = 'Competitive pricing with good quality';
        q.status = 'submitted';
        q.submittedAt = now - 2 * 24 * 60 * 60 * 1000;
        q.appSyncStatus = 'pending';
        q.version = 1;
      });
    }

    // RFQ 4: Evaluated - TSS Package
    const tssPkg = doorsPackages.find((p) => p.category === 'TSS' && !p.equipmentName.includes('Transformer') && !p.equipmentName.includes('Circuit'));
    if (tssPkg && vendorIds.length >= 3) {
      const rfq4 = await rfqsCollection.create((rfq) => {
        rfq.rfqNumber = 'RFQ-2025-004';
        rfq.doorsId = tssPkg.doorsId;
        rfq.doorsPackageId = tssPkg.id;
        rfq.projectId = projectId;
        rfq.title = `RFQ for ${tssPkg.equipmentName}`;
        rfq.description = `Request for Quotation for ${tssPkg.equipmentName}`;
        rfq.status = 'evaluated';
        rfq.issueDate = now - 45 * 24 * 60 * 60 * 1000;
        rfq.closingDate = now - 25 * 24 * 60 * 60 * 1000;
        rfq.evaluationDate = now - 10 * 24 * 60 * 60 * 1000;
        rfq.expectedDeliveryDays = 90;
        rfq.technicalSpecifications = JSON.stringify({ complianceThreshold: 90 });
        rfq.commercialTerms = JSON.stringify({ paymentTerms: 'Standard' });
        rfq.totalVendorsInvited = 3;
        rfq.totalQuotesReceived = 3;
        rfq.createdById = userId;
        rfq.appSyncStatus = 'pending';
        rfq.version = 3;
      });

      // IR L1 method: L1 = lowest price among technically qualified (score >= 70)
      // Schneider: cheapest + qualified => L1
      // ABB: mid-price + qualified => L2
      // Siemens: highest price + qualified => L3
      await quotesCollection.create((q) => {
        q.rfqId = rfq4.id;
        q.vendorId = vendorIds[2]; // Schneider - L1 (lowest price, qualified)
        q.quoteReference = 'SCH/2025/078';
        q.quotedPrice = 7900000; // Cheapest
        q.currency = 'INR';
        q.leadTimeDays = 100;
        q.validityDays = 60;
        q.paymentTerms = '40% advance';
        q.warrantyMonths = 24;
        q.technicalCompliancePercentage = 82;
        q.technicalDeviations = JSON.stringify(['Alternative materials', 'Different test procedure']);
        q.commercialDeviations = JSON.stringify(['Higher advance', 'Shorter warranty']);
        q.notes = 'Lowest price with acceptable quality';
        q.status = 'shortlisted';
        q.technicalScore = 82;
        q.commercialScore = 0;
        q.overallScore = 82;
        q.rank = 1; // L1
        q.submittedAt = now - 21 * 24 * 60 * 60 * 1000;
        q.evaluatedAt = now - 10 * 24 * 60 * 60 * 1000;
        q.evaluatedById = userId;
        q.appSyncStatus = 'pending';
        q.version = 2;
      });

      await quotesCollection.create((q) => {
        q.rfqId = rfq4.id;
        q.vendorId = vendorIds[1]; // ABB - L2
        q.quoteReference = 'ABB/IN/2025/123';
        q.quotedPrice = 8200000;
        q.currency = 'INR';
        q.leadTimeDays = 90;
        q.validityDays = 90;
        q.paymentTerms = 'As per RFQ';
        q.warrantyMonths = 30;
        q.technicalCompliancePercentage = 88;
        q.technicalDeviations = JSON.stringify(['Minor spec deviation']);
        q.commercialDeviations = JSON.stringify(['Shorter warranty']);
        q.notes = 'Good balance of price and quality';
        q.status = 'under_review';
        q.technicalScore = 88;
        q.commercialScore = 0;
        q.overallScore = 88;
        q.rank = 2; // L2
        q.submittedAt = now - 22 * 24 * 60 * 60 * 1000;
        q.evaluatedAt = now - 10 * 24 * 60 * 60 * 1000;
        q.evaluatedById = userId;
        q.appSyncStatus = 'pending';
        q.version = 2;
      });

      await quotesCollection.create((q) => {
        q.rfqId = rfq4.id;
        q.vendorId = vendorIds[0]; // Siemens - L3 (highest price)
        q.quoteReference = 'SIE/2025/045';
        q.quotedPrice = 8500000;
        q.currency = 'INR';
        q.leadTimeDays = 80;
        q.validityDays = 120;
        q.paymentTerms = 'As per RFQ';
        q.warrantyMonths = 36;
        q.technicalCompliancePercentage = 95;
        q.technicalDeviations = JSON.stringify([]);
        q.commercialDeviations = JSON.stringify([]);
        q.notes = 'Premium quality but highest price';
        q.status = 'under_review';
        q.technicalScore = 95;
        q.commercialScore = 0;
        q.overallScore = 95;
        q.rank = 3; // L3
        q.submittedAt = now - 20 * 24 * 60 * 60 * 1000;
        q.evaluatedAt = now - 10 * 24 * 60 * 60 * 1000;
        q.evaluatedById = userId;
        q.appSyncStatus = 'pending';
        q.version = 2;
      });
    }

    // RFQ 5: Awarded - Cables
    const cablesPkg = doorsPackages.find((p) => p.category === 'Cables');
    if (cablesPkg && vendorIds.length >= 8) {
      const rfq5 = await rfqsCollection.create((rfq) => {
        rfq.rfqNumber = 'RFQ-2025-005';
        rfq.doorsId = cablesPkg.doorsId;
        rfq.doorsPackageId = cablesPkg.id;
        rfq.projectId = projectId;
        rfq.title = `RFQ for ${cablesPkg.equipmentName}`;
        rfq.description = `Request for Quotation for ${cablesPkg.equipmentName}`;
        rfq.status = 'awarded';
        rfq.issueDate = now - 60 * 24 * 60 * 60 * 1000;
        rfq.closingDate = now - 40 * 24 * 60 * 60 * 1000;
        rfq.evaluationDate = now - 30 * 24 * 60 * 60 * 1000;
        rfq.awardDate = now - 20 * 24 * 60 * 60 * 1000;
        rfq.expectedDeliveryDays = 45;
        rfq.technicalSpecifications = JSON.stringify({ complianceThreshold: 85 });
        rfq.commercialTerms = JSON.stringify({ paymentTerms: 'Standard' });
        rfq.totalVendorsInvited = 2;
        rfq.totalQuotesReceived = 2;
        rfq.winningVendorId = vendorIds[6]; // KEI
        rfq.awardedValue = 3500000; // ₹35L
        rfq.createdById = userId;
        rfq.evaluatedById = userId;
        rfq.appSyncStatus = 'pending';
        rfq.version = 4;
      });

      // Winner: KEI - lowest price among qualified (L1)
      const winningQuote = await quotesCollection.create((q) => {
        q.rfqId = rfq5.id;
        q.vendorId = vendorIds[6]; // KEI - Winner (lowest price, qualified)
        q.quoteReference = 'KEI/2025/089';
        q.quotedPrice = 3500000;
        q.currency = 'INR';
        q.leadTimeDays = 40;
        q.validityDays = 90;
        q.paymentTerms = 'As per RFQ';
        q.warrantyMonths = 24;
        q.technicalCompliancePercentage = 92;
        q.technicalDeviations = JSON.stringify([]);
        q.commercialDeviations = JSON.stringify([]);
        q.notes = 'ISI marked cables with test certificates';
        q.status = 'awarded';
        q.technicalScore = 92;
        q.commercialScore = 0;
        q.overallScore = 92;
        q.rank = 1;
        q.submittedAt = now - 35 * 24 * 60 * 60 * 1000;
        q.evaluatedAt = now - 30 * 24 * 60 * 60 * 1000;
        q.evaluatedById = userId;
        q.appSyncStatus = 'pending';
        q.version = 3;
      });

      // Update RFQ with winning quote ID
      await rfq5.update((r) => {
        r.winningQuoteId = winningQuote.id;
      });

      // Loser: Polycab - higher price, also qualified
      await quotesCollection.create((q) => {
        q.rfqId = rfq5.id;
        q.vendorId = vendorIds[7]; // Polycab - L2 (higher price)
        q.quoteReference = 'POL/2025/156';
        q.quotedPrice = 3800000;
        q.currency = 'INR';
        q.leadTimeDays = 50;
        q.validityDays = 60;
        q.paymentTerms = 'As per RFQ';
        q.warrantyMonths = 18;
        q.technicalCompliancePercentage = 88;
        q.technicalDeviations = JSON.stringify(['Different insulation type']);
        q.commercialDeviations = JSON.stringify([]);
        q.notes = 'Good quality alternative';
        q.status = 'rejected';
        q.technicalScore = 88;
        q.commercialScore = 0;
        q.overallScore = 88;
        q.rank = 2;
        q.submittedAt = now - 33 * 24 * 60 * 60 * 1000;
        q.evaluatedAt = now - 30 * 24 * 60 * 60 * 1000;
        q.evaluatedById = userId;
        q.appSyncStatus = 'pending';
        q.version = 2;
      });
    }

    console.log('[RfqSeeder] RFQ demo data created successfully!');
  });
}

/**
 * Clear all RFQ demo data
 */
export async function clearRfqDemoData(): Promise<void> {
  console.log('[RfqSeeder] Clearing all RFQ demo data...');

  await database.write(async () => {
    // Delete all quotes
    const quotesCollection = database.collections.get('rfq_vendor_quotes');
    const allQuotes = await quotesCollection.query().fetch();
    for (const quote of allQuotes) {
      await quote.destroyPermanently();
    }

    // Delete all RFQs
    const rfqsCollection = database.collections.get('rfqs');
    const allRfqs = await rfqsCollection.query().fetch();
    for (const rfq of allRfqs) {
      await rfq.destroyPermanently();
    }

    // Delete all vendors
    const vendorsCollection = database.collections.get('vendors');
    const allVendors = await vendorsCollection.query().fetch();
    for (const vendor of allVendors) {
      await vendor.destroyPermanently();
    }

    console.log('[RfqSeeder] All RFQ demo data cleared');
  });
}
