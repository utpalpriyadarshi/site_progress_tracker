import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../theme/colors';

/**
 * ResourceAllocationGrid
 *
 * Grid/table component for displaying resource allocation across sites/projects
 *
 * Features:
 * - Grid layout with resource rows
 * - Site columns with allocation percentages
 * - Color coding for allocation levels (under/optimal/over)
 * - Highlight overallocated resources
 * - Touchable cells for drill-down
 * - Total row/column
 * - Responsive sizing
 * - Horizontal scrolling for many sites
 * - Legend for color codes
 *
 * @example
 * ```tsx
 * <ResourceAllocationGrid
 *   resources={[{
 *     resourceId: '1',
 *     resourceName: 'John Doe',
 *     type: 'person',
 *     allocations: [
 *       { siteId: 'A', siteName: 'Site A', percentage: 50, hours: 20 },
 *       { siteId: 'B', siteName: 'Site B', percentage: 30, hours: 12 },
 *     ],
 *   }]}
 *   showPercentages={true}
 *   highlightOverallocated={true}
 * />
 * ```
 */

export interface ResourceAllocation {
  resourceId: string;
  resourceName: string;
  type: 'person' | 'equipment' | 'material';
  allocations: {
    siteId: string;
    siteName: string;
    percentage: number;
    hours?: number;
    quantity?: number;
    unit?: string;
  }[];
}

interface ResourceAllocationGridProps {
  resources: ResourceAllocation[];
  onResourcePress?: (resourceId: string) => void;
  onAllocationPress?: (resourceId: string, siteId: string) => void;
  showPercentages?: boolean;
  showHours?: boolean;
  highlightOverallocated?: boolean;
  compact?: boolean;
}

const ResourceAllocationGrid: React.FC<ResourceAllocationGridProps> = ({
  resources,
  onResourcePress,
  onAllocationPress,
  showPercentages = true,
  showHours = false,
  highlightOverallocated = true,
  compact = false,
}) => {
  // Get all unique sites
  const allSites = React.useMemo(() => {
    const sitesMap = new Map<string, string>();
    resources.forEach((resource) => {
      resource.allocations.forEach((allocation) => {
        sitesMap.set(allocation.siteId, allocation.siteName);
      });
    });
    return Array.from(sitesMap.entries()).map(([id, name]) => ({ id, name }));
  }, [resources]);

  const getAllocationColor = (percentage: number) => {
    if (percentage === 0) return '#F5F5F5';
    if (percentage < 50) return '#C8E6C9'; // Green - under-utilized
    if (percentage <= 90) return '#FFF9C4'; // Yellow - optimal
    if (percentage <= 100) return '#FFCCBC'; // Orange - near capacity
    return '#FFCDD2'; // Red - overallocated
  };

  const getAllocationTextColor = (percentage: number) => {
    if (percentage === 0) return '#999';
    if (percentage < 50) return '#388E3C';
    if (percentage <= 90) return '#F57C00';
    if (percentage <= 100) return '#E64A19';
    return '#C62828';
  };

  const getTotalAllocation = (resource: ResourceAllocation) => {
    return resource.allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
  };

  const isOverallocated = (resource: ResourceAllocation) => {
    return getTotalAllocation(resource) > 100;
  };

  const getTypeIcon = (type: ResourceAllocation['type']) => {
    switch (type) {
      case 'person':
        return '👤';
      case 'equipment':
        return '⚙️';
      case 'material':
        return '📦';
      default:
        return '';
    }
  };

  const formatValue = (allocation: ResourceAllocation['allocations'][0]) => {
    if (showHours && allocation.hours !== undefined) {
      return `${allocation.hours}h`;
    }
    if (allocation.quantity !== undefined && allocation.unit) {
      return `${allocation.quantity}${allocation.unit}`;
    }
    if (showPercentages) {
      return `${allocation.percentage}%`;
    }
    return '-';
  };

  const findAllocation = (resource: ResourceAllocation, siteId: string) => {
    return resource.allocations.find((a) => a.siteId === siteId);
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Allocation Levels:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#C8E6C9' }]} />
            <Text style={styles.legendText}>{'<50%'}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFF9C4' }]} />
            <Text style={styles.legendText}>50-90%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFCCBC' }]} />
            <Text style={styles.legendText}>90-100%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFCDD2' }]} />
            <Text style={styles.legendText}>{'>100%'}</Text>
          </View>
        </View>
      </View>

      {/* Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, styles.resourceNameCell]}>
              <Text style={styles.headerText}>Resource</Text>
            </View>
            {allSites.map((site) => (
              <View key={site.id} style={styles.headerCell}>
                <Text style={styles.headerText} numberOfLines={1}>
                  {site.name}
                </Text>
              </View>
            ))}
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Total</Text>
            </View>
          </View>

          {/* Resource Rows */}
          {resources.map((resource) => {
            const total = getTotalAllocation(resource);
            const isOver = isOverallocated(resource);

            return (
              <View
                key={resource.resourceId}
                style={[
                  styles.row,
                  highlightOverallocated && isOver && styles.rowOverallocated,
                ]}
              >
                {/* Resource Name Cell */}
                <TouchableOpacity
                  style={[styles.cell, styles.resourceNameCell]}
                  onPress={() => onResourcePress && onResourcePress(resource.resourceId)}
                  disabled={!onResourcePress}
                >
                  <Text style={styles.typeIcon}>{getTypeIcon(resource.type)}</Text>
                  <Text style={styles.resourceName} numberOfLines={1}>
                    {resource.resourceName}
                  </Text>
                </TouchableOpacity>

                {/* Allocation Cells */}
                {allSites.map((site) => {
                  const allocation = findAllocation(resource, site.id);
                  const percentage = allocation?.percentage || 0;

                  return (
                    <TouchableOpacity
                      key={site.id}
                      style={[
                        styles.cell,
                        { backgroundColor: getAllocationColor(percentage) },
                      ]}
                      onPress={() =>
                        onAllocationPress &&
                        allocation &&
                        onAllocationPress(resource.resourceId, site.id)
                      }
                      disabled={!onAllocationPress || !allocation}
                    >
                      {allocation ? (
                        <Text
                          style={[
                            styles.allocationText,
                            { color: getAllocationTextColor(percentage) },
                          ]}
                        >
                          {formatValue(allocation)}
                        </Text>
                      ) : (
                        <Text style={styles.emptyCell}>-</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Total Cell */}
                <View
                  style={[
                    styles.cell,
                    styles.totalCell,
                    { backgroundColor: getAllocationColor(total) },
                  ]}
                >
                  <Text
                    style={[
                      styles.totalText,
                      { color: getAllocationTextColor(total) },
                    ]}
                  >
                    {total}%
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Empty State */}
          {resources.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No resources allocated</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerCompact: {
    padding: 12,
    marginVertical: 4,
  },
  legend: {
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  headerCell: {
    padding: 12,
    minWidth: 80,
    backgroundColor: '#F5F5F5',
  },
  resourceNameCell: {
    minWidth: 150,
    backgroundColor: '#FAFAFA',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowOverallocated: {
    backgroundColor: COLORS.ERROR_BG,
  },
  cell: {
    padding: 12,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  resourceName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  allocationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCell: {
    fontSize: 14,
    color: '#CCC',
  },
  totalCell: {
    borderRightWidth: 0,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default ResourceAllocationGrid;
