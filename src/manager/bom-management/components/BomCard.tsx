import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Button,
  IconButton,
  Text,
  Chip,
  Divider,
} from 'react-native-paper';
import BomModel from '../../../../models/BomModel';
import BomItemModel from '../../../../models/BomItemModel';
import ProjectModel from '../../../../models/ProjectModel';
import { BomStatusChip } from './BomStatusChip';
import { formatCurrency } from '../utils/bomFormatters';
import {
  getBomItems,
  calculateTotalCost,
  getBaselineBom,
  calculateVariance,
} from '../utils/bomCalculations';
import { COLORS } from '../../../theme/colors';

interface BomCardProps {
  bom: BomModel;
  boms: BomModel[];
  projects: ProjectModel[];
  allBomItems: BomItemModel[];
  onEditBom: (bom: BomModel) => void;
  onDeleteBom: (bom: BomModel) => void;
  onAddItem: (bomId: string) => void;
  onEditItem: (item: BomItemModel) => void;
  onDeleteItem: (item: BomItemModel) => void;
  onCopyToExecution: (bom: BomModel) => void;
  onExportBom: (bom: BomModel) => void;
  exportingBomId?: string | null;
}

/**
 * BomCard - Displays a single BOM with its items and actions
 */
export const BomCard: React.FC<BomCardProps> = ({
  bom,
  boms,
  projects,
  allBomItems,
  onEditBom,
  onDeleteBom,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onCopyToExecution,
  onExportBom,
  exportingBomId,
}) => {
  const project = projects.find(p => p.id === bom.projectId);
  const items = getBomItems(bom.id, allBomItems);
  const totalCost = calculateTotalCost(bom.id, allBomItems);

  // For execution BOMs, get baseline data
  const baselineBom = bom.type === 'execution' ? getBaselineBom(bom.baselineBomId, boms) : undefined;
  const baselineTotalCost = baselineBom ? calculateTotalCost(baselineBom.id, allBomItems) : 0;
  const variance = baselineBom ? calculateVariance(baselineTotalCost, totalCost) : 0;

  return (
    <Card key={bom.id} mode="elevated" style={styles.bomCard}>
      <Card.Content>
        {/* BOM Header */}
        <View style={styles.bomHeader}>
          <View style={styles.bomTitleSection}>
            <Text variant="titleMedium" style={styles.bomName}>{bom.name}</Text>
            <BomStatusChip status={bom.status} />
          </View>
          <View style={styles.bomActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEditBom(bom)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#FF3B30"
              onPress={() => onDeleteBom(bom)}
            />
          </View>
        </View>

        {/* BOM Info */}
        <View style={styles.bomInfo}>
          {project && (
            <Text variant="bodySmall" style={styles.infoText}>
              📁 Project: {project.name}
            </Text>
          )}
          <Text variant="bodySmall" style={styles.infoText}>
            🏗️ Site: {bom.siteCategory}
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            📦 Quantity: {bom.quantity} {bom.unit}
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            📋 Version: {bom.version}
            {bom.updatedDate && bom.updatedDate !== bom.createdDate
              ? `  •  Updated ${new Date(bom.updatedDate).toLocaleDateString('en-IN')}`
              : ''}
          </Text>
        </View>

        <Divider style={styles.divider} />

        {/* BOM Items Summary */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Text variant="titleSmall">Items ({items.length})</Text>
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => onAddItem(bom.id)}
              compact
              style={styles.addItemButton}
            >
              Add Item
            </Button>
          </View>

          {items.length === 0 ? (
            <Text variant="bodySmall" style={styles.emptyItemsText}>
              No items added yet. Click "Add Item" to start.
            </Text>
          ) : (
            <View style={styles.itemsList}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text variant="bodyMedium" style={styles.itemCode}>
                      {item.itemCode}
                    </Text>
                    <Text variant="bodySmall" style={styles.itemDescription}>
                      {item.description}
                    </Text>
                    <Text variant="bodySmall" style={styles.itemDetails}>
                      {item.quantity} {item.unit} × {formatCurrency(item.unitCost)} = {formatCurrency(item.totalCost)}
                    </Text>
                    <Chip
                      mode="flat"
                      style={styles.categoryChip}
                      textStyle={styles.categoryChipText}
                    >
                      {item.category.toUpperCase()}
                    </Chip>
                  </View>
                  <View style={styles.itemActions}>
                    <IconButton
                      icon="pencil"
                      size={18}
                      onPress={() => onEditItem(item)}
                    />
                    <IconButton
                      icon="delete"
                      size={18}
                      iconColor="#FF3B30"
                      onPress={() => onDeleteItem(item)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Total Cost */}
        {items.length > 0 && (
          <>
            <Divider style={styles.divider} />
            {bom.type === 'execution' && baselineBom ? (
              // Execution BOM with baseline comparison
              <View style={styles.varianceSection}>
                <View style={styles.costRow}>
                  <Text variant="bodySmall" style={styles.costLabel}>Baseline Cost:</Text>
                  <Text variant="bodyMedium" style={styles.baselineCost}>
                    {formatCurrency(baselineTotalCost)}
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text variant="titleSmall">Actual Cost:</Text>
                  <Text variant="titleMedium" style={styles.totalAmount}>
                    {formatCurrency(totalCost)}
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text variant="bodySmall" style={styles.costLabel}>Variance:</Text>
                  <View style={styles.varianceContainer}>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.varianceText,
                        { color: variance > 0 ? COLORS.ERROR : variance < 0 ? COLORS.SUCCESS : '#666' }
                      ]}
                    >
                      {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.varianceAmount,
                        { color: variance > 0 ? COLORS.ERROR : variance < 0 ? COLORS.SUCCESS : '#666' }
                      ]}
                    >
                      ({variance > 0 ? '+' : ''}{formatCurrency(totalCost - baselineTotalCost)})
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              // Regular estimating BOM
              <View style={styles.totalSection}>
                <Text variant="titleSmall">Total Estimated Cost:</Text>
                <Text variant="titleMedium" style={styles.totalAmount}>
                  {formatCurrency(totalCost)}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Copy to Execution Button (only for estimating BOMs) */}
        {bom.type === 'estimating' && items.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Button
              mode="contained"
              icon="content-copy"
              onPress={() => onCopyToExecution(bom)}
              style={styles.copyButton}
            >
              Copy to Execution
            </Button>
          </>
        )}

        {/* Baseline Link (only for execution BOMs) */}
        {bom.type === 'execution' && bom.baselineBomId && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.baselineLink}>
              <Text variant="bodySmall" style={styles.baselineLinkText}>
                🔗 Linked to baseline estimating BOM
              </Text>
            </View>
          </>
        )}

        {/* Export Button (show for any BOM with items) */}
        {items.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Button
              mode="outlined"
              icon="download"
              onPress={() => onExportBom(bom)}
              style={styles.exportButton}
              loading={exportingBomId === bom.id}
              disabled={exportingBomId === bom.id}
            >
              {exportingBomId === bom.id ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  bomCard: {
    marginBottom: 16,
  },
  bomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bomTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bomName: {
    fontWeight: '600',
    flex: 1,
  },
  bomActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  bomInfo: {
    marginBottom: 12,
  },
  infoText: {
    color: '#666',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 12,
  },
  itemsSection: {
    marginTop: 4,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addItemButton: {
    marginLeft: 8,
  },
  emptyItemsText: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  itemsList: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemCode: {
    fontWeight: '600',
    marginBottom: 2,
  },
  itemDescription: {
    color: '#666',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: COLORS.INFO_BG,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    lineHeight: 18,
  },
  itemActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalAmount: {
    color: COLORS.INFO,
    fontWeight: 'bold',
  },
  varianceSection: {
    marginTop: 8,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    color: '#666',
  },
  baselineCost: {
    color: '#666',
    fontWeight: '600',
  },
  varianceContainer: {
    alignItems: 'flex-end',
  },
  varianceText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  varianceAmount: {
    fontSize: 12,
    marginTop: 2,
  },
  copyButton: {
    marginTop: 8,
  },
  exportButton: {
    marginTop: 8,
  },
  baselineLink: {
    paddingVertical: 8,
    backgroundColor: COLORS.WARNING_BG,
    borderRadius: 4,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  baselineLinkText: {
    color: '#E65100',
    fontWeight: '600',
    textAlign: 'center',
  },
});
