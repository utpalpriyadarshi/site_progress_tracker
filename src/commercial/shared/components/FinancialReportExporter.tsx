/**
 * FinancialReportExporter - Shared Component
 * Export financial reports to various formats
 *
 * Features:
 * - Multiple export formats (PDF, Excel, CSV, JSON)
 * - Format selection with descriptions
 * - Export options (summary, charts, details)
 * - Progress indicator during export
 * - Success/error feedback
 * - Auto-generated filename with date
 * - Customizable report sections
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Checkbox, RadioButton, ActivityIndicator, Divider, Snackbar } from 'react-native-paper';
import { useSnackbar } from '../../../hooks/useSnackbar';
import type { FinancialReportExporterProps, ReportFormat, ReportExportOptions } from '../types';
import { COLORS } from '../../../theme/colors';

export const FinancialReportExporter: React.FC<FinancialReportExporterProps> = ({
  reportData,
  projectName,
  projectId,
  onExport,
  availableFormats = ['pdf', 'excel', 'csv', 'json'],
  isExporting = false,
}) => {
  const { show: showSnackbar, snackbarProps } = useSnackbar();
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);

  // Format descriptions
  const formatDescriptions: Record<ReportFormat, { label: string; description: string; icon: string }> = {
    pdf: {
      label: 'PDF',
      description: 'Printable document with charts and formatting',
      icon: '📄',
    },
    excel: {
      label: 'Excel',
      description: 'Spreadsheet with editable data and formulas',
      icon: '📊',
    },
    csv: {
      label: 'CSV',
      description: 'Raw data for import into other systems',
      icon: '📋',
    },
    json: {
      label: 'JSON',
      description: 'Structured data for APIs and developers',
      icon: '💾',
    },
  };

  // Generate filename
  const generateFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    const sanitizedProjectName = projectName.replace(/[^a-z0-9]/gi, '_');
    return `${sanitizedProjectName}_Financial_Report_${date}.${selectedFormat}`;
  };

  // Handle export
  const handleExport = async () => {
    if (!includeSummary && !includeCharts && !includeDetails) {
      showSnackbar('Please select at least one section to export');
      return;
    }

    const options: ReportExportOptions = {
      format: selectedFormat,
      includeSummary,
      includeCharts,
      includeDetails,
      dateRange: reportData.dateRange,
      fileName: generateFileName(),
    };

    try {
      await onExport(options);
    } catch (error) {
      showSnackbar('An error occurred while exporting the report');
    }
  };

  // Render format option
  const renderFormatOption = (format: ReportFormat) => {
    if (!availableFormats.includes(format)) return null;

    const info = formatDescriptions[format];
    return (
      <TouchableOption
        key={format}
        selected={selectedFormat === format}
        onPress={() => setSelectedFormat(format)}
      >
        <View style={styles.formatOption}>
          <RadioButton
            value={format}
            status={selectedFormat === format ? 'checked' : 'unchecked'}
            onPress={() => setSelectedFormat(format)}
          />
          <View style={styles.formatInfo}>
            <View style={styles.formatHeader}>
              <Text style={styles.formatIcon}>{info.icon}</Text>
              <Text style={styles.formatLabel}>{info.label}</Text>
            </View>
            <Text style={styles.formatDescription}>{info.description}</Text>
          </View>
        </View>
      </TouchableOption>
    );
  };

  // Render report preview summary
  const renderReportSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Report Contents</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Project:</Text>
        <Text style={styles.summaryValue}>{projectName}</Text>
      </View>
      {reportData.dateRange && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date Range:</Text>
          <Text style={styles.summaryValue}>
            {reportData.dateRange.startDate
              ? new Date(reportData.dateRange.startDate).toLocaleDateString()
              : 'All'}
            {' - '}
            {reportData.dateRange.endDate
              ? new Date(reportData.dateRange.endDate).toLocaleDateString()
              : 'Present'}
          </Text>
        </View>
      )}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Budget:</Text>
        <Text style={styles.summaryValue}>
          ${reportData.profitability.totalBudget.toLocaleString()}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Spent:</Text>
        <Text style={styles.summaryValue}>
          ${reportData.profitability.totalSpent.toLocaleString()}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Remaining:</Text>
        <Text
          style={[
            styles.summaryValue,
            {
              color: reportData.profitability.remaining >= 0 ? COLORS.SUCCESS : '#f44336',
            },
          ]}
        >
          ${reportData.profitability.remaining.toLocaleString()}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Invoices Total:</Text>
        <Text style={styles.summaryValue}>
          ${reportData.invoicesSummary.totalAmount.toLocaleString()}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Cash Flow:</Text>
        <Text
          style={[
            styles.summaryValue,
            {
              color: reportData.cashFlow.netCashFlow >= 0 ? COLORS.SUCCESS : '#f44336',
            },
          ]}
        >
          ${reportData.cashFlow.netCashFlow.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <>
    <ScrollView style={styles.container}>
      <Card mode="elevated" style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Export Financial Report</Text>
          <Text style={styles.subtitle}>
            Select format and options to export your financial data
          </Text>

          {/* Report Summary */}
          {renderReportSummary()}

          <Divider style={styles.divider} />

          {/* Format Selection */}
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatsContainer}>
            {(['pdf', 'excel', 'csv', 'json'] as ReportFormat[]).map(renderFormatOption)}
          </View>

          <Divider style={styles.divider} />

          {/* Export Options */}
          <Text style={styles.sectionTitle}>Include in Export</Text>
          <View style={styles.optionsContainer}>
            <CheckboxOption
              label="Executive Summary"
              description="Overview of key financial metrics and KPIs"
              checked={includeSummary}
              onPress={() => setIncludeSummary(!includeSummary)}
            />
            <CheckboxOption
              label="Charts & Visualizations"
              description="Budget charts, cost distribution, and trends"
              checked={includeCharts}
              onPress={() => setIncludeCharts(!includeCharts)}
              disabled={selectedFormat === 'csv' || selectedFormat === 'json'}
            />
            <CheckboxOption
              label="Detailed Data"
              description="Complete transaction records and line items"
              checked={includeDetails}
              onPress={() => setIncludeDetails(!includeDetails)}
            />
          </View>

          <Divider style={styles.divider} />

          {/* File Name Preview */}
          <View style={styles.filenameContainer}>
            <Text style={styles.filenameLabel}>File name:</Text>
            <Text style={styles.filenameValue}>{generateFileName()}</Text>
          </View>

          {/* Export Button */}
          <Button
            mode="contained"
            onPress={handleExport}
            style={styles.exportButton}
            disabled={isExporting}
            icon={isExporting ? undefined : 'download'}
          >
            {isExporting ? (
              <View style={styles.exportingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.exportingText}>Exporting...</Text>
              </View>
            ) : (
              'Export Report'
            )}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
    <Snackbar {...snackbarProps} duration={3000} />
    </>
  );
};

// Helper Components
const TouchableOption: React.FC<{
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}> = ({ selected, onPress, children }) => (
  <View
    style={[styles.touchableOption, selected && styles.touchableOptionSelected]}
    onTouchEnd={onPress}
  >
    {children}
  </View>
);

const CheckboxOption: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
}> = ({ label, description, checked, onPress, disabled = false }) => (
  <View style={[styles.checkboxOption, disabled && styles.checkboxOptionDisabled]}>
    <Checkbox
      status={checked ? 'checked' : 'unchecked'}
      onPress={onPress}
      disabled={disabled}
    />
    <View style={styles.checkboxInfo}>
      <Text style={[styles.checkboxLabel, disabled && styles.disabledText]}>{label}</Text>
      <Text style={[styles.checkboxDescription, disabled && styles.disabledText]}>
        {description}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 20,
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  formatsContainer: {
    gap: 8,
  },
  touchableOption: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  touchableOptionSelected: {
    borderColor: COLORS.INFO,
    borderWidth: 2,
    backgroundColor: '#e3f2fd',
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  formatInfo: {
    flex: 1,
    marginLeft: 8,
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  formatIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  formatDescription: {
    fontSize: 13,
    color: '#666',
  },
  optionsContainer: {
    gap: 12,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxOptionDisabled: {
    opacity: 0.5,
  },
  checkboxInfo: {
    flex: 1,
    marginLeft: 8,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: 13,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  filenameContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  filenameLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  filenameValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'monospace',
  },
  exportButton: {
    backgroundColor: COLORS.INFO,
  },
  exportingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportingText: {
    color: 'white',
    marginLeft: 8,
  },
});
