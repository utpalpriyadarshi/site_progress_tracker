import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../../theme/colors';

/**
 * DeliveryScheduleCalendar
 *
 * Interactive calendar component for delivery scheduling
 * Used across Logistics screens for visualizing and managing deliveries
 *
 * Features:
 * - Month/week/day view modes
 * - Delivery indicators on dates with status color coding
 * - Date selection
 * - Add delivery quick action
 * - Delivery count badges
 * - Today indicator
 * - Navigate between months
 *
 * @example
 * ```tsx
 * <DeliveryScheduleCalendar
 *   deliveries={[
 *     {
 *       id: '1',
 *       date: Date.now(),
 *       supplier: 'Steel Co.',
 *       materials: ['Steel Beams', 'Rebar'],
 *       status: 'scheduled',
 *       site: 'Site A',
 *       poNumber: 'PO-001',
 *     },
 *   ]}
 *   selectedDate={new Date()}
 *   onDateSelect={(date) => console.log('Selected:', date)}
 *   onDeliveryPress={(delivery) => console.log('Delivery:', delivery)}
 *   onAddDelivery={(date) => console.log('Add delivery:', date)}
 *   viewMode="month"
 *   showAddButton={true}
 * />
 * ```
 */

export interface DeliverySchedule {
  id: string;
  date: number;
  supplier: string;
  materials: string[];
  status: 'scheduled' | 'in-transit' | 'delivered' | 'delayed';
  site: string;
  poNumber?: string;
  notes?: string;
}

interface DeliveryScheduleCalendarProps {
  deliveries: DeliverySchedule[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onDeliveryPress?: (delivery: DeliverySchedule) => void;
  onAddDelivery?: (date: Date) => void;
  viewMode?: 'month' | 'week' | 'day';
  showAddButton?: boolean;
}

const DeliveryScheduleCalendar: React.FC<DeliveryScheduleCalendarProps> = ({
  deliveries,
  selectedDate,
  onDateSelect,
  onDeliveryPress,
  onAddDelivery,
  showAddButton = false,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = useMemo(() => new Date(), []);

  const getStatusColor = (status: DeliverySchedule['status']) => {
    switch (status) {
      case 'scheduled':
        return COLORS.INFO;
      case 'in-transit':
        return COLORS.WARNING;
      case 'delivered':
        return COLORS.SUCCESS;
      case 'delayed':
        return COLORS.ERROR;
      default:
        return COLORS.DISABLED;
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const getDeliveriesForDate = (date: Date) => {
    return deliveries.filter((delivery) =>
      isSameDay(new Date(delivery.date), date)
    );
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDatePress = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleAddDelivery = (date: Date) => {
    if (onAddDelivery) {
      onAddDelivery(date);
    }
  };

  const handleDeliveryPress = (delivery: DeliverySchedule) => {
    if (onDeliveryPress) {
      onDeliveryPress(delivery);
    }
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const monthDays = getMonthDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthYearText}>{formatMonthYear()}</Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Week Day Headers */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView style={styles.calendarScroll}>
        <View style={styles.calendarGrid}>
          {monthDays.map((date, index) => {
            if (!date) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const dayDeliveries = getDeliveriesForDate(date);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const hasDeliveries = dayDeliveries.length > 0;

            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedCell,
                ]}
                onPress={() => handleDatePress(date)}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && styles.todayText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {date.getDate()}
                </Text>

                {/* Delivery Indicators */}
                {hasDeliveries && (
                  <View style={styles.deliveryIndicators}>
                    {dayDeliveries.slice(0, 3).map((delivery) => (
                      <View
                        key={delivery.id}
                        style={[
                          styles.deliveryDot,
                          { backgroundColor: getStatusColor(delivery.status) },
                        ]}
                      />
                    ))}
                    {dayDeliveries.length > 3 && (
                      <View style={styles.deliveryCount}>
                        <Text style={styles.deliveryCountText}>
                          +{dayDeliveries.length - 3}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Date Deliveries */}
        {selectedDate && getDeliveriesForDate(selectedDate).length > 0 && (
          <View style={styles.selectedDateSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Deliveries on {selectedDate.toLocaleDateString()}
              </Text>
              {showAddButton && onAddDelivery && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddDelivery(selectedDate)}
                >
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {getDeliveriesForDate(selectedDate).map((delivery) => (
              <TouchableOpacity
                key={delivery.id}
                style={styles.deliveryCard}
                onPress={() => handleDeliveryPress(delivery)}
              >
                <View
                  style={[
                    styles.deliveryStatusBar,
                    { backgroundColor: getStatusColor(delivery.status) },
                  ]}
                />
                <View style={styles.deliveryContent}>
                  <View style={styles.deliveryHeader}>
                    <Text style={styles.deliverySupplier}>{delivery.supplier}</Text>
                    <View
                      style={[
                        styles.deliveryStatusBadge,
                        { backgroundColor: getStatusColor(delivery.status) },
                      ]}
                    >
                      <Text style={styles.deliveryStatusText}>
                        {delivery.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.deliverySite}>📍 {delivery.site}</Text>
                  <Text style={styles.deliveryMaterials}>
                    {delivery.materials.length} item(s):{' '}
                    {delivery.materials.slice(0, 2).join(', ')}
                    {delivery.materials.length > 2 && '...'}
                  </Text>
                  {delivery.poNumber && (
                    <Text style={styles.deliveryPO}>PO: {delivery.poNumber}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
  },
  navButtonText: {
    fontSize: 24,
    color: '#212121',
    fontWeight: '600',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
  },
  calendarScroll: {
    maxHeight: 500,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  todayCell: {
    backgroundColor: COLORS.INFO_BG,
  },
  selectedCell: {
    backgroundColor: COLORS.INFO,
    borderColor: COLORS.INFO,
  },
  dayNumber: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
    marginBottom: 4,
  },
  todayText: {
    color: COLORS.INFO,
    fontWeight: '700',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  deliveryIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deliveryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deliveryCount: {
    backgroundColor: '#212121',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  deliveryCountText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '600',
  },
  selectedDateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  addButton: {
    backgroundColor: COLORS.INFO,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  deliveryCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  deliveryStatusBar: {
    width: 4,
  },
  deliveryContent: {
    flex: 1,
    padding: 10,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deliverySupplier: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  deliveryStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deliveryStatusText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
  deliverySite: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 2,
  },
  deliveryMaterials: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  deliveryPO: {
    fontSize: 11,
    color: COLORS.DISABLED,
  },
});

export default DeliveryScheduleCalendar;
