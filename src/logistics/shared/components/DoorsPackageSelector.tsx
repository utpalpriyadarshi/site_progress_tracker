import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';

/**
 * DoorsPackageSelector
 *
 * Component for selecting and configuring door packages
 * Used across Logistics screens for consistent door package selection UI
 *
 * Features:
 * - Multi/single select mode
 * - Type filter badges
 * - Package details view
 * - Configuration button
 * - Status indicators
 * - Grouped by location
 * - Search filter
 * - Selected count display
 *
 * @example
 * ```tsx
 * <DoorsPackageSelector
 *   packages={[
 *     {
 *       id: '1',
 *       name: 'Office Doors Package A',
 *       type: 'standard',
 *       quantity: 20,
 *       doorSize: { width: 900, height: 2100, unit: 'mm' },
 *       frameType: 'Aluminium',
 *       hardwareSet: 'Standard Lock Set',
 *       site: 'Site A',
 *       building: 'Building 1',
 *       floor: 'Floor 2',
 *       status: 'planned',
 *       cost: 15000,
 *     },
 *   ]}
 *   selectedPackages={['1']}
 *   onSelectionChange={(ids) => console.log('Selected:', ids)}
 *   onConfigurePackage={(id) => console.log('Configure:', id)}
 *   multiSelect={true}
 *   showDetails={true}
 *   filterByType={['standard', 'fire-rated']}
 * />
 * ```
 */

export type DoorsPackageType = 'standard' | 'fire-rated' | 'acoustic' | 'security';
export type DoorsPackageStatus = 'planned' | 'ordered' | 'delivered' | 'installed';

export interface DoorsPackage {
  id: string;
  name: string;
  type: DoorsPackageType;
  quantity: number;
  doorSize: {
    width: number;
    height: number;
    unit: 'mm' | 'inch';
  };
  frameType: string;
  hardwareSet: string;
  site: string;
  building?: string;
  floor?: string;
  status: DoorsPackageStatus;
  cost?: number;
}

interface DoorsPackageSelectorProps {
  packages: DoorsPackage[];
  selectedPackages: string[];
  onSelectionChange: (packageIds: string[]) => void;
  onConfigurePackage?: (packageId: string) => void;
  multiSelect?: boolean;
  showDetails?: boolean;
  filterByType?: DoorsPackageType[];
}

const DoorsPackageSelector: React.FC<DoorsPackageSelectorProps> = ({
  packages,
  selectedPackages,
  onSelectionChange,
  onConfigurePackage,
  multiSelect = true,
  showDetails = true,
  filterByType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<DoorsPackageType | null>(
    null
  );

  const packageTypes: DoorsPackageType[] = [
    'standard',
    'fire-rated',
    'acoustic',
    'security',
  ];

  const getTypeColor = (type: DoorsPackageType) => {
    switch (type) {
      case 'standard':
        return '#2196F3';
      case 'fire-rated':
        return '#F44336';
      case 'acoustic':
        return '#9C27B0';
      case 'security':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusColor = (status: DoorsPackageStatus) => {
    switch (status) {
      case 'planned':
        return '#9E9E9E';
      case 'ordered':
        return '#2196F3';
      case 'delivered':
        return '#FF9800';
      case 'installed':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: DoorsPackageStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cost);
  };

  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Apply type filter
    if (filterByType && filterByType.length > 0) {
      filtered = filtered.filter((pkg) => filterByType.includes(pkg.type));
    }

    // Apply active type filter from UI
    if (activeTypeFilter) {
      filtered = filtered.filter((pkg) => pkg.type === activeTypeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(query) ||
          pkg.site.toLowerCase().includes(query) ||
          pkg.building?.toLowerCase().includes(query) ||
          pkg.floor?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [packages, filterByType, activeTypeFilter, searchQuery]);

  const groupedPackages = useMemo(() => {
    const groups: Record<string, DoorsPackage[]> = {};

    filteredPackages.forEach((pkg) => {
      const key = `${pkg.site}${pkg.building ? ` - ${pkg.building}` : ''}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(pkg);
    });

    return groups;
  }, [filteredPackages]);

  const handleTogglePackage = (packageId: string) => {
    if (multiSelect) {
      if (selectedPackages.includes(packageId)) {
        onSelectionChange(selectedPackages.filter((id) => id !== packageId));
      } else {
        onSelectionChange([...selectedPackages, packageId]);
      }
    } else {
      onSelectionChange([packageId]);
    }
  };

  const handleConfigure = (packageId: string) => {
    if (onConfigurePackage) {
      onConfigurePackage(packageId);
    }
  };

  const toggleTypeFilter = (type: DoorsPackageType) => {
    setActiveTypeFilter(activeTypeFilter === type ? null : type);
  };

  const getSelectionIndicatorStyle = (isSelected: boolean) => {
    return {
      backgroundColor: isSelected ? '#2196F3' : '#E0E0E0',
    };
  };

  const renderPackageCard = ({ item }: { item: DoorsPackage }) => {
    const isSelected = selectedPackages.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.packageCard, isSelected && styles.packageCardSelected]}
        onPress={() => handleTogglePackage(item.id)}
      >
        {/* Selection Indicator */}
        <View
          style={[
            styles.selectionIndicator,
            getSelectionIndicatorStyle(isSelected),
          ]}
        >
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* Content */}
        <View style={styles.packageContent}>
          {/* Header */}
          <View style={styles.packageHeader}>
            <Text style={styles.packageName} numberOfLines={1}>
              {item.name}
            </Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: getTypeColor(item.type) },
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {item.type.toUpperCase().replace('-', ' ')}
              </Text>
            </View>
          </View>

          {/* Details */}
          {showDetails && (
            <View style={styles.packageDetails}>
              <Text style={styles.detailText}>
                📏 {item.doorSize.width} × {item.doorSize.height} {item.doorSize.unit}
              </Text>
              <Text style={styles.detailText}>🚪 Qty: {item.quantity}</Text>
              <Text style={styles.detailText}>
                🔧 {item.frameType} | {item.hardwareSet}
              </Text>
              {item.floor && (
                <Text style={styles.detailText}>📍 {item.floor}</Text>
              )}
            </View>
          )}

          {/* Status & Cost */}
          <View style={styles.packageFooter}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
            {item.cost && (
              <Text style={styles.costText}>{formatCost(item.cost)}</Text>
            )}
          </View>

          {/* Configure Button */}
          {onConfigurePackage && (
            <TouchableOpacity
              style={styles.configureButton}
              onPress={() => handleConfigure(item.id)}
            >
              <Text style={styles.configureButtonText}>Configure</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Select {multiSelect ? 'Packages' : 'Package'}
        </Text>
        {selectedPackages.length > 0 && (
          <View style={styles.selectedCountBadge}>
            <Text style={styles.selectedCountText}>
              {selectedPackages.length} selected
            </Text>
          </View>
        )}
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search packages by name or location..."
        placeholderTextColor="#9E9E9E"
      />

      {/* Type Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContainer}
      >
        {packageTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              activeTypeFilter === type && {
                backgroundColor: getTypeColor(type),
                borderColor: getTypeColor(type),
              },
            ]}
            onPress={() => toggleTypeFilter(type)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeTypeFilter === type && styles.filterChipTextActive,
              ]}
            >
              {type.replace('-', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grouped Packages */}
      <ScrollView style={styles.packagesScroll}>
        {Object.entries(groupedPackages).map(([location, pkgs]) => (
          <View key={location} style={styles.locationGroup}>
            <Text style={styles.locationHeader}>{location}</Text>
            <FlatList
              data={pkgs}
              renderItem={renderPackageCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        ))}

        {filteredPackages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No packages found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  selectedCountBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedCountText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    color: '#212121',
  },
  filtersScroll: {
    maxHeight: 50,
    backgroundColor: '#fff',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#757575',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  packagesScroll: {
    flex: 1,
    marginTop: 8,
  },
  locationGroup: {
    marginBottom: 16,
  },
  locationHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
  },
  packageCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  packageCardSelected: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  selectionIndicator: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  packageContent: {
    flex: 1,
    padding: 12,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
  packageDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 2,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  configureButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  configureButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
});

export default DoorsPackageSelector;
