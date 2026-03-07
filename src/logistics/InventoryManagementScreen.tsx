/**
 * InventoryManagementScreen
 *
 * Real-data inventory view. Reads MaterialModel records from LogisticsContext
 * and shows stock levels: available vs required vs used.
 * Status: delivered/in_use = in stock, ordered = pending, shortage = low stock.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { COLORS } from '../theme/colors';
import { database } from '../../models/database';

// ── Types ─────────────────────────────────────────────────────────────────────

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'ordered' | 'shortage';

const FILTER_CHIPS: { id: StockFilter; label: string; color: string }[] = [
  { id: 'all',      label: 'All',      color: COLORS.PRIMARY },
  { id: 'in_stock', label: 'In Stock', color: COLORS.SUCCESS },
  { id: 'low_stock',label: 'Low',      color: COLORS.WARNING },
  { id: 'ordered',  label: 'Ordered',  color: COLORS.INFO },
  { id: 'shortage', label: 'Shortage', color: COLORS.ERROR },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map MaterialModel status + qty ratio → stock filter category
 */
const getStockCategory = (status: string, available: number, required: number): StockFilter => {
  if (status === 'shortage') return 'shortage';
  if (status === 'ordered')  return 'ordered';
  if (required === 0) return 'in_stock';
  const ratio = available / required;
  if (ratio >= 0.7) return 'in_stock';
  return 'low_stock';
};

const getStockColor = (cat: StockFilter) => {
  switch (cat) {
    case 'in_stock':  return COLORS.SUCCESS;
    case 'low_stock': return COLORS.WARNING;
    case 'ordered':   return COLORS.INFO;
    case 'shortage':  return COLORS.ERROR;
    default:          return '#8E8E93';
  }
};

const getStockLabel = (cat: StockFilter) => {
  switch (cat) {
    case 'in_stock':  return 'In Stock';
    case 'low_stock': return 'Low Stock';
    case 'ordered':   return 'Ordered';
    case 'shortage':  return 'Shortage';
    default:          return 'Unknown';
  }
};

// ── Main Component ────────────────────────────────────────────────────────────

const InventoryManagementScreen: React.FC = () => {
  const { materials, refresh } = useLogistics();
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Add material modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addSupplier, setAddSupplier] = useState('');
  const [addUnit, setAddUnit] = useState('nos');
  const [addRequired, setAddRequired] = useState('');
  const [addAvailable, setAddAvailable] = useState('0');
  const [saving, setSaving] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const resetAddForm = useCallback(() => {
    setAddName('');
    setAddSupplier('');
    setAddUnit('nos');
    setAddRequired('');
    setAddAvailable('0');
  }, []);

  const handleAddMaterial = useCallback(async () => {
    if (!addName.trim()) {
      Alert.alert('Required', 'Please enter a material name.');
      return;
    }
    setSaving(true);
    try {
      await database.write(async () => {
        await (database.collections.get('materials') as any).create((rec: any) => {
          rec.name = addName.trim();
          rec.supplier = addSupplier.trim() || null;
          rec.unit = addUnit.trim() || 'nos';
          rec.quantityRequired = parseFloat(addRequired) || 0;
          rec.quantityAvailable = parseFloat(addAvailable) || 0;
          rec.quantityUsed = 0;
          rec.status = 'ordered';
          rec._version = 1;
          rec.appSyncStatus = 'pending';
        });
      });
      setShowAddModal(false);
      resetAddForm();
      await refresh();
    } catch {
      Alert.alert('Error', 'Could not add material. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [addName, addSupplier, addUnit, addRequired, addAvailable, refresh, resetAddForm]);

  // Annotate materials with stock category
  const annotated = materials.map(m => ({
    material: m,
    stockCat: getStockCategory(m.status, m.quantityAvailable, m.quantityRequired),
  }));

  // Apply filter + search
  const filtered = annotated.filter(({ material, stockCat }) => {
    if (stockFilter !== 'all' && stockCat !== stockFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        material.name.toLowerCase().includes(q) ||
        (material.supplier || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const inStock  = annotated.filter(a => a.stockCat === 'in_stock').length;
  const lowStock = annotated.filter(a => a.stockCat === 'low_stock').length;
  const ordered  = annotated.filter(a => a.stockCat === 'ordered').length;
  const shortage = annotated.filter(a => a.stockCat === 'shortage').length;

  // Total inventory value proxy: sum of (quantityAvailable across all materials)
  const totalAvailableUnits = materials.reduce((s, m) => s + m.quantityAvailable, 0);

  return (
    <View style={styles.container}>

      {/* Stat Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: COLORS.SUCCESS }]}>
          <Text style={styles.statValue}>{inStock}</Text>
          <Text style={styles.statLabel}>In Stock</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.WARNING }]}>
          <Text style={styles.statValue}>{lowStock}</Text>
          <Text style={styles.statLabel}>Low</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.INFO }]}>
          <Text style={styles.statValue}>{ordered}</Text>
          <Text style={styles.statLabel}>Ordered</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.ERROR }]}>
          <Text style={styles.statValue}>{shortage}</Text>
          <Text style={styles.statLabel}>Shortage</Text>
        </View>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {materials.length} materials tracked · {totalAvailableUnits.toLocaleString()} total units available
        </Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTER_CHIPS.map(chip => {
          const active = stockFilter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, active && { backgroundColor: chip.color }]}
              onPress={() => setStockFilter(chip.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials or supplier..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Inventory List */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏭</Text>
            <Text style={styles.emptyTitle}>No inventory found</Text>
            <Text style={styles.emptyMsg}>
              {materials.length === 0
                ? 'Generate Logistics demo data to see stock levels.'
                : 'No items match the current filter.'}
            </Text>
          </View>
        ) : (
          filtered.map(({ material, stockCat }) => {
            const color = getStockColor(stockCat);
            const pct = material.quantityRequired > 0
              ? Math.min(100, Math.round((material.quantityAvailable / material.quantityRequired) * 100))
              : 100;

            return (
              <View key={material.id} style={styles.card}>
                <View style={[styles.cardAccent, { backgroundColor: color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.materialName} numberOfLines={2}>{material.name}</Text>
                    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.badgeText, { color }]}>{getStockLabel(stockCat)}</Text>
                    </View>
                  </View>

                  {material.supplier ? (
                    <Text style={styles.supplier}>{material.supplier}</Text>
                  ) : null}

                  {/* Stock bar */}
                  <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                  <View style={styles.qtyRow}>
                    <Text style={styles.qtyLabel}>
                      Available: <Text style={styles.qtyValue}>{material.quantityAvailable} {material.unit}</Text>
                    </Text>
                    <Text style={styles.qtyLabel}>
                      Required: <Text style={styles.qtyValue}>{material.quantityRequired} {material.unit}</Text>
                    </Text>
                  </View>
                  {material.quantityUsed > 0 && (
                    <Text style={styles.usedText}>
                      Used: {material.quantityUsed} {material.unit}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={styles.listFooter} />
      </ScrollView>

      {/* FAB — Add Material */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Add Material Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => { setShowAddModal(false); resetAddForm(); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Material</Text>

            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput style={styles.fieldInput} value={addName} onChangeText={setAddName} placeholder="e.g. HV Bushing Assembly 33kV" placeholderTextColor="#bbb" />

            <Text style={styles.fieldLabel}>Supplier</Text>
            <TextInput style={styles.fieldInput} value={addSupplier} onChangeText={setAddSupplier} placeholder="e.g. PowerTech Industries" placeholderTextColor="#bbb" />

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <TextInput style={styles.fieldInput} value={addUnit} onChangeText={setAddUnit} placeholder="nos" placeholderTextColor="#bbb" />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Required Qty</Text>
                <TextInput style={styles.fieldInput} value={addRequired} onChangeText={setAddRequired} placeholder="0" keyboardType="numeric" placeholderTextColor="#bbb" />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Available Qty</Text>
            <TextInput style={styles.fieldInput} value={addAvailable} onChangeText={setAddAvailable} placeholder="0" keyboardType="numeric" placeholderTextColor="#bbb" />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddModal(false); resetAddForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleAddMaterial} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Add Material'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f5f5f5' },
  statsRow:       { flexDirection: 'row', padding: 12, gap: 8 },
  statCard:       { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10,
                    borderTopWidth: 3, alignItems: 'center',
                    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  statValue:      { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  statLabel:      { fontSize: 11, color: '#666', marginTop: 2 },
  summaryBar:     { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8,
                    borderBottomWidth: 1, borderBottomColor: '#eee' },
  summaryText:    { fontSize: 13, color: '#555' },
  filterRow:      { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10,
                    paddingBottom: 6, gap: 6, flexWrap: 'wrap' },
  chip:           { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
                    backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  chipText:       { fontSize: 12, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  searchContainer:{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 12,
                    marginVertical: 8, backgroundColor: '#fff', borderRadius: 8,
                    borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 12 },
  searchInput:    { flex: 1, height: 38, fontSize: 14, color: '#333' },
  clearBtn:       { padding: 6 },
  clearText:      { fontSize: 16, color: '#999' },
  list:           { flex: 1 },
  card:           { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12,
                    marginBottom: 8, borderRadius: 10,
                    elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3,
                    overflow: 'hidden' },
  cardAccent:     { width: 4 },
  cardBody:       { flex: 1, padding: 12 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 4, gap: 8 },
  materialName:   { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  badge:          { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText:      { fontSize: 11, fontWeight: '600' },
  supplier:       { fontSize: 12, color: '#888', marginBottom: 8 },
  barContainer:   { height: 6, backgroundColor: '#e8e8e8', borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 3 },
  qtyRow:         { flexDirection: 'row', justifyContent: 'space-between' },
  qtyLabel:       { fontSize: 12, color: '#888' },
  qtyValue:       { fontWeight: '600', color: '#333' },
  usedText:       { fontSize: 12, color: '#888', marginTop: 2 },
  emptyState:     { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyTitle:     { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyMsg:       { fontSize: 14, color: '#666', textAlign: 'center' },
  listFooter:     { height: 80 },
  fab:            { position: 'absolute', bottom: 20, right: 20, width: 54, height: 54, borderRadius: 27,
                    backgroundColor: COLORS.PRIMARY, alignItems: 'center', justifyContent: 'center',
                    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  fabText:        { fontSize: 28, color: '#fff', lineHeight: 32 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
                    padding: 20, paddingBottom: 32 },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  fieldLabel:     { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 10 },
  fieldInput:     { backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
                    fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#e0e0e0' },
  fieldRow:       { flexDirection: 'row', gap: 12 },
  fieldHalf:      { flex: 1 },
  modalButtons:   { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:      { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1,
                    borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText:  { fontSize: 14, color: '#555', fontWeight: '500' },
  saveBtn:        { flex: 2, paddingVertical: 12, borderRadius: 8,
                    backgroundColor: COLORS.PRIMARY, alignItems: 'center' },
  saveBtnDisabled:{ opacity: 0.5 },
  saveBtnText:    { fontSize: 14, color: '#fff', fontWeight: '600' },
});

// ── Export ────────────────────────────────────────────────────────────────────

const InventoryManagementScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - InventoryManagementScreen">
    <InventoryManagementScreen />
  </ErrorBoundary>
);

export default InventoryManagementScreenWithBoundary;
