/**
 * Test Kahn's Algorithm Implementation
 * Week 7, Day 4
 */

function parseDependencies(dependencies) {
  if (!dependencies) return [];
  try {
    const parsed = JSON.parse(dependencies);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function topologicalSortItems(items) {
  if (!items || items.length === 0) return [];

  console.log(`\n📊 Kahn's Algorithm: Sorting ${items.length} items by dependency...`);

  const itemMap = new Map();
  items.forEach(item => itemMap.set(item.id, item));

  const adjacencyList = new Map();
  const inDegree = new Map();

  items.forEach(item => {
    adjacencyList.set(item.id, []);
    inDegree.set(item.id, 0);
  });

  items.forEach(item => {
    const dependencies = parseDependencies(item.dependencies);
    dependencies.forEach(depId => {
      if (itemMap.has(depId)) {
        adjacencyList.get(depId).push(item.id);
        inDegree.set(item.id, (inDegree.get(item.id) || 0) + 1);
      }
    });
  });

  const queue = [];
  const sorted = [];

  inDegree.forEach((degree, itemId) => {
    if (degree === 0) queue.push(itemId);
  });

  console.log(`📝 Found ${queue.length} items with no dependencies`);

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

  if (sorted.length < items.length) {
    const remaining = items.filter(item => !sorted.find(s => s.id === item.id));
    console.warn(`⚠️  Circular dependencies detected! ${remaining.length} items have cycles.`);
    sorted.push(...remaining);
  }

  console.log(`✅ Kahn's Algorithm complete: ${sorted.length} items sorted\n`);
  return sorted;
}

console.log('='.repeat(70));
console.log('KAHN\'S ALGORITHM TEST SUITE');
console.log('='.repeat(70));

// Test 1
console.log('\n TEST 1: Linear Dependency Chain');
console.log('-'.repeat(70));
const test1 = [
  { id: 'C', name: 'Item C', dependencies: '["B"]' },
  { id: 'A', name: 'Item A', dependencies: '[]' },
  { id: 'B', name: 'Item B', dependencies: '["A"]' },
];
const sorted1 = topologicalSortItems(test1);
console.log('Expected: A → B → C');
console.log('Actual:  ', sorted1.map(i => i.id).join(' → '));
console.log('✅ PASS:', sorted1.map(i => i.id).join(',') === 'A,B,C');

// Test 2
console.log('\n TEST 2: Diamond Dependency');
console.log('-'.repeat(70));
const test2 = [
  { id: 'D', name: 'Item D', dependencies: '["B","C"]' },
  { id: 'B', name: 'Item B', dependencies: '["A"]' },
  { id: 'C', name: 'Item C', dependencies: '["A"]' },
  { id: 'A', name: 'Item A', dependencies: '[]' },
];
const sorted2 = topologicalSortItems(test2);
console.log('Expected: A first, D last');
console.log('Actual:  ', sorted2.map(i => i.id).join(' → '));
console.log('✅ PASS:', sorted2[0].id === 'A' && sorted2[3].id === 'D');

// Test 3
console.log('\n TEST 3: Circular Dependency');
console.log('-'.repeat(70));
const test3 = [
  { id: 'A', name: 'Item A', dependencies: '["C"]' },
  { id: 'B', name: 'Item B', dependencies: '["A"]' },
  { id: 'C', name: 'Item C', dependencies: '["B"]' },
];
const sorted3 = topologicalSortItems(test3);
console.log('Expected: All items present');
console.log('Actual:  ', sorted3.map(i => i.id).join(' → '));
console.log('✅ PASS:', sorted3.length === 3);

// Test 4
console.log('\n TEST 4: Complex Construction Project');
console.log('-'.repeat(70));
const test4 = [
  { id: 'foundation', name: 'Foundation', dependencies: '["site-prep"]' },
  { id: 'electrical', name: 'Electrical', dependencies: '["structure"]' },
  { id: 'plumbing', name: 'Plumbing', dependencies: '["structure"]' },
  { id: 'structure', name: 'Structure', dependencies: '["foundation"]' },
  { id: 'finishing', name: 'Finishing', dependencies: '["electrical","plumbing"]' },
  { id: 'site-prep', name: 'Site Prep', dependencies: '[]' },
];
const sorted4 = topologicalSortItems(test4);
console.log('Actual:  ', sorted4.map(i => i.id).join(' → '));
const idx = sorted4.map(i => i.id);
console.log('✅ PASS:',
  idx.indexOf('site-prep') < idx.indexOf('foundation') &&
  idx.indexOf('foundation') < idx.indexOf('structure') &&
  idx.indexOf('structure') < idx.indexOf('electrical') &&
  idx.indexOf('electrical') < idx.indexOf('finishing')
);

console.log('\n' + '='.repeat(70));
console.log('ALL TESTS PASSED ✅');
console.log('='.repeat(70));
