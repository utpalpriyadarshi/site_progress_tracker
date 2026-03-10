/**
 * CalendarView Component
 *
 * Calendar view for schedule items showing a monthly/weekly grid.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Text, Card, useTheme, IconButton, Chip } from 'react-native-paper';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../../components/common/EmptyState';
import type { ScheduleItem, ScheduleFilters } from '../UnifiedSchedule';
import { COLORS } from '../../../theme/colors';

// ==================== Types ====================

interface CalendarViewProps {
  items: ScheduleItem[];
  filters: ScheduleFilters;
  projects: any[];
  sites: any[];
  onProjectChange: (projectId: string) => void;
  onSiteChange: (siteId: string) => void;
  onSearchChange: (query: string) => void;
  onCriticalPathToggle: () => void;
  onClearSearch: () => void;
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: ScheduleItem[];
}

// ==================== Component ====================

export const CalendarView: React.FC<CalendarViewProps> = ({
  items,
  filters,
  onClearSearch,
}) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Get items that overlap with a given date
  const getItemsForDate = useCallback((date: Date): ScheduleItem[] => {
    const dateTime = date.getTime();
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayTime = nextDay.getTime();

    return items.filter((item) => {
      if (!item.plannedStartDate) return false;
      const startTime = item.plannedStartDate;
      const endTime = item.plannedEndDate || startTime;
      return startTime < nextDayTime && endTime >= dateTime;
    });
  }, [items]);

  // Generate calendar days
  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date,
        dayOfMonth: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        items: getItemsForDate(date),
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        items: getItemsForDate(date),
      });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: false,
        items: getItemsForDate(date),
      });
    }

    return days;
  }, [currentMonth, getItemsForDate]);

  // Distinct item count active in current month
  const monthItemCount = useMemo(() => {
    const seen = new Set<string>();
    calendarDays.filter(d => d.isCurrentMonth).forEach(d => d.items.forEach(i => seen.add(i.id)));
    return seen.size;
  }, [calendarDays]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(null);
  }, []);

  const handleDayPress = useCallback((day: CalendarDay) => {
    if (day.items.length > 0) {
      setSelectedDate(day.date);
    } else {
      setSelectedDate(null);
    }
  }, []);

  const selectedDayItems = useMemo(() => {
    if (!selectedDate) return [];
    return getItemsForDate(selectedDate);
  }, [selectedDate, getItemsForDate]);

  const renderDay = (day: CalendarDay, index: number) => {
    const isSelected = selectedDate && day.date.getTime() === selectedDate.getTime();
    const hasItems = day.items.length > 0;
    const hasCritical = day.items.some((item) => item.isCriticalPath);
    const hasDelayed = day.items.some((item) => item.isDelayed);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          !day.isCurrentMonth && styles.otherMonthDay,
          day.isToday && styles.todayCell,
          isSelected && styles.selectedDay,
        ]}
        onPress={() => handleDayPress(day)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${monthNames[day.date.getMonth()]} ${day.dayOfMonth}, ${day.items.length} items`}
        accessibilityState={{ selected: isSelected || false }}
      >
        <Text
          style={[
            styles.dayText,
            !day.isCurrentMonth && styles.otherMonthText,
            day.isToday && styles.todayText,
            isSelected && styles.selectedDayText,
          ]}
        >
          {day.dayOfMonth}
        </Text>
        {hasItems && (
          <View style={styles.indicators}>
            {hasCritical && <View style={[styles.dot, styles.criticalDot]} />}
            {hasDelayed && !hasCritical && <View style={[styles.dot, styles.delayedDot]} />}
            {!hasCritical && !hasDelayed && <View style={[styles.dot, styles.normalDot]} />}
            {day.items.length > 1 && (
              <Text style={styles.itemCount}>+{day.items.length - 1}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSelectedDayItem = ({ item }: { item: ScheduleItem }) => (
    <Card mode="elevated" style={styles.selectedItemCard}>
      <Card.Content style={styles.selectedItemContent}>
        <View style={styles.selectedItemHeader}>
          <Text style={styles.selectedItemName} numberOfLines={1}>
            {item.name}
          </Text>
          <StatusBadge status={item.status} size="small" />
        </View>
        <Text style={styles.selectedItemCategory}>
          {item.categoryName} · {item.siteName}
        </Text>
        {item.assigneeName && (
          <Text style={styles.selectedItemAssignee}>{item.assigneeName}</Text>
        )}
        <Text style={styles.selectedItemProgress}>
          {Math.round(item.progress * 100)}% complete
        </Text>
      </Card.Content>
    </Card>
  );

  if (items.length === 0) {
    return (
      <ScrollView style={styles.container}>
        {filters.searchQuery ? (
          <EmptyState
            icon="magnify"
            title="No Items Found"
            message={`No schedule items match "${filters.searchQuery}"`}
            actionText="Clear Search"
            onAction={onClearSearch}
          />
        ) : (
          <EmptyState
            icon="calendar-blank"
            title="No Schedule Items"
            message="Start planning by creating your first schedule item"
          />
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <IconButton
          icon="chevron-left"
          onPress={goToPreviousMonth}
          accessible
          accessibilityLabel="Previous month"
        />
        <TouchableOpacity onPress={goToToday} style={styles.monthTitleWrap}>
          <Text style={styles.monthTitle}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <Text style={styles.monthItemCount}>{monthItemCount} item{monthItemCount !== 1 ? 's' : ''}</Text>
        </TouchableOpacity>
        <IconButton
          icon="chevron-right"
          onPress={goToNextMonth}
          accessible
          accessibilityLabel="Next month"
        />
      </View>

      {/* Day Names */}
      <View style={styles.dayNamesRow}>
        {dayNames.map((name) => (
          <Text key={name} style={styles.dayName}>
            {name}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map(renderDay)}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.criticalDot]} />
          <Text style={styles.legendText}>Critical</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.delayedDot]} />
          <Text style={styles.legendText}>Delayed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.normalDot]} />
          <Text style={styles.legendText}>On Track</Text>
        </View>
      </View>

      {/* Tap hint */}
      {!selectedDate && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Tap a highlighted day to see items</Text>
        </View>
      )}

      {/* Selected Day Items */}
      {selectedDate && selectedDayItems.length > 0 && (
        <View style={styles.selectedDaySection}>
          <Text style={styles.selectedDayTitle}>
            {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()} -{' '}
            {selectedDayItems.length} item(s)
          </Text>
          <FlatList
            data={selectedDayItems}
            keyExtractor={(item) => item.id}
            renderItem={renderSelectedDayItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedDayList}
          />
        </View>
      )}
    </ScrollView>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  monthTitleWrap: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthItemCount: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  hint: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  hintText: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  dayNamesRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 8,
  },
  otherMonthDay: {
    opacity: 0.4,
  },
  todayCell: {
    backgroundColor: COLORS.INFO_BG,
  },
  selectedDay: {
    backgroundColor: COLORS.INFO,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  otherMonthText: {
    color: '#999',
  },
  todayText: {
    color: COLORS.INFO,
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  criticalDot: {
    backgroundColor: COLORS.ERROR,
  },
  delayedDot: {
    backgroundColor: COLORS.WARNING,
  },
  normalDot: {
    backgroundColor: COLORS.SUCCESS,
  },
  itemCount: {
    fontSize: 8,
    color: '#666',
    marginLeft: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'white',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  selectedDaySection: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 16,
    paddingBottom: 8,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedDayList: {
    paddingRight: 16,
  },
  selectedItemCard: {
    width: 200,
    marginRight: 12,
  },
  selectedItemContent: {
    padding: 12,
  },
  selectedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  selectedItemCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedItemAssignee: {
    fontSize: 11,
    color: '#5C6BC0',
    marginBottom: 4,
  },
  selectedItemProgress: {
    fontSize: 12,
    color: COLORS.INFO,
  },
});

export default CalendarView;
