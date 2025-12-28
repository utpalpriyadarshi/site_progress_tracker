import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialRequirement } from '../../../services/BomLogisticsService';
import BomRequirementCard from '../../components/BomRequirementCard';
import BomModel from '../../../models/BomModel';

interface RequirementsListProps {
  boms: BomModel[];
  filteredRequirements: (MaterialRequirement & { bomId?: string; bomName?: string })[];
  loading: boolean;
  bomLoading: boolean;
  expandedBoms: Set<string>;
  doorsLinkMap: Map<string, string>;
  doorsDataMap: Map<string, { doorsId: string; packageId: string; compliancePercentage: number }>;
  searchQuery: string;
  selectedProjectId: string | null;
  appMode: 'demo' | 'production';
  onToggleBom: (bomId: string) => void;
  onLoadSampleData: () => void;
  onNavigateToDoorsDetail: (packageId: string) => void;
  onLinkPress: (itemCode: string, description: string) => void;
}

/**
 * RequirementsList Component
 *
 * Displays BOM requirements with:
 * - Loading states
 * - Empty states (no BOMs, no requirements)
 * - Sample data loading in demo mode
 * - Expandable BOM groups
 * - BomRequirementCard for each item
 * - DOORS integration
 *
 * Extracted from MaterialTrackingScreen Phase 4.
 */
export const RequirementsList: React.FC<RequirementsListProps> = ({
  boms,
  filteredRequirements,
  loading,
  bomLoading,
  expandedBoms,
  doorsLinkMap,
  doorsDataMap,
  searchQuery,
  selectedProjectId,
  appMode,
  onToggleBom,
  onLoadSampleData,
  onNavigateToDoorsDetail,
  onLinkPress,
}) => {
  if (bomLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading BOM requirements...</Text>
      </View>
    );
  }

  if (boms.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>📋</Text>
        <Text style={styles.emptyStateTitle}>No Bills of Materials (BOMs)</Text>
        <Text style={styles.emptyStateText}>
          To track materials, you need Bills of Materials (BOMs) from the Project Manager.
        </Text>
        <Text style={styles.emptyStateSubtext}>
          BOMs list all materials required for each work package. Logistics uses BOMs to place
          orders, track deliveries, and manage inventory.
        </Text>

        {/* Show Load Sample button only in Demo Mode */}
        {appMode === 'demo' && (
          <View style={styles.emptyStateActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onLoadSampleData}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>📊 Load Sample Metro Railway BOMs</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.emptyStateHint}>
              Sample data includes: Civil Works, OCS Installation, Traction Substation, Signaling,
              and MEP systems for Metro Railway projects.
            </Text>
          </View>
        )}

        {/* In Production Mode, show instruction to contact PM */}
        {appMode === 'production' && (
          <View style={styles.emptyStateActions}>
            <Text style={styles.productionModeText}>
              💼 Contact your Project Manager to create BOMs for this project.
            </Text>
            <Text style={styles.emptyStateHint}>
              BOMs are created by the Project Manager and will automatically appear here once added.
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (filteredRequirements.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>
          {searchQuery ? 'No Matches Found' : 'No Requirements'}
        </Text>
        <Text style={styles.emptyStateText}>
          {searchQuery
            ? 'Try a different search query'
            : 'No material requirements in active BOMs'}
        </Text>
      </View>
    );
  }

  // Group requirements by BOM
  const groupedByBom = filteredRequirements.reduce((acc, req) => {
    const bomId = req.bomId || 'unknown';
    if (!acc[bomId]) {
      acc[bomId] = {
        bomId,
        bomName: req.bomName || 'Unknown BOM',
        items: [],
      };
    }
    acc[bomId].items.push(req);
    return acc;
  }, {} as Record<string, { bomId: string; bomName: string; items: typeof filteredRequirements }>);

  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {Object.values(groupedByBom).map((bomGroup) => {
        const isExpanded = expandedBoms.has(bomGroup.bomId);
        const totalItems = bomGroup.items.length;
        const criticalItems = bomGroup.items.filter(i => i.status === 'critical').length;
        const shortageItems = bomGroup.items.filter(i => i.status === 'shortage').length;

        return (
          <View key={bomGroup.bomId} style={styles.bomGroupCard}>
            {/* BOM Header - Clickable to expand/collapse */}
            <TouchableOpacity
              style={styles.bomHeader}
              onPress={() => onToggleBom(bomGroup.bomId)}
              activeOpacity={0.7}
            >
              <View style={styles.bomHeaderLeft}>
                <Text style={styles.bomHeaderIcon}>{isExpanded ? '▼' : '▶'}</Text>
                <View style={styles.bomHeaderInfo}>
                  <Text style={styles.bomName}>{bomGroup.bomName}</Text>
                  <Text style={styles.bomItemCount}>
                    {totalItems} item{totalItems !== 1 ? 's' : ''}
                    {criticalItems > 0 && ` • ${criticalItems} critical`}
                    {shortageItems > 0 && ` • ${shortageItems} shortage`}
                  </Text>
                </View>
              </View>
              {criticalItems > 0 && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalBadgeText}>CRITICAL</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* BOM Items - Show only when expanded */}
            {isExpanded && (
              <View style={styles.bomItemsContainer}>
                {bomGroup.items.map((requirement) => {
                  // Get DOORS link for this item
                  const doorsId = doorsLinkMap.get(requirement.itemCode);
                  const doorsData = doorsId ? doorsDataMap.get(doorsId) : undefined;

                  return (
                    <BomRequirementCard
                      key={`${requirement.bomId || 'unknown'}-${requirement.itemCode}`}
                      requirement={{
                        bomId: requirement.bomId || '',
                        bomName: requirement.bomName || 'Unknown BOM',
                        bomType: 'execution',
                        projectId: selectedProjectId || '',
                        materialId: requirement.materialId,
                        itemCode: requirement.itemCode,
                        description: requirement.description,
                        requiredQuantity: requirement.requiredQuantity,
                        unit: requirement.unit,
                        phase: '',
                        wbsCode: '',
                        priority: 'medium',
                        status: 'active',
                      }}
                      availableQuantity={requirement.availableQuantity}
                      doorsId={doorsData?.doorsId}
                      doorsCompliance={doorsData?.compliancePercentage}
                      onDoorsPress={() => {
                        if (doorsData?.packageId) {
                          onNavigateToDoorsDetail(doorsData.packageId);
                        }
                      }}
                      onLinkPress={() => onLinkPress(requirement.itemCode, requirement.description)}
                    />
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  emptyStateActions: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  productionModeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  list: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bomGroupCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  bomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bomHeaderIcon: {
    fontSize: 16,
    color: '#666',
    marginRight: 12,
  },
  bomHeaderInfo: {
    flex: 1,
  },
  bomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bomItemCount: {
    fontSize: 12,
    color: '#666',
  },
  criticalBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  criticalBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bomItemsContainer: {
    padding: 8,
  },
});
