import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../theme/colors';

/**
 * EquipmentCard
 *
 * Reusable card component for displaying equipment with status and availability
 * Used across Logistics screens for consistent equipment UI
 *
 * Features:
 * - Status badge with color coding
 * - Category icon
 * - Location/assignment display
 * - Maintenance status indicator
 * - Availability calendar
 * - Allocate/maintenance actions
 * - Service due warnings
 * - Compact variant for lists
 *
 * @example
 * ```tsx
 * <EquipmentCard
 *   equipment={{
 *     id: '1',
 *     name: 'Concrete Mixer',
 *     category: 'machinery',
 *     code: 'EQ-001',
 *     status: 'available',
 *     location: {
 *       site: 'Site A',
 *       assignedTo: 'John Doe',
 *     },
 *     specifications: {
 *       make: 'ABC Corp',
 *       model: 'MX-500',
 *       serialNumber: 'SN-12345',
 *     },
 *     maintenance: {
 *       lastService: Date.now() - 30 * 24 * 60 * 60 * 1000,
 *       nextService: Date.now() + 30 * 24 * 60 * 60 * 1000,
 *       serviceInterval: 90,
 *     },
 *     availability: {
 *       availableFrom: Date.now(),
 *       allocatedUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,
 *     },
 *   }}
 *   onPress={(id) => console.log('View equipment:', id)}
 *   onAllocate={(equipment) => console.log('Allocate:', equipment)}
 *   onMaintenance={(equipment) => console.log('Maintenance:', equipment)}
 *   showActions={true}
 *   showLocation={true}
 *   showHistory={false}
 *   variant="default"
 * />
 * ```
 */

export interface Equipment {
  id: string;
  name: string;
  category: 'machinery' | 'tools' | 'vehicles' | 'safety';
  code: string;
  status: 'available' | 'in-use' | 'maintenance' | 'retired';
  location: {
    site?: string;
    assignedTo?: string;
  };
  specifications?: {
    make?: string;
    model?: string;
    serialNumber?: string;
  };
  maintenance?: {
    lastService?: number;
    nextService?: number;
    serviceInterval?: number; // days
  };
  availability?: {
    availableFrom?: number;
    allocatedUntil?: number;
  };
}

interface EquipmentCardProps {
  equipment: Equipment;
  onPress?: (id: string) => void;
  onAllocate?: (equipment: Equipment) => void;
  onMaintenance?: (equipment: Equipment) => void;
  showActions?: boolean;
  showLocation?: boolean;
  showHistory?: boolean;
  variant?: 'default' | 'compact';
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onPress,
  onAllocate,
  onMaintenance,
  showActions = false,
  showLocation = true,
  showHistory = false,
  variant = 'default',
}) => {
  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'available':
        return COLORS.SUCCESS;
      case 'in-use':
        return COLORS.WARNING;
      case 'maintenance':
        return COLORS.ERROR;
      case 'retired':
        return COLORS.DISABLED;
      default:
        return COLORS.DISABLED;
    }
  };

  const getStatusLabel = (status: Equipment['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'in-use':
        return 'In Use';
      case 'maintenance':
        return 'Maintenance';
      case 'retired':
        return 'Retired';
      default:
        return 'Unknown';
    }
  };

  const getCategoryIcon = (category: Equipment['category']) => {
    switch (category) {
      case 'machinery':
        return '⚙️';
      case 'tools':
        return '🔧';
      case 'vehicles':
        return '🚗';
      case 'safety':
        return '🦺';
      default:
        return '📦';
    }
  };

  const getCategoryLabel = (category: Equipment['category']) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isServiceDueSoon = () => {
    if (!equipment.maintenance?.nextService) {
      return false;
    }
    const daysUntilService = Math.floor(
      (equipment.maintenance.nextService - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilService <= 7 && daysUntilService >= 0;
  };

  const isServiceOverdue = () => {
    if (!equipment.maintenance?.nextService) {
      return false;
    }
    return equipment.maintenance.nextService < Date.now();
  };

  const handlePress = () => {
    if (onPress) {
      onPress(equipment.id);
    }
  };

  const handleAllocate = () => {
    if (onAllocate) {
      onAllocate(equipment);
    }
  };

  const handleMaintenance = () => {
    if (onMaintenance) {
      onMaintenance(equipment);
    }
  };

  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity
      style={[styles.card, isCompact && styles.cardCompact]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Status Indicator */}
      <View
        style={[
          styles.statusIndicator,
          { backgroundColor: getStatusColor(equipment.status) },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryIcon}>
                {getCategoryIcon(equipment.category)}
              </Text>
              <Text style={styles.code}>{equipment.code}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {equipment.name}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(equipment.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusLabel(equipment.status)}
            </Text>
          </View>
        </View>

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {getCategoryLabel(equipment.category)}
          </Text>
        </View>

        {/* Specifications (non-compact) */}
        {!isCompact && equipment.specifications && (
          <View style={styles.specsContainer}>
            {equipment.specifications.make && (
              <Text style={styles.specText}>
                Make: {equipment.specifications.make}
              </Text>
            )}
            {equipment.specifications.model && (
              <Text style={styles.specText}>
                Model: {equipment.specifications.model}
              </Text>
            )}
            {equipment.specifications.serialNumber && (
              <Text style={styles.specText}>
                S/N: {equipment.specifications.serialNumber}
              </Text>
            )}
          </View>
        )}

        {/* Location/Assignment */}
        {showLocation && (
          <View style={styles.locationContainer}>
            {equipment.location.site && (
              <Text style={styles.locationText}>
                📍 {equipment.location.site}
              </Text>
            )}
            {equipment.location.assignedTo && (
              <Text style={styles.assignedText}>
                👤 Assigned to: {equipment.location.assignedTo}
              </Text>
            )}
          </View>
        )}

        {/* Maintenance Status */}
        {showHistory && equipment.maintenance && (
          <View style={styles.maintenanceContainer}>
            {isServiceOverdue() && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>⚠️ Service Overdue!</Text>
              </View>
            )}
            {!isServiceOverdue() && isServiceDueSoon() && (
              <View style={styles.cautionBanner}>
                <Text style={styles.cautionText}>🔔 Service Due Soon</Text>
              </View>
            )}
            {equipment.maintenance.lastService && (
              <Text style={styles.maintenanceText}>
                Last Service: {formatDate(equipment.maintenance.lastService)}
              </Text>
            )}
            {equipment.maintenance.nextService && (
              <Text style={styles.maintenanceText}>
                Next Service: {formatDate(equipment.maintenance.nextService)}
              </Text>
            )}
          </View>
        )}

        {/* Availability */}
        {!isCompact && equipment.availability && (
          <View style={styles.availabilityContainer}>
            {equipment.availability.availableFrom && (
              <Text style={styles.availabilityText}>
                Available from: {formatDate(equipment.availability.availableFrom)}
              </Text>
            )}
            {equipment.availability.allocatedUntil && (
              <Text style={styles.availabilityText}>
                Allocated until:{' '}
                {formatDate(equipment.availability.allocatedUntil)}
              </Text>
            )}
          </View>
        )}

        {/* Actions */}
        {showActions && (
          <View style={styles.actionsRow}>
            {onAllocate && equipment.status === 'available' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={handleAllocate}
              >
                <Text style={styles.actionTextPrimary}>Allocate</Text>
              </TouchableOpacity>
            )}
            {onMaintenance && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMaintenance}
              >
                <Text style={styles.actionText}>Maintenance</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCompact: {
    marginVertical: 4,
  },
  statusIndicator: {
    width: 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  code: {
    fontSize: 12,
    color: '#757575',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.INFO_BG,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '600',
  },
  specsContainer: {
    marginBottom: 8,
  },
  specText: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 2,
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.INFO,
    fontWeight: '500',
    marginBottom: 2,
  },
  assignedText: {
    fontSize: 12,
    color: '#616161',
  },
  maintenanceContainer: {
    marginBottom: 8,
  },
  warningBanner: {
    backgroundColor: COLORS.ERROR_BG,
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '600',
  },
  cautionBanner: {
    backgroundColor: COLORS.WARNING_BG,
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  cautionText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  maintenanceText: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 2,
  },
  availabilityContainer: {
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.INFO,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.INFO,
    borderColor: COLORS.INFO,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.INFO,
    fontWeight: '600',
  },
  actionTextPrimary: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default EquipmentCard;
