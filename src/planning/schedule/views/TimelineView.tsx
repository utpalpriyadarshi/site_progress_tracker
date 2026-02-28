/**
 * TimelineView — Gantt Chart
 *
 * Fixed label column (task name, assignee, %) + horizontally scrollable
 * time axis with Gantt bars.  All weeks from project start are shown.
 */

import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { database } from '../../../../models/database';
import { logger } from '../../../services/LoggingService';
import { EmptyState } from '../../../components/common/EmptyState';
import type { ScheduleItem, ScheduleFilters } from '../UnifiedSchedule';
import { COLORS } from '../../../theme/colors';

// ── Layout constants ─────────────────────────────────────────────────────────
const LABEL_W = 140;
const DAY_W   = 9;           // pixels per day
const WEEK_W  = DAY_W * 7;  // 63 px per week column
const ROW_H   = 58;
const MONTH_H = 22;
const WEEK_H  = 22;
const HEADER_H = MONTH_H + WEEK_H;
const BAR_H   = 18;
const DAY_MS  = 86_400_000;

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Types ────────────────────────────────────────────────────────────────────
interface TimelineViewProps {
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

interface WeekMark  { left: number; label: string }
interface MonthSpan { left: number; width: number; label: string }

// ── Helpers ──────────────────────────────────────────────────────────────────
function floorToMonday(ms: number): number {
  const d = new Date(ms);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function ceilToSunday(ms: number): number {
  const d = new Date(ms);
  const dow = d.getDay();
  // advance to next Sunday then add 1 week padding
  d.setDate(d.getDate() + (dow === 0 ? 0 : 7 - dow) + 7);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function barColor(item: ScheduleItem): string {
  if (item.isCriticalPath)          return COLORS.ERROR;
  if (item.status === 'completed')  return COLORS.SUCCESS;
  if (item.isDelayed)               return COLORS.WARNING;
  if (item.status === 'in_progress') return COLORS.INFO;
  return '#9E9E9E';
}

// ── Component ────────────────────────────────────────────────────────────────
export const TimelineView: React.FC<TimelineViewProps> = ({
  items,
  filters,
  sites,
  onSiteChange,
  onSearchChange,
  onCriticalPathToggle,
}) => {
  const headerScrollRef = useRef<ScrollView>(null);
  const criticalCount = items.filter(i => i.isCriticalPath).length;

  // ── Timeline bounds ──────────────────────────────────────────────────────
  const { timelineStart, timelineEnd, totalWidth, totalH } = useMemo(() => {
    const starts = items
      .map(i => i.plannedStartDate)
      .filter((x): x is number => x !== null && x !== undefined);
    const ends = items
      .map(i => i.plannedEndDate ?? i.plannedStartDate)
      .filter((x): x is number => x !== null && x !== undefined);

    const tStart = starts.length > 0
      ? floorToMonday(Math.min(...starts))
      : floorToMonday(Date.now());
    const tEnd = ends.length > 0
      ? ceilToSunday(Math.max(...ends))
      : ceilToSunday(Date.now() + 84 * DAY_MS);

    const days = Math.max(7, Math.ceil((tEnd - tStart) / DAY_MS));
    return {
      timelineStart: tStart,
      timelineEnd:   tEnd,
      totalWidth:    days * DAY_W,
      totalH:        items.length * ROW_H,
    };
  }, [items]);

  // ── Week / month header marks ────────────────────────────────────────────
  const { weeks, months } = useMemo(() => {
    const weekList: WeekMark[]  = [];
    const monthAcc: Record<string, { left: number; weekCount: number }> = {};

    const cursor = new Date(timelineStart);
    while (cursor.getTime() <= timelineEnd) {
      const left = Math.round((cursor.getTime() - timelineStart) / DAY_MS) * DAY_W;
      weekList.push({ left, label: String(cursor.getDate()) });

      const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
      if (!monthAcc[key]) monthAcc[key] = { left, weekCount: 0 };
      monthAcc[key].weekCount += 1;

      cursor.setDate(cursor.getDate() + 7);
    }

    const monthList: MonthSpan[] = Object.entries(monthAcc).map(([key, v]) => {
      const [yr, mo] = key.split('-').map(Number);
      return { left: v.left, width: v.weekCount * WEEK_W, label: `${MONTH_NAMES[mo]} ${yr}` };
    });

    return { weeks: weekList, months: monthList };
  }, [timelineStart, timelineEnd]);

  // ── Today X position ────────────────────────────────────────────────────
  const todayX = useMemo(() => {
    const now = Date.now();
    if (now < timelineStart || now > timelineEnd) return null;
    return Math.round((now - timelineStart) / DAY_MS) * DAY_W;
  }, [timelineStart, timelineEnd]);

  // ── Scroll sync ──────────────────────────────────────────────────────────
  const onBarsScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    headerScrollRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
  }, []);

  // ── Critical path toggle ─────────────────────────────────────────────────
  const handleFlag = useCallback(async (id: string, current: boolean) => {
    try {
      await database.write(async () => {
        const rec = await database.collections.get('items').find(id);
        await rec.update((r: any) => { r.isCriticalPath = !current; });
      });
    } catch (err) {
      logger.error('[Timeline] critical path toggle', err as Error);
      Alert.alert('Error', 'Failed to update critical path status');
    }
  }, []);

  // ── Bar geometry ─────────────────────────────────────────────────────────
  const getBar = useCallback((item: ScheduleItem): { left: number; width: number } | null => {
    if (!item.plannedStartDate) return null;
    const end   = item.plannedEndDate ?? (item.plannedStartDate + 7 * DAY_MS);
    const left  = Math.max(0, Math.round((item.plannedStartDate - timelineStart) / DAY_MS) * DAY_W);
    const width = Math.max(DAY_W * 2, Math.round((end - item.plannedStartDate) / DAY_MS) * DAY_W);
    return { left, width };
  }, [timelineStart]);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="chart-gantt"
          title={filters.showCriticalPathOnly ? 'No Critical Path Items' : 'No Schedule Items'}
          message={
            filters.showCriticalPathOnly
              ? 'No items are marked as critical path'
              : 'Create schedule items to see the Gantt chart'
          }
          actionText={filters.showCriticalPathOnly ? 'Show All' : undefined}
          onAction={filters.showCriticalPathOnly ? onCriticalPathToggle : undefined}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Compact filter bar ──────────────────────────────────────────── */}
      <View style={styles.filterBar}>
        <Searchbar
          placeholder="Search..."
          onChangeText={onSearchChange}
          value={filters.searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
        <TouchableOpacity
          style={[styles.flagPill, filters.showCriticalPathOnly && styles.flagPillActive]}
          onPress={onCriticalPathToggle}
          activeOpacity={0.7}
        >
          <Icon
            name="flag-variant"
            size={13}
            color={filters.showCriticalPathOnly ? 'white' : COLORS.ERROR}
          />
          <Text style={[styles.flagPillText, filters.showCriticalPathOnly && styles.flagPillTextActive]}>
            {criticalCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Site filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.siteBar}
        contentContainerStyle={styles.siteBarContent}
      >
        {([{ id: '', name: 'All Sites' }, ...sites] as { id: string; name: string }[]).map(s => {
          const active = filters.siteId === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.sitePill, active && styles.sitePillActive]}
              onPress={() => onSiteChange(s.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sitePillText, active && styles.sitePillTextActive]}>{s.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Gantt chart ─────────────────────────────────────────────────── */}
      <View style={styles.gantt}>

        {/* Sticky time header: corner + month/week axis */}
        <View style={styles.timeHeaderRow}>
          <View style={[styles.cornerCell, { width: LABEL_W, height: HEADER_H }]}>
            <Text style={styles.cornerText}>Task · {items.length}</Text>
          </View>
          <ScrollView
            horizontal
            ref={headerScrollRef}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1, height: HEADER_H }}
          >
            <View style={{ width: totalWidth, height: HEADER_H }}>
              {/* Month row */}
              {months.map((m, i) => (
                <View key={i} style={[styles.monthCell, { left: m.left, width: m.width }]}>
                  <Text style={styles.monthText} numberOfLines={1}>{m.label}</Text>
                </View>
              ))}
              {/* Week row */}
              {weeks.map((w, i) => (
                <View key={i} style={[styles.weekCell, { left: w.left }]}>
                  <Text style={styles.weekText}>{w.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Body: label column (fixed) + bars (horizontal scroll) */}
        <ScrollView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row' }}>

            {/* Fixed label column */}
            <View style={{ width: LABEL_W }}>
              {items.map(item => (
                <View
                  key={item.id}
                  style={[styles.labelCell, item.isCriticalPath && styles.labelCellCritical]}
                >
                  <View style={styles.labelContent}>
                    <Text style={styles.labelName} numberOfLines={2}>{item.name}</Text>
                    {item.assigneeName ? (
                      <View style={styles.assigneeRow}>
                        <Icon
                          name={item.assigneeRole === 'designer' ? 'account-edit' : 'account-hard-hat'}
                          size={10}
                          color="#5C6BC0"
                        />
                        <Text style={styles.assigneeLabel} numberOfLines={1}>{item.assigneeName}</Text>
                      </View>
                    ) : null}
                    <Text style={[
                      styles.pctLabel,
                      { color: item.isCriticalPath ? COLORS.ERROR : item.isDelayed ? COLORS.WARNING : COLORS.INFO },
                    ]}>
                      {Math.round(item.progress * 100)}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleFlag(item.id, item.isCriticalPath)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  >
                    <Icon
                      name="flag-variant"
                      size={15}
                      color={item.isCriticalPath ? COLORS.ERROR : '#D0D0D0'}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Horizontally scrollable bars area */}
            <ScrollView
              horizontal
              onScroll={onBarsScroll}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={true}
              nestedScrollEnabled={true}
              style={{ height: totalH }}
            >
              <View style={{ width: totalWidth, height: totalH, position: 'relative' }}>

                {/* Alternating row backgrounds */}
                {items.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.rowBg,
                      { top: i * ROW_H },
                      i % 2 === 1 && styles.rowBgAlt,
                    ]}
                  />
                ))}

                {/* Week vertical grid lines */}
                {weeks.map((w, i) => (
                  <View key={i} style={[styles.weekGrid, { left: w.left, height: totalH }]} />
                ))}

                {/* Today line */}
                {todayX !== null && (
                  <View style={[styles.todayLine, { left: todayX, height: totalH }]} />
                )}

                {/* Gantt bars */}
                {items.map((item, i) => {
                  const bar  = getBar(item);
                  const color = barColor(item);
                  const top  = i * ROW_H + Math.round((ROW_H - BAR_H) / 2);

                  if (!bar) {
                    return (
                      <View key={item.id} style={[styles.barNoDates, { top }]}>
                        <Text style={styles.barNoDatesText}>no dates</Text>
                      </View>
                    );
                  }

                  const fillWidth = Math.round(bar.width * Math.min(item.progress, 1));

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.bar,
                        {
                          top,
                          left:            bar.left,
                          width:           bar.width,
                          borderColor:     color,
                          backgroundColor: color + '28',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.barFill,
                          { width: fillWidth, backgroundColor: color },
                        ]}
                      />
                    </View>
                  );
                })}

              </View>
            </ScrollView>

          </View>
        </ScrollView>

      </View>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    gap: 8,
  },
  searchBar:  { flex: 1, height: 38, elevation: 0 },
  searchInput: { fontSize: 13 },
  flagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
    backgroundColor: 'white',
  },
  flagPillActive:     { backgroundColor: COLORS.ERROR },
  flagPillText:       { fontSize: 13, fontWeight: '700', color: COLORS.ERROR },
  flagPillTextActive: { color: 'white' },

  // Site bar
  siteBar:        { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#EEE', maxHeight: 38 },
  siteBarContent: { paddingHorizontal: 8, paddingVertical: 5, gap: 6 },
  sitePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    backgroundColor: 'white',
  },
  sitePillActive:     { backgroundColor: COLORS.INFO, borderColor: COLORS.INFO },
  sitePillText:       { fontSize: 12, color: '#555' },
  sitePillTextActive: { color: 'white', fontWeight: '600' },

  // Gantt shell
  gantt: { flex: 1 },

  // Time header
  timeHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 2,
    borderBottomColor: '#DDD',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cornerCell: {
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 4,
    borderRightWidth: 2,
    borderRightColor: '#DDD',
    backgroundColor: '#F5F5F5',
  },
  cornerText: { fontSize: 11, color: '#888', fontWeight: '600' },

  monthCell: {
    position: 'absolute',
    height: MONTH_H,
    paddingLeft: 4,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  monthText: { fontSize: 11, fontWeight: '700', color: '#333' },

  weekCell: {
    position: 'absolute',
    top: MONTH_H,
    width: WEEK_W,
    height: WEEK_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E8E8E8',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  weekText: { fontSize: 10, color: '#999' },

  // Label column
  labelCell: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 6,
    borderRightWidth: 2,
    borderRightColor: '#DDD',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: 'white',
  },
  labelCellCritical: { backgroundColor: '#FFF5F5' },
  labelContent:      { flex: 1, paddingRight: 4 },
  labelName:         { fontSize: 12, fontWeight: '600', color: '#222', lineHeight: 15 },
  assigneeRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 },
  assigneeLabel:     { fontSize: 10, color: '#5C6BC0', flex: 1 },
  pctLabel:          { fontSize: 10, fontWeight: '700', marginTop: 2 },

  // Bars area
  rowBg:    { position: 'absolute', left: 0, right: 0, height: ROW_H, backgroundColor: 'white' },
  rowBgAlt: { backgroundColor: '#F9F9FB' },
  weekGrid: { position: 'absolute', top: 0, width: 1, backgroundColor: '#EBEBEB' },
  todayLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    backgroundColor: '#E53935',
    opacity: 0.9,
    zIndex: 10,
  },
  bar: {
    position: 'absolute',
    height: BAR_H,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  barFill:       { height: '100%', borderRadius: 3 },
  barNoDates: {
    position: 'absolute',
    height: BAR_H,
    left: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    backgroundColor: '#F5F5F5',
  },
  barNoDatesText: { fontSize: 9, color: '#BDBDBD' },
});

export default TimelineView;
