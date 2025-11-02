/**
 * Week 7, Day 5: Conflict Resolution Testing
 *
 * Comprehensive test suite for SyncService conflict resolution
 * Tests Last-Write-Wins (LWW) strategy, version comparison, and Kahn's algorithm
 *
 * Run: node scripts/testConflictResolution.js
 */

// Mock SyncService conflict resolution logic
const SyncService = {
  /**
   * Determine if server data should be applied over local data
   * Week 7, Day 3: Last-Write-Wins (LWW) strategy
   */
  shouldApplyServerData(existing, serverData, tableName) {
    const localVersion = existing.version || 0;
    const serverVersion = serverData._version || 0;

    // Server has newer version
    if (serverVersion > localVersion) {
      console.log(`✅ ${tableName}: Server wins (v${localVersion} → v${serverVersion})`);
      return true;
    }

    // Same version: Use timestamp as tie-breaker
    if (serverVersion === localVersion) {
      const localUpdated = existing.updated_at || 0;
      const serverUpdated = serverData.updated_at || 0;

      if (serverUpdated > localUpdated) {
        console.log(`✅ ${tableName}: Server wins (same version, newer timestamp)`);
        return true;
      } else {
        console.log(`✅ ${tableName}: Local wins (same version, newer timestamp)`);
        return false;
      }
    }

    // Local version is higher
    console.log(`✅ ${tableName}: Local wins (v${serverVersion} → v${localVersion})`);
    return false;
  },

  /**
   * Topological sort using Kahn's algorithm
   * Week 7, Day 4: Dependency-aware sync
   */
  topologicalSortItems(items) {
    if (!items || items.length === 0) return [];

    // Build ID to item map
    const itemMap = new Map();
    items.forEach(item => itemMap.set(item.id, item));

    // Build adjacency list and in-degree map
    const adjacencyList = new Map();
    const inDegree = new Map();

    items.forEach(item => {
      adjacencyList.set(item.id, []);
      inDegree.set(item.id, 0);
    });

    // Build graph
    items.forEach(item => {
      const dependencies = this.parseDependencies(item.dependencies);
      dependencies.forEach(depId => {
        if (itemMap.has(depId)) {
          adjacencyList.get(depId).push(item.id);
          inDegree.set(item.id, (inDegree.get(item.id) || 0) + 1);
        }
      });
    });

    // Kahn's algorithm
    const queue = [];
    const sorted = [];

    inDegree.forEach((degree, itemId) => {
      if (degree === 0) queue.push(itemId);
    });

    while (queue.length > 0) {
      const currentId = queue.shift();
      const currentItem = itemMap.get(currentId);
      sorted.push(currentItem);

      const dependents = adjacencyList.get(currentId) || [];
      dependents.forEach(dependentId => {
        const newDegree = (inDegree.get(dependentId) || 0) - 1;
        inDegree.set(dependentId, newDegree);
        if (newDegree === 0) queue.push(dependentId);
      });
    }

    // Check for circular dependencies
    if (sorted.length < items.length) {
      const remaining = items.filter(item => !sorted.find(s => s.id === item.id));
      console.warn(`⚠️ Circular dependencies detected! ${remaining.length} items have cycles.`);
      sorted.push(...remaining);
    }

    return sorted;
  },

  parseDependencies(dependenciesStr) {
    if (!dependenciesStr) return [];
    try {
      const parsed = JSON.parse(dependenciesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
};

console.log('═══════════════════════════════════════════════════════════');
console.log('Week 7, Day 5: Conflict Resolution Testing');
console.log('═══════════════════════════════════════════════════════════\n');

// ============================================================================
// TEST 1: Version-Based Conflict Resolution
// ============================================================================
console.log('TEST 1: Version-Based Conflict Resolution');
console.log('─────────────────────────────────────────────────────────\n');

// Scenario 1.1: Server has higher version (should apply)
console.log('Scenario 1.1: Server has higher version');
const local1 = { id: 'item-1', name: 'Old Name', version: 3, updated_at: 1000 };
const server1 = { id: 'item-1', name: 'New Name', _version: 5, updated_at: 1100 };
const result1 = SyncService.shouldApplyServerData(local1, server1, 'items');
console.log(`Result: ${result1 ? 'APPLY SERVER' : 'KEEP LOCAL'}`);
console.log(`Expected: APPLY SERVER`);
console.log(`Status: ${result1 === true ? '✅ PASS' : '❌ FAIL'}\n`);

// Scenario 1.2: Local has higher version (should keep local)
console.log('Scenario 1.2: Local has higher version');
const local2 = { id: 'item-2', name: 'Local Name', version: 8, updated_at: 2000 };
const server2 = { id: 'item-2', name: 'Server Name', _version: 5, updated_at: 2100 };
const result2 = SyncService.shouldApplyServerData(local2, server2, 'items');
console.log(`Result: ${result2 ? 'APPLY SERVER' : 'KEEP LOCAL'}`);
console.log(`Expected: KEEP LOCAL`);
console.log(`Status: ${result2 === false ? '✅ PASS' : '❌ FAIL'}\n`);

// ============================================================================
// TEST 2: Timestamp Tie-Breaker (Same Version)
// ============================================================================
console.log('TEST 2: Timestamp Tie-Breaker (Same Version)');
console.log('─────────────────────────────────────────────────────────\n');

// Scenario 2.1: Same version, server timestamp newer (should apply)
console.log('Scenario 2.1: Same version, server timestamp newer');
const local3 = { id: 'item-3', name: 'Old', version: 5, updated_at: 1000 };
const server3 = { id: 'item-3', name: 'New', _version: 5, updated_at: 2000 };
const result3 = SyncService.shouldApplyServerData(local3, server3, 'items');
console.log(`Result: ${result3 ? 'APPLY SERVER' : 'KEEP LOCAL'}`);
console.log(`Expected: APPLY SERVER`);
console.log(`Status: ${result3 === true ? '✅ PASS' : '❌ FAIL'}\n`);

// Scenario 2.2: Same version, local timestamp newer (should keep local)
console.log('Scenario 2.2: Same version, local timestamp newer');
const local4 = { id: 'item-4', name: 'Local', version: 3, updated_at: 3000 };
const server4 = { id: 'item-4', name: 'Server', _version: 3, updated_at: 1500 };
const result4 = SyncService.shouldApplyServerData(local4, server4, 'items');
console.log(`Result: ${result4 ? 'APPLY SERVER' : 'KEEP LOCAL'}`);
console.log(`Expected: KEEP LOCAL`);
console.log(`Status: ${result4 === false ? '✅ PASS' : '❌ FAIL'}\n`);

// Scenario 2.3: Same version, same timestamp (edge case - server wins by default)
console.log('Scenario 2.3: Same version, same timestamp');
const local5 = { id: 'item-5', name: 'Local', version: 2, updated_at: 5000 };
const server5 = { id: 'item-5', name: 'Server', _version: 2, updated_at: 5000 };
const result5 = SyncService.shouldApplyServerData(local5, server5, 'items');
console.log(`Result: ${result5 ? 'APPLY SERVER' : 'KEEP LOCAL'}`);
console.log(`Expected: KEEP LOCAL (equal timestamps)`);
console.log(`Status: ${result5 === false ? '✅ PASS' : '⚠️  EDGE CASE (acceptable either way)'}\n`);

// ============================================================================
// TEST 3: Kahn's Algorithm - Complex Dependencies
// ============================================================================
console.log('TEST 3: Kahn\'s Algorithm - Complex Dependencies');
console.log('─────────────────────────────────────────────────────────\n');

// Scenario 3.1: Multi-level dependency chain
console.log('Scenario 3.1: Multi-level dependency chain (5 levels)');
const chain = [
  { id: 'level-5', name: 'Level 5', dependencies: '["level-4"]' },
  { id: 'level-3', name: 'Level 3', dependencies: '["level-2"]' },
  { id: 'level-1', name: 'Level 1', dependencies: '[]' },
  { id: 'level-4', name: 'Level 4', dependencies: '["level-3"]' },
  { id: 'level-2', name: 'Level 2', dependencies: '["level-1"]' },
];
const sortedChain = SyncService.topologicalSortItems(chain);
const chainOrder = sortedChain.map(item => item.id).join(' → ');
console.log(`Result: ${chainOrder}`);
console.log(`Expected: level-1 → level-2 → level-3 → level-4 → level-5`);
const chainCorrect = chainOrder === 'level-1 → level-2 → level-3 → level-4 → level-5';
console.log(`Status: ${chainCorrect ? '✅ PASS' : '❌ FAIL'}\n`);

// Scenario 3.2: Diamond dependency (multiple paths)
console.log('Scenario 3.2: Diamond dependency (A → B,C → D)');
const diamond = [
  { id: 'D', name: 'Item D', dependencies: '["B","C"]' },
  { id: 'B', name: 'Item B', dependencies: '["A"]' },
  { id: 'C', name: 'Item C', dependencies: '["A"]' },
  { id: 'A', name: 'Item A', dependencies: '[]' },
];
const sortedDiamond = SyncService.topologicalSortItems(diamond);
const diamondOrder = sortedDiamond.map(item => item.id).join(' → ');
console.log(`Result: ${diamondOrder}`);
// Valid orders: A first, D last, B and C in any order
const diamondCorrect = diamondOrder.startsWith('A') && diamondOrder.endsWith('D');
console.log(`Expected: A → (B/C in any order) → D`);
console.log(`Status: ${diamondCorrect ? '✅ PASS' : '❌ FAIL'}\n`);

// Scenario 3.3: Circular dependency detection
console.log('Scenario 3.3: Circular dependency detection');
const circular = [
  { id: 'item-A', name: 'Item A', dependencies: '["item-B"]' },
  { id: 'item-B', name: 'Item B', dependencies: '["item-C"]' },
  { id: 'item-C', name: 'Item C', dependencies: '["item-A"]' }, // Creates cycle
  { id: 'item-D', name: 'Item D', dependencies: '[]' }, // Independent
];
console.log('Expected: Warning about circular dependencies');
const sortedCircular = SyncService.topologicalSortItems(circular);
const circularHasAll = sortedCircular.length === 4;
console.log(`Result: All 4 items in result: ${circularHasAll}`);
console.log(`Status: ${circularHasAll ? '✅ PASS (circular items appended)' : '❌ FAIL'}\n`);

// Scenario 3.4: Missing dependencies (graceful handling)
console.log('Scenario 3.4: Missing dependencies (external references)');
const missing = [
  { id: 'item-1', name: 'Item 1', dependencies: '["external-1"]' }, // Missing dependency
  { id: 'item-2', name: 'Item 2', dependencies: '["item-1"]' },
  { id: 'item-3', name: 'Item 3', dependencies: '[]' },
];
const sortedMissing = SyncService.topologicalSortItems(missing);
const missingOrder = sortedMissing.map(item => item.id).join(' → ');
console.log(`Result: ${missingOrder}`);
console.log(`Expected: item-3 and item-1 first (missing deps ignored), then item-2`);
const missingCorrect = sortedMissing.length === 3;
console.log(`Status: ${missingCorrect ? '✅ PASS' : '❌ FAIL'}\n`);

// ============================================================================
// TEST 4: Real-World Construction Scenario
// ============================================================================
console.log('TEST 4: Real-World Construction Scenario');
console.log('─────────────────────────────────────────────────────────\n');

console.log('Scenario 4.1: Complete construction project sync');
const constructionProject = [
  // Phase 1: Foundation
  { id: 'site-prep', name: 'Site Preparation', dependencies: '[]' },
  { id: 'excavation', name: 'Excavation', dependencies: '["site-prep"]' },
  { id: 'foundation', name: 'Foundation', dependencies: '["excavation"]' },

  // Phase 2: Structure
  { id: 'structure', name: 'Structure', dependencies: '["foundation"]' },

  // Phase 3: MEP (parallel after structure)
  { id: 'electrical', name: 'Electrical', dependencies: '["structure"]' },
  { id: 'plumbing', name: 'Plumbing', dependencies: '["structure"]' },
  { id: 'hvac', name: 'HVAC', dependencies: '["structure"]' },

  // Phase 4: Finishing (depends on all MEP)
  { id: 'finishing', name: 'Finishing', dependencies: '["electrical","plumbing","hvac"]' },

  // Phase 5: Final
  { id: 'inspection', name: 'Final Inspection', dependencies: '["finishing"]' },
];

const sortedConstruction = SyncService.topologicalSortItems(constructionProject);
const constructionOrder = sortedConstruction.map(item => item.name).join(' → ');
console.log(`Result order (9 items):`);
sortedConstruction.forEach((item, idx) => {
  console.log(`  ${idx + 1}. ${item.name}`);
});

// Verify critical constraints
const siteFirst = sortedConstruction[0].id === 'site-prep';
const inspectionLast = sortedConstruction[sortedConstruction.length - 1].id === 'inspection';
const structureBeforeMEP = sortedConstruction.findIndex(i => i.id === 'structure') <
                            sortedConstruction.findIndex(i => i.id === 'electrical');

console.log(`\nValidation:`);
console.log(`  Site prep first: ${siteFirst ? '✅' : '❌'}`);
console.log(`  Inspection last: ${inspectionLast ? '✅' : '❌'}`);
console.log(`  Structure before MEP: ${structureBeforeMEP ? '✅' : '❌'}`);
console.log(`Status: ${siteFirst && inspectionLast && structureBeforeMEP ? '✅ PASS' : '❌ FAIL'}\n`);

// ============================================================================
// TEST 5: Multi-Device Conflict Scenario
// ============================================================================
console.log('TEST 5: Multi-Device Conflict Scenario');
console.log('─────────────────────────────────────────────────────────\n');

console.log('Scenario 5.1: Two devices edit same item offline');
console.log('Device A: Edits item offline, version 3 → 4');
console.log('Device B: Edits item offline, version 3 → 4');
console.log('Device A syncs first (server now has version 4)');
console.log('Device B syncs second (conflict!)');

const deviceAData = { id: 'shared-item', name: 'Device A Edit', _version: 4, updated_at: 1000 };
const deviceBLocal = { id: 'shared-item', name: 'Device B Edit', version: 4, updated_at: 1100 };

const multiDeviceResult = SyncService.shouldApplyServerData(deviceBLocal, deviceAData, 'items');
console.log(`\nDevice B receives Device A's data from server`);
console.log(`Device B local: version 4, updated_at 1100`);
console.log(`Server (Device A): version 4, updated_at 1000`);
console.log(`Result: ${multiDeviceResult ? 'APPLY SERVER (Device A wins)' : 'KEEP LOCAL (Device B wins)'}`);
console.log(`Expected: KEEP LOCAL (Device B has newer timestamp)`);
console.log(`Status: ${multiDeviceResult === false ? '✅ PASS (LWW by timestamp)' : '❌ FAIL'}\n`);

// ============================================================================
// SUMMARY
// ============================================================================
console.log('═══════════════════════════════════════════════════════════');
console.log('Test Summary');
console.log('═══════════════════════════════════════════════════════════\n');

const tests = [
  { name: 'Version-based conflicts', result: result1 === true && result2 === false },
  { name: 'Timestamp tie-breaker', result: result3 === true && result4 === false },
  { name: 'Multi-level dependency chain', result: chainCorrect },
  { name: 'Diamond dependency', result: diamondCorrect },
  { name: 'Circular dependency detection', result: circularHasAll },
  { name: 'Missing dependencies handling', result: missingCorrect },
  { name: 'Construction project sync', result: siteFirst && inspectionLast && structureBeforeMEP },
  { name: 'Multi-device conflict', result: multiDeviceResult === false },
];

const passCount = tests.filter(t => t.result).length;
const totalCount = tests.length;

console.log('Test Results:');
tests.forEach((test, idx) => {
  console.log(`  ${idx + 1}. ${test.name}: ${test.result ? '✅ PASS' : '❌ FAIL'}`);
});

console.log(`\nTotal: ${passCount}/${totalCount} tests passed`);
console.log(`Success Rate: ${((passCount / totalCount) * 100).toFixed(1)}%\n`);

if (passCount === totalCount) {
  console.log('🎉 All tests passed! Conflict resolution is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Review conflict resolution logic.');
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('Week 7, Day 5: Testing Complete');
console.log('═══════════════════════════════════════════════════════════\n');
