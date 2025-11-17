# RFQ Creation Issue - Investigation Log

**Issue**: Unable to create RFQ - Error: "@children decorator used for a table that's not has_many"

**Date**: November 16-17, 2025
**Status**: UNRESOLVED
**Phase**: Phase 3 Day 6 - RFQ Management System

---

## Error Details

### Error Message
```
[RfqCreate] Error issuing RFQ:
Diagnostic error: @children decorator used for a table that's not has_many
framesToPop: 2
name: 'Diagnostic error'
```

### Error Location
- **File**: `src/services/RfqService.ts`
- **Method**: `createRfq()` - Line 87-123
- **Specific Line**: Line 98: `const requirements = await doorsPackage.requirements.fetch();`
- **Trigger Point**: When user clicks "Issue RFQ" button after filling in RFQ details

### Error Timing
- Error occurs at "Step 1: Creating RFQ" (before reaching Step 2)
- Happens BEFORE `this.rfqsCollection.create()` completes
- Occurs when WatermelonDB initializes/validates the RFQ model

---

## Database Schema (v28)

### Tables
1. **vendors** - Vendor master data
2. **rfqs** - RFQ master records
3. **rfq_vendor_quotes** - Quote submissions from vendors

### Key Relationships
```
vendors (1) ----< (M) rfq_vendor_quotes (M) >---- (1) rfqs
                           ↓
                    doors_packages (1) ----< (M) rfqs
```

---

## Investigation Timeline

### Attempt 1: Change @children Type to Query<Model>
**What we tried:**
```typescript
// Before
@children('rfq_vendor_quotes') vendorQuotes!: RfqVendorQuoteModel[];

// After
import { Query } from '@nozbe/watermelondb';
@children('rfq_vendor_quotes') vendorQuotes!: Query<RfqVendorQuoteModel>;
```
**Result**: ❌ Failed - Same error persists

---

### Attempt 2: Change @children Type to 'any'
**What we tried:**
```typescript
// Changed to match pattern in BomModel and DoorsPackageModel
@children('rfq_vendor_quotes') vendorQuotes: any;
```
**Reasoning**: Other working models use `any` type
**Result**: ❌ Failed - Same error persists

---

### Attempt 3: Remove @children Decorator Entirely
**What we tried:**
```typescript
// Removed completely from RfqModel.ts
// @children('rfq_vendor_quotes') vendorQuotes: any; // DELETED
```
**Reasoning**: We never use `rfq.vendorQuotes` - we query directly via RfqService
**Result**: ❌ Failed - Same error persists

---

### Attempt 4: Fix Association Key Names (Singular vs Plural)
**What we tried:**

**RfqVendorQuoteModel.ts** - Changed associations from plural to singular:
```typescript
// Before
static associations = {
  rfqs: { type: 'belongs_to' as const, key: 'rfq_id' },
  vendors: { type: 'belongs_to' as const, key: 'vendor_id' },
};
@relation('rfqs', 'rfq_id') rfq!: RfqModel;
@relation('vendors', 'vendor_id') vendor!: VendorModel;

// After
static associations = {
  rfq: { type: 'belongs_to' as const, key: 'rfq_id' },
  vendor: { type: 'belongs_to' as const, key: 'vendor_id' },
};
@relation('rfq', 'rfq_id') rfq!: RfqModel;
@relation('vendor', 'vendor_id') vendor!: VendorModel;
```

**RfqModel.ts** - Changed association key:
```typescript
// Before
static associations = {
  doors_packages: { type: 'belongs_to' as const, key: 'doors_package_id' },
  rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'rfq_id' },
};

// After
static associations = {
  doors_package: { type: 'belongs_to' as const, key: 'doors_package_id' },
  rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'rfq_id' },
};
```

**Reasoning**: WatermelonDB convention - child models use singular keys, parent models use plural
**Result**: ❌ Failed - Same error persists

---

### Attempt 5: Add Missing Associations
**What we tried:**

**VendorModel.ts** - Added missing association:
```typescript
static associations = {
  rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'vendor_id' },
};
```

**DoorsPackageModel.ts** - Added RFQ association:
```typescript
static associations: Associations = {
  project: { type: 'belongs_to', key: 'project_id' },
  requirements: { type: 'has_many', foreignKey: 'doors_package_id' },
  bom_items: { type: 'has_many', foreignKey: 'doors_id' },
  rfqs: { type: 'has_many', foreignKey: 'doors_package_id' },
};
```

**Reasoning**: Bidirectional relationships must be defined on both sides
**Result**: ❌ Failed - Same error persists

---

### Attempt 6: Remove Unused Associations
**What we tried:**

**RfqModel.ts** - Removed doors_package association:
```typescript
// Before
static associations = {
  doors_package: { type: 'belongs_to' as const, key: 'doors_package_id' },
  rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'rfq_id' },
};

// After
static associations = {
  rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'rfq_id' },
};
```

**DoorsPackageModel.ts** - Removed rfqs association:
```typescript
// Before
static associations: Associations = {
  project: { type: 'belongs_to', key: 'project_id' },
  requirements: { type: 'has_many', foreignKey: 'doors_package_id' },
  bom_items: { type: 'has_many', foreignKey: 'doors_id' },
  rfqs: { type: 'has_many', foreignKey: 'doors_package_id' },
};

// After
static associations: Associations = {
  project: { type: 'belongs_to', key: 'project_id' },
  requirements: { type: 'has_many', foreignKey: 'doors_package_id' },
  bom_items: { type: 'has_many', foreignKey: 'doors_id' },
};
```

**Reasoning**: Has_many without @children decorator might cause issues
**Result**: ❌ Failed - Same error persists

---

### Attempt 7: Complete Database Reset
**What we tried:**
```bash
# Clear all app data including database
adb shell pm clear com.site_progress_tracker

# Clear Metro bundler cache
npm start -- --reset-cache

# Rebuild app
```

**Reasoning**: Cached model definitions in WatermelonDB database
**Result**: ❌ Failed - Same error persists even with fresh database

---

### Attempt 8: Remove @relation Decorators
**What we tried:**

**RfqModel.ts** - Removed @relation decorator:
```typescript
// Before
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import DoorsPackageModel from './DoorsPackageModel';

// Relationships
@relation('doors_packages', 'doors_package_id') doorsPackage!: DoorsPackageModel;

// After
import { field, readonly, date } from '@nozbe/watermelondb/decorators';
// No imports or decorators for DoorsPackageModel
```

**Reasoning**: @relation decorators are optional (SiteModel works without them)
**Result**: ❌ Failed - Same error persists

---

## Current State of Models

### RfqModel.ts (Final State)
```typescript
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class RfqModel extends Model {
  static table = 'rfqs';

  static associations = {
    rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'rfq_id' },
  };

  @field('rfq_number') rfqNumber!: string;
  @field('doors_id') doorsId!: string;
  @field('doors_package_id') doorsPackageId!: string;
  @field('project_id') projectId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('status') status!: string;
  @field('issue_date') issueDate?: number;
  @field('closing_date') closingDate?: number;
  @field('evaluation_date') evaluationDate?: number;
  @field('award_date') awardDate?: number;
  @field('expected_delivery_days') expectedDeliveryDays?: number;
  @field('technical_specifications') technicalSpecifications?: string;
  @field('commercial_terms') commercialTerms?: string;
  @field('total_vendors_invited') totalVendorsInvited!: number;
  @field('total_quotes_received') totalQuotesReceived!: number;
  @field('winning_vendor_id') winningVendorId?: string;
  @field('winning_quote_id') winningQuoteId?: string;
  @field('awarded_value') awardedValue?: number;
  @field('created_by_id') createdById!: string;
  @field('evaluated_by_id') evaluatedById?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;
}
```

### RfqVendorQuoteModel.ts (Final State)
```typescript
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import RfqModel from './RfqModel';
import VendorModel from './VendorModel';

export default class RfqVendorQuoteModel extends Model {
  static table = 'rfq_vendor_quotes';

  static associations = {
    rfq: { type: 'belongs_to' as const, key: 'rfq_id' },
    vendor: { type: 'belongs_to' as const, key: 'vendor_id' },
  };

  @field('rfq_id') rfqId!: string;
  @field('vendor_id') vendorId!: string;
  @field('quote_reference') quoteReference?: string;
  @field('quoted_price') quotedPrice!: number;
  @field('currency') currency!: string;
  @field('lead_time_days') leadTimeDays!: number;
  @field('validity_days') validityDays!: number;
  @field('payment_terms') paymentTerms?: string;
  @field('warranty_months') warrantyMonths?: number;
  @field('technical_compliance_percentage') technicalCompliancePercentage!: number;
  @field('technical_deviations') technicalDeviations?: string;
  @field('commercial_deviations') commercialDeviations?: string;
  @field('notes') notes?: string;
  @field('attachments') attachments?: string;
  @field('status') status!: string;
  @field('technical_score') technicalScore?: number;
  @field('commercial_score') commercialScore?: number;
  @field('overall_score') overallScore?: number;
  @field('rank') rank?: number;
  @field('submitted_at') submittedAt?: number;
  @field('evaluated_at') evaluatedAt?: number;
  @field('evaluated_by_id') evaluatedById?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  // Relationships
  @relation('rfq', 'rfq_id') rfq!: RfqModel;
  @relation('vendor', 'vendor_id') vendor!: VendorModel;
}
```

### VendorModel.ts (Final State)
```typescript
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class VendorModel extends Model {
  static table = 'vendors';

  static associations = {
    rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'vendor_id' },
  };

  @field('vendor_code') vendorCode!: string;
  @field('vendor_name') vendorName!: string;
  @field('category') category!: string;
  @field('contact_person') contactPerson?: string;
  @field('email') email?: string;
  @field('phone') phone?: string;
  @field('address') address?: string;
  @field('rating') rating?: number;
  @field('is_approved') isApproved!: boolean;
  @field('performance_score') performanceScore?: number;
  @field('last_delivery_date') lastDeliveryDate?: number;
  @field('total_orders') totalOrders!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;
}
```

### DoorsPackageModel.ts (Final State)
```typescript
static associations: Associations = {
  project: { type: 'belongs_to', key: 'project_id' },
  requirements: { type: 'has_many', foreignKey: 'doors_package_id' },
  bom_items: { type: 'has_many', foreignKey: 'doors_id' },
};

// Relationships
@relation('projects', 'project_id') project: any;
@children('doors_requirements') requirements: any; // Has many requirements
```

---

## Other Fixes Applied Successfully

### 1. Readonly Fields Error (FIXED ✅)
**Error**: "Attempt to set new value on a property createdAt marked as @readonly"
**Fix**: Removed all manual `createdAt` and `updatedAt` assignments from RfqSeeder.ts
**Result**: Demo data loads successfully

### 2. React Hooks Order Error (FIXED ✅)
**Error**: "React has detected a change in the order of Hooks"
**Fix**: Extracted `QuoteCard` component from nested render function in RfqDetailScreen.tsx
**Result**: RFQ Detail screen loads without errors

### 3. DOORS Package Modal Empty (FIXED ✅)
**Error**: Modal shows count but no list items
**Fix**: Changed `maxHeight: '80%'` to `height: '80%'` in modal styling
**Result**: DOORS packages display correctly in modal

### 4. User Property Reference (FIXED ✅)
**Error**: TypeScript error accessing `user?.id`
**Fix**: Changed to `user?.userId` to match AuthContext type
**Result**: No TypeScript errors

---

## Observations

### What Works
1. ✅ **RFQ List Screen** - Displays RFQs correctly
2. ✅ **RFQ Detail Screen** - Shows RFQ details with 3 tabs
3. ✅ **RFQ Demo Data Loading** - Successfully creates 5 RFQs with quotes
4. ✅ **DOORS Integration** - DOORS packages load and display
5. ✅ **Vendor Management** - Vendors load correctly

### What Doesn't Work
1. ❌ **RFQ Creation** - Cannot create new RFQ manually
2. ❌ **RFQ Issuing** - Cannot issue newly created RFQ

### Key Findings
1. Error occurs at **Step 1** (creating RFQ), not Step 3 (issuing RFQ)
2. Error happens when accessing `doorsPackage.requirements.fetch()` in RfqService.ts:98
3. Demo data RFQs work fine (created via RfqSeeder)
4. Error persists even with:
   - Fresh database (pm clear)
   - Metro cache reset
   - Complete app rebuild
   - All association changes

---

## Comparison: Working vs Non-Working Models

### Working: BomModel ↔ BomItemModel
```typescript
// BomModel.ts
static associations: Associations = {
  project: { type: 'belongs_to', key: 'project_id' },
  items: { type: 'has_many', foreignKey: 'bom_id' },
};
@children('bom_items') bomItems: any;

// BomItemModel.ts
static associations: Associations = {
  bom: { type: 'belongs_to', key: 'bom_id' },
  material: { type: 'belongs_to', key: 'material_id' },
};
// No @relation decorator
```

### Working: DoorsPackageModel ↔ DoorsRequirementModel
```typescript
// DoorsPackageModel.ts
static associations: Associations = {
  project: { type: 'belongs_to', key: 'project_id' },
  requirements: { type: 'has_many', foreignKey: 'doors_package_id' },
  bom_items: { type: 'has_many', foreignKey: 'doors_id' },
};
@children('doors_requirements') requirements: any;

// DoorsRequirementModel.ts
static associations: Associations = {
  doors_package: { type: 'belongs_to', key: 'doors_package_id' },
  created_by_user: { type: 'belongs_to', key: 'created_by' },
  reviewed_by_user: { type: 'belongs_to', key: 'reviewed_by' },
};
// No @relation decorator
```

### Not Working: RfqModel ↔ RfqVendorQuoteModel
```typescript
// RfqModel.ts
static associations = {
  rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'rfq_id' },
};
// NO @children decorator (tried with and without - both fail)

// RfqVendorQuoteModel.ts
static associations = {
  rfq: { type: 'belongs_to' as const, key: 'rfq_id' },
  vendor: { type: 'belongs_to' as const, key: 'vendor_id' },
};
@relation('rfq', 'rfq_id') rfq!: RfqModel;
@relation('vendor', 'vendor_id') vendor!: VendorModel;
```

**Pattern Difference**: RfqVendorQuoteModel uses `@relation` decorators, while BomItemModel and DoorsRequirementModel don't.

---

## Debugging Tools Used

### 1. Enhanced Logging
Added detailed step-by-step logging in RfqCreateScreen.tsx:
```typescript
console.log('[RfqCreate] Step 1: Creating RFQ...');
const rfq = await RfqService.createRfq(...);
console.log('[RfqCreate] Step 2: RFQ created successfully, ID:', rfq.id);
console.log('[RfqCreate] Step 3: Issuing RFQ...');
await RfqService.issueRfq(rfq.id);
console.log('[RfqCreate] Step 4: RFQ issued successfully');
```
**Result**: Confirmed error occurs at Step 1, before Step 2 is reached

### 2. TypeScript Compilation Check
```bash
npx tsc --noEmit 2>&1 | grep -i "rfq\|vendor"
```
**Result**: Only test file errors, no model errors

### 3. Search for @children Decorators
```bash
grep -r "@children" models/ --include="*.ts"
```
**Result**: Only 2 found - BomModel and DoorsPackageModel (both working)

### 4. Association Verification
```bash
grep -A2 "static associations" models/RfqModel.ts models/VendorModel.ts models/RfqVendorQuoteModel.ts
```
**Result**: All associations properly defined

---

## Hypotheses (Unverified)

### Hypothesis 1: Schema Migration Issue
**Theory**: Schema v28 not properly applied to create rfq tables
**Counter-evidence**: Demo data successfully creates RFQs, so tables exist

### Hypothesis 2: Circular Dependency
**Theory**: Circular import between RfqModel ↔ RfqVendorQuoteModel
**Counter-evidence**: Other models have similar patterns and work

### Hypothesis 3: @relation Decorator Incompatibility
**Theory**: @relation decorators on RfqVendorQuoteModel conflict with has_many
**Counter-evidence**: Removing didn't help

### Hypothesis 4: WatermelonDB Version Bug
**Theory**: Specific version has bug with certain association patterns
**Status**: Not verified - need to check package.json

### Hypothesis 5: has_many Without @children
**Theory**: WatermelonDB requires @children for every has_many
**Counter-evidence**: DoorsPackageModel has `bom_items` has_many without @children and works

### Hypothesis 6: Error Message is Misleading
**Theory**: Real issue is elsewhere, error message points to wrong location
**Status**: Possible - error says "@children" but we don't have any @children in RfqModel

---

## Next Steps for Future Investigation

### 1. Check WatermelonDB Version
```bash
grep watermelondb package.json
```
Look for known issues with @children decorator in that version

### 2. Try Adding @children with 'any' Type
Add back to RfqModel:
```typescript
@children('rfq_vendor_quotes') quotes: any;
```
Even though we don't use it, WatermelonDB might require it

### 3. Try Removing @relation Decorators
From RfqVendorQuoteModel, remove:
```typescript
@relation('rfq', 'rfq_id') rfq!: RfqModel;
@relation('vendor', 'vendor_id') vendor!: VendorModel;
```
Match pattern of BomItemModel/DoorsRequirementModel

### 4. Create Minimal Reproduction
Create simple test case with just 2 tables to isolate issue:
```typescript
// TestParentModel
static associations = {
  test_children: { type: 'has_many', foreignKey: 'parent_id' },
};

// TestChildModel
static associations = {
  test_parent: { type: 'belongs_to', key: 'parent_id' },
};
@relation('test_parent', 'parent_id') parent!: TestParentModel;
```

### 5. Check WatermelonDB Source Code
Look at actual error source in WatermelonDB library:
```
node_modules/@nozbe/watermelondb/decorators/children/index.js
```

### 6. Try Alternative Approach: Query Instead of @children
Instead of:
```typescript
const requirements = await doorsPackage.requirements.fetch();
```
Try:
```typescript
const requirements = await database.collections
  .get('doors_requirements')
  .query(Q.where('doors_package_id', doorsPackage.id))
  .fetch();
```

### 7. Check for Model Registration Issues
Verify all models are registered in database.ts in correct order

### 8. Enable WatermelonDB Debug Mode
Add to app initialization:
```typescript
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import logger from '@nozbe/watermelondb/utils/common/logger';
logger.setLevel('verbose');
```

---

## Files Modified During Investigation

### Models
- `models/RfqModel.ts` - Multiple changes to associations and decorators
- `models/RfqVendorQuoteModel.ts` - Changed association keys from plural to singular
- `models/VendorModel.ts` - Added rfq_vendor_quotes association
- `models/DoorsPackageModel.ts` - Added then removed rfqs association

### Services
- `src/services/RfqService.ts` - No changes (error occurs here but code is correct)

### Screens
- `src/logistics/RfqCreateScreen.tsx` - Added detailed logging
- `src/logistics/RfqDetailScreen.tsx` - Fixed React Hooks order (unrelated bug)
- `src/logistics/RfqListScreen.tsx` - Fixed user.id → user.userId (unrelated bug)

### Demo Data
- `src/utils/demoData/RfqSeeder.ts` - Removed createdAt/updatedAt assignments (unrelated bug)

### Tests
- `__tests__/rfq-smoke.test.ts` - Created (14/20 passing)
- `__tests__/services/RfqService.test.ts` - Created (has compilation errors)
- `__tests__/integration/RfqSeeder.integration.test.ts` - Created

---

## Reference: Error Stack Location

Based on error message and testing:
1. User clicks "Issue RFQ" in RfqCreateScreen.tsx:240
2. Calls RfqService.createRfq() at line 87
3. Fetches doorsPackage at line 89: `await this.doorsPackagesCollection.find(data.doorsPackageId)`
4. **ERROR OCCURS** at line 98: `await doorsPackage.requirements.fetch()`
5. Never reaches line 101: `await database.write()`

---

## Workaround: Demo Data Works

**Current Functional State**:
- ✅ Demo RFQs load successfully via "Load Demo Data" button
- ✅ RFQ List displays all RFQs
- ✅ RFQ Detail shows complete information
- ✅ All manual testing scenarios work EXCEPT creating new RFQ

**Workaround for Testing**:
Use demo data RFQs for testing RFQ Detail, evaluation, and award flows.

---

## Contact & References

**WatermelonDB Documentation**: https://nozbe.github.io/WatermelonDB/
**Issue Tracking**: Phase 3 Day 6 - RFQ Creation Blocked
**Related Files**:
- `docs/Phase_3_Day_6_FINAL.md`
- `docs/Phase_3_Testing_Summary.md`
- `docs/V2.3_FEATURE_SUMMARY.md`

---

## Conclusion

After 8 different approaches and multiple hours of investigation, the "@children decorator" error remains unresolved. The error message appears to be misleading, as RfqModel doesn't have a @children decorator. The issue likely lies in:

1. WatermelonDB's internal validation of associations
2. A subtle incompatibility with the specific association pattern used
3. Possibly a version-specific bug in WatermelonDB

**Recommendation**:
- Continue with other Phase 3 work using demo data for testing
- Schedule dedicated time for deep dive with fresh perspective
- Consider reaching out to WatermelonDB community/GitHub issues
- Explore alternative approaches (direct queries without relationships)

**Impact**:
- **High** - Blocks manual RFQ creation
- **Medium** - Demo data provides workaround for testing
- **Low** - Does not affect other features or data persistence
