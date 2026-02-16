import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip } from 'react-native-paper';
import { Vendor, VendorQuote } from '../types/VendorQuoteTypes';

interface ComplianceCategory {
  key: string;
  label: string;
  complied: string;
  withComments: string;
  notComplied: string;
}

const COMPLIANCE_CATEGORIES: ComplianceCategory[] = [
  { key: 'tech', label: 'Technical Req', complied: '', withComments: '', notComplied: '' },
  { key: 'datasheet', label: 'Datasheet', complied: '', withComments: '', notComplied: '' },
  { key: 'typeTest', label: 'Type Test', complied: '', withComments: '', notComplied: '' },
  { key: 'routineTest', label: 'Routine Test', complied: '', withComments: '', notComplied: '' },
  { key: 'siteReq', label: 'Site Req', complied: '', withComments: '', notComplied: '' },
];

interface ComplianceData {
  [key: string]: { complied: string; withComments: string; notComplied: string };
}

interface AddVendorQuoteDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: {
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
    // 15 compliance breakup fields
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
  }) => void;
  vendors: Vendor[];
  isEditing?: boolean;
  editingQuote?: VendorQuote | null;
}

const AddVendorQuoteDialog: React.FC<AddVendorQuoteDialogProps> = ({
  visible,
  onDismiss,
  onSubmit,
  vendors,
  isEditing = false,
  editingQuote,
}) => {
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [notes, setNotes] = useState('');

  // Compliance breakup state
  const [compliance, setCompliance] = useState<ComplianceData>(() => {
    const initial: ComplianceData = {};
    COMPLIANCE_CATEGORIES.forEach((cat) => {
      initial[cat.key] = { complied: '', withComments: '', notComplied: '' };
    });
    return initial;
  });

  useEffect(() => {
    if (visible && isEditing && editingQuote) {
      setVendorId(editingQuote.vendorId);
      const matchedVendor = vendors.find((v) => v.id === editingQuote.vendorId);
      setVendorName(matchedVendor?.vendorName || editingQuote.vendorName || '');
      setQuotedPrice(String(editingQuote.quotedPrice));
      setCurrency(editingQuote.currency);
      setLeadTimeDays(String(editingQuote.leadTimeDays));
      setValidityDays(String(editingQuote.validityDays));
      setPaymentTerms(editingQuote.paymentTerms || '');
      setWarrantyMonths(editingQuote.warrantyMonths !== undefined ? String(editingQuote.warrantyMonths) : '');
      setNotes(editingQuote.notes || '');
      // Load compliance breakup
      setCompliance({
        tech: {
          complied: editingQuote.techComplied !== undefined ? String(editingQuote.techComplied) : '',
          withComments: editingQuote.techCompliedWithComments !== undefined ? String(editingQuote.techCompliedWithComments) : '',
          notComplied: editingQuote.techNotComplied !== undefined ? String(editingQuote.techNotComplied) : '',
        },
        datasheet: {
          complied: editingQuote.datasheetComplied !== undefined ? String(editingQuote.datasheetComplied) : '',
          withComments: editingQuote.datasheetCompliedWithComments !== undefined ? String(editingQuote.datasheetCompliedWithComments) : '',
          notComplied: editingQuote.datasheetNotComplied !== undefined ? String(editingQuote.datasheetNotComplied) : '',
        },
        typeTest: {
          complied: editingQuote.typeTestComplied !== undefined ? String(editingQuote.typeTestComplied) : '',
          withComments: editingQuote.typeTestCompliedWithComments !== undefined ? String(editingQuote.typeTestCompliedWithComments) : '',
          notComplied: editingQuote.typeTestNotComplied !== undefined ? String(editingQuote.typeTestNotComplied) : '',
        },
        routineTest: {
          complied: editingQuote.routineTestComplied !== undefined ? String(editingQuote.routineTestComplied) : '',
          withComments: editingQuote.routineTestCompliedWithComments !== undefined ? String(editingQuote.routineTestCompliedWithComments) : '',
          notComplied: editingQuote.routineTestNotComplied !== undefined ? String(editingQuote.routineTestNotComplied) : '',
        },
        siteReq: {
          complied: editingQuote.siteReqComplied !== undefined ? String(editingQuote.siteReqComplied) : '',
          withComments: editingQuote.siteReqCompliedWithComments !== undefined ? String(editingQuote.siteReqCompliedWithComments) : '',
          notComplied: editingQuote.siteReqNotComplied !== undefined ? String(editingQuote.siteReqNotComplied) : '',
        },
      });
    } else if (visible && !isEditing) {
      resetForm();
    }
  }, [visible, isEditing, editingQuote]);

  const resetForm = () => {
    setVendorId('');
    setVendorName('');
    setQuotedPrice('');
    setCurrency('INR');
    setLeadTimeDays('');
    setValidityDays('30');
    setPaymentTerms('');
    setWarrantyMonths('');
    setNotes('');
    const initial: ComplianceData = {};
    COMPLIANCE_CATEGORIES.forEach((cat) => {
      initial[cat.key] = { complied: '', withComments: '', notComplied: '' };
    });
    setCompliance(initial);
  };

  const handleVendorNameChange = (text: string) => {
    setVendorName(text);
    // Auto-match to existing vendor
    const match = vendors.find((v) => v.vendorName.toLowerCase() === text.toLowerCase());
    setVendorId(match ? match.id : '');
  };

  const handleVendorChipSelect = (vendor: Vendor) => {
    setVendorId(vendor.id);
    setVendorName(vendor.vendorName);
  };

  const updateCompliance = (categoryKey: string, field: 'complied' | 'withComments' | 'notComplied', value: string) => {
    setCompliance((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        [field]: value,
      },
    }));
  };

  // Calculate per-category and overall compliance
  const complianceSummary = useMemo(() => {
    let totalComplied = 0;
    let totalAll = 0;
    const perCategory: { key: string; label: string; percentage: number; total: number }[] = [];

    COMPLIANCE_CATEGORIES.forEach((cat) => {
      const c = parseInt(compliance[cat.key]?.complied) || 0;
      const wc = parseInt(compliance[cat.key]?.withComments) || 0;
      const nc = parseInt(compliance[cat.key]?.notComplied) || 0;
      const catTotal = c + wc + nc;
      const catComplied = c + wc; // "Complied with comments" counts as complied
      totalComplied += catComplied;
      totalAll += catTotal;
      perCategory.push({
        key: cat.key,
        label: cat.label,
        percentage: catTotal > 0 ? Math.round((catComplied / catTotal) * 100) : 0,
        total: catTotal,
      });
    });

    const overallPercentage = totalAll > 0 ? Math.round((totalComplied / totalAll) * 100) : 0;
    return { perCategory, overallPercentage, totalComplied, totalAll };
  }, [compliance]);

  const hasComplianceData = complianceSummary.totalAll > 0;

  const handleSubmit = () => {
    if (!vendorName.trim() || !quotedPrice || !leadTimeDays) return;

    const price = parseFloat(quotedPrice);
    const lead = parseInt(leadTimeDays);
    const validity = parseInt(validityDays) || 30;
    const warranty = warrantyMonths ? parseInt(warrantyMonths) : undefined;

    if (isNaN(price) || price <= 0 || isNaN(lead) || lead <= 0) return;

    const getNum = (val: string) => {
      const n = parseInt(val);
      return isNaN(n) ? undefined : n;
    };

    onSubmit({
      vendorId,
      vendorName: vendorName.trim(),
      quotedPrice: price,
      currency,
      leadTimeDays: lead,
      validityDays: validity,
      paymentTerms: paymentTerms || undefined,
      warrantyMonths: warranty,
      technicalCompliancePercentage: complianceSummary.overallPercentage,
      notes: notes || undefined,
      techComplied: getNum(compliance.tech?.complied),
      techCompliedWithComments: getNum(compliance.tech?.withComments),
      techNotComplied: getNum(compliance.tech?.notComplied),
      datasheetComplied: getNum(compliance.datasheet?.complied),
      datasheetCompliedWithComments: getNum(compliance.datasheet?.withComments),
      datasheetNotComplied: getNum(compliance.datasheet?.notComplied),
      typeTestComplied: getNum(compliance.typeTest?.complied),
      typeTestCompliedWithComments: getNum(compliance.typeTest?.withComments),
      typeTestNotComplied: getNum(compliance.typeTest?.notComplied),
      routineTestComplied: getNum(compliance.routineTest?.complied),
      routineTestCompliedWithComments: getNum(compliance.routineTest?.withComments),
      routineTestNotComplied: getNum(compliance.routineTest?.notComplied),
      siteReqComplied: getNum(compliance.siteReq?.complied),
      siteReqCompliedWithComments: getNum(compliance.siteReq?.withComments),
      siteReqNotComplied: getNum(compliance.siteReq?.notComplied),
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{isEditing ? 'Edit Vendor Quote' : 'Add Vendor Quote'}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <Dialog.Content>
              <TextInput
                label="Vendor Name *"
                value={vendorName}
                onChangeText={handleVendorNameChange}
                style={styles.input}
                mode="outlined"
                placeholder="Type vendor name or select below"
              />
              {vendors.length > 0 && (
                <View style={styles.vendorRow}>
                  {vendors.map((v) => (
                    <Chip
                      key={v.id}
                      mode={vendorId === v.id ? 'flat' : 'outlined'}
                      selected={vendorId === v.id}
                      showSelectedCheck={false}
                      onPress={() => handleVendorChipSelect(v)}
                      compact
                      style={[
                        styles.vendorChip,
                        vendorId === v.id && styles.vendorChipSelected,
                      ]}
                      textStyle={vendorId === v.id ? styles.vendorChipTextSelected : undefined}>
                      {v.vendorName || `Vendor ${v.id.slice(-4)}`}
                    </Chip>
                  ))}
                </View>
              )}

              <TextInput
                label="Quoted Price *"
                value={quotedPrice}
                onChangeText={setQuotedPrice}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                placeholder="e.g., 500000"
              />

              <View style={styles.row}>
                <TextInput
                  label="Currency"
                  value={currency}
                  onChangeText={setCurrency}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="INR"
                />
                <TextInput
                  label="Lead Time (days) *"
                  value={leadTimeDays}
                  onChangeText={setLeadTimeDays}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="60"
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Validity (days)"
                  value={validityDays}
                  onChangeText={setValidityDays}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="30"
                />
                <TextInput
                  label="Warranty (months)"
                  value={warrantyMonths}
                  onChangeText={setWarrantyMonths}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="12"
                />
              </View>

              <TextInput
                label="Payment Terms"
                value={paymentTerms}
                onChangeText={setPaymentTerms}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., 30 days net"
              />

              {/* 5-Category Compliance Breakup Table */}
              <View style={styles.complianceSection}>
                <Text style={styles.complianceTitle}>Compliance Breakup</Text>

                {/* Table header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.categoryCol]}>Category</Text>
                  <Text style={[styles.tableHeaderCell, styles.numCol]}>Complied</Text>
                  <Text style={[styles.tableHeaderCell, styles.numCol]}>w/ Comments</Text>
                  <Text style={[styles.tableHeaderCell, styles.numCol]}>Not Complied</Text>
                  <Text style={[styles.tableHeaderCell, styles.pctCol]}>%</Text>
                </View>

                {/* Category rows */}
                {COMPLIANCE_CATEGORIES.map((cat) => {
                  const catSummary = complianceSummary.perCategory.find((c) => c.key === cat.key);
                  return (
                    <View key={cat.key} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.categoryCol]} numberOfLines={1}>
                        {cat.label}
                      </Text>
                      <TextInput
                        value={compliance[cat.key]?.complied || ''}
                        onChangeText={(v) => updateCompliance(cat.key, 'complied', v)}
                        style={[styles.tableInput, styles.numCol]}
                        mode="outlined"
                        keyboardType="numeric"
                        dense
                      />
                      <TextInput
                        value={compliance[cat.key]?.withComments || ''}
                        onChangeText={(v) => updateCompliance(cat.key, 'withComments', v)}
                        style={[styles.tableInput, styles.numCol]}
                        mode="outlined"
                        keyboardType="numeric"
                        dense
                      />
                      <TextInput
                        value={compliance[cat.key]?.notComplied || ''}
                        onChangeText={(v) => updateCompliance(cat.key, 'notComplied', v)}
                        style={[styles.tableInput, styles.numCol]}
                        mode="outlined"
                        keyboardType="numeric"
                        dense
                      />
                      <Text style={[styles.tableCell, styles.pctCol, styles.pctText]}>
                        {catSummary && catSummary.total > 0 ? `${catSummary.percentage}%` : '-'}
                      </Text>
                    </View>
                  );
                })}

                {/* Overall compliance */}
                {hasComplianceData && (
                  <View style={styles.overallRow}>
                    <Text style={styles.overallLabel}>Overall Compliance</Text>
                    <Text style={styles.overallValue}>{complianceSummary.overallPercentage}%</Text>
                    <Text style={styles.overallDetail}>
                      ({complianceSummary.totalComplied}/{complianceSummary.totalAll})
                    </Text>
                  </View>
                )}
              </View>

              <TextInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Additional notes..."
              />
            </Dialog.Content>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSubmit} disabled={!vendorName.trim() || !quotedPrice || !leadTimeDays}>
            {isEditing ? 'Save' : 'Add Quote'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '85%',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  vendorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  vendorChip: {
    marginRight: 8,
  },
  vendorChipSelected: {
    backgroundColor: '#6200EE',
  },
  vendorChipTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  complianceSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  complianceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tableCell: {
    fontSize: 11,
    color: '#333',
  },
  categoryCol: {
    width: 70,
  },
  numCol: {
    flex: 1,
    marginHorizontal: 2,
  },
  pctCol: {
    width: 36,
    textAlign: 'center',
  },
  pctText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1565C0',
  },
  tableInput: {
    height: 36,
    fontSize: 12,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    gap: 8,
  },
  overallLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  overallValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  overallDetail: {
    fontSize: 11,
    color: '#666',
  },
});

export default AddVendorQuoteDialog;
