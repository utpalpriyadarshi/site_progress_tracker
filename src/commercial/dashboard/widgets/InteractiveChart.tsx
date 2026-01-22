/**
 * InteractiveChart Component
 *
 * A wrapper component for charts that adds interactive features:
 * - Tap to show tooltip with details
 * - Long press for options menu
 * - Pinch to zoom (for detailed views)
 * - Accessibility mode (screen reader friendly)
 *
 * @example
 * ```tsx
 * <InteractiveChart
 *   data={chartData}
 *   renderChart={({ data, selectedIndex }) => (
 *     <MyChart data={data} highlightIndex={selectedIndex} />
 *   )}
 *   renderTooltip={({ item, position }) => (
 *     <TooltipContent item={item} />
 *   )}
 *   onDataPointPress={(item, index) => console.log('Selected:', item)}
 *   accessibilityLabel="Monthly spending chart"
 * />
 * ```
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  AccessibilityInfo,
  ScrollView,
} from 'react-native';

export interface ChartDataPoint {
  /** Unique identifier for the data point */
  id: string;
  /** Display label */
  label: string;
  /** Primary value */
  value: number;
  /** Optional secondary value (for comparison) */
  secondaryValue?: number;
  /** Optional color override */
  color?: string;
  /** Additional metadata for tooltip */
  metadata?: Record<string, any>;
}

export interface TooltipPosition {
  x: number;
  y: number;
}

export interface TooltipRenderProps {
  item: ChartDataPoint;
  index: number;
  position: TooltipPosition;
  onClose: () => void;
}

export interface ChartRenderProps<T extends ChartDataPoint> {
  data: T[];
  selectedIndex: number | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
}

export interface OptionsMenuItem {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface InteractiveChartProps<T extends ChartDataPoint> {
  /** Chart data points */
  data: T[];
  /** Render the chart with current state */
  renderChart: (props: ChartRenderProps<T>) => React.ReactNode;
  /** Render custom tooltip content */
  renderTooltip?: (props: TooltipRenderProps) => React.ReactNode;
  /** Callback when data point is tapped */
  onDataPointPress?: (item: T, index: number) => void;
  /** Callback when data point is long pressed */
  onDataPointLongPress?: (item: T, index: number) => void;
  /** Options menu items for long press */
  optionsMenuItems?: OptionsMenuItem[];
  /** Enable pinch to zoom */
  enableZoom?: boolean;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Enable pan gestures */
  enablePan?: boolean;
  /** Accessibility label for the chart */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Format value for accessibility */
  formatValueForAccessibility?: (value: number) => string;
  /** Chart height */
  height?: number;
  /** Show data table for screen readers */
  showAccessibleDataTable?: boolean;
}

interface TooltipState {
  visible: boolean;
  item: ChartDataPoint | null;
  index: number;
  position: TooltipPosition;
}

interface OptionsMenuState {
  visible: boolean;
  item: ChartDataPoint | null;
  index: number;
}

export function InteractiveChart<T extends ChartDataPoint>({
  data,
  renderChart,
  renderTooltip,
  onDataPointPress,
  onDataPointLongPress,
  optionsMenuItems,
  enableZoom = true,
  minZoom = 1,
  maxZoom = 3,
  enablePan = true,
  accessibilityLabel,
  accessibilityHint = 'Double tap on a data point to see details',
  formatValueForAccessibility = (v) => v.toLocaleString(),
  height = 200,
  showAccessibleDataTable = true,
}: InteractiveChartProps<T>) {
  // State
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    item: null,
    index: -1,
    position: { x: 0, y: 0 },
  });

  const [optionsMenu, setOptionsMenu] = useState<OptionsMenuState>({
    visible: false,
    item: null,
    index: -1,
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState(false);

  // Refs
  const containerRef = useRef<View>(null);
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const panAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastPinchDistance = useRef<number | null>(null);
  const lastPanOffset = useRef({ x: 0, y: 0 });

  // Check accessibility status
  useEffect(() => {
    const checkAccessibility = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsAccessibilityEnabled(enabled);
    };

    checkAccessibility();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsAccessibilityEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Calculate distance between two touch points
  const getDistance = (touches: any[]): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Pan responder for zoom and pan gestures
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only capture if intentional movement or pinch
          return (
            Math.abs(gestureState.dx) > 10 ||
            Math.abs(gestureState.dy) > 10
          );
        },
        onPanResponderGrant: (evt) => {
          lastPanOffset.current = panOffset;
          if (evt.nativeEvent.touches.length >= 2) {
            lastPinchDistance.current = getDistance(evt.nativeEvent.touches);
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;

          // Pinch to zoom
          if (enableZoom && touches.length >= 2) {
            const currentDistance = getDistance(touches);
            if (lastPinchDistance.current !== null && lastPinchDistance.current > 0) {
              const scale = currentDistance / lastPinchDistance.current;
              const newZoom = Math.max(
                minZoom,
                Math.min(maxZoom, zoomLevel * scale)
              );
              setZoomLevel(newZoom);
              zoomAnim.setValue(newZoom);
            }
            lastPinchDistance.current = currentDistance;
          }
          // Pan gesture
          else if (enablePan && zoomLevel > 1) {
            const newX = lastPanOffset.current.x + gestureState.dx;
            const newY = lastPanOffset.current.y + gestureState.dy;

            // Limit panning based on zoom level
            const maxPan = (zoomLevel - 1) * 100;
            const clampedX = Math.max(-maxPan, Math.min(maxPan, newX));
            const clampedY = Math.max(-maxPan, Math.min(maxPan, newY));

            setPanOffset({ x: clampedX, y: clampedY });
            panAnim.setValue({ x: clampedX, y: clampedY });
          }
        },
        onPanResponderRelease: () => {
          lastPinchDistance.current = null;
        },
      }),
    [enableZoom, enablePan, zoomLevel, panOffset, minZoom, maxZoom, zoomAnim, panAnim]
  );

  // Reset zoom
  const resetZoom = useCallback(() => {
    Animated.parallel([
      Animated.spring(zoomAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(panAnim, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }),
    ]).start();
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [zoomAnim, panAnim]);

  // Handle data point tap
  const handleDataPointPress = useCallback(
    (item: T, index: number, position: TooltipPosition) => {
      setTooltip({
        visible: true,
        item,
        index,
        position,
      });
      onDataPointPress?.(item, index);

      // Announce for accessibility
      if (isAccessibilityEnabled) {
        const announcement = `${item.label}: ${formatValueForAccessibility(item.value)}`;
        AccessibilityInfo.announceForAccessibility(announcement);
      }
    },
    [onDataPointPress, isAccessibilityEnabled, formatValueForAccessibility]
  );

  // Handle data point long press
  const handleDataPointLongPress = useCallback(
    (item: T, index: number) => {
      if (optionsMenuItems && optionsMenuItems.length > 0) {
        setOptionsMenu({
          visible: true,
          item,
          index,
        });
      }
      onDataPointLongPress?.(item, index);
    },
    [onDataPointLongPress, optionsMenuItems]
  );

  // Close tooltip
  const closeTooltip = useCallback(() => {
    setTooltip({
      visible: false,
      item: null,
      index: -1,
      position: { x: 0, y: 0 },
    });
  }, []);

  // Close options menu
  const closeOptionsMenu = useCallback(() => {
    setOptionsMenu({
      visible: false,
      item: null,
      index: -1,
    });
  }, []);

  // Generate accessibility description
  const chartAccessibilityDescription = useMemo(() => {
    if (!data.length) return 'Chart with no data';

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;

    return `Chart with ${data.length} data points. ` +
      `Range from ${formatValueForAccessibility(min)} to ${formatValueForAccessibility(max)}. ` +
      `Average: ${formatValueForAccessibility(avg)}.`;
  }, [data, formatValueForAccessibility]);

  // Render default tooltip
  const renderDefaultTooltip = ({ item, onClose }: TooltipRenderProps) => (
    <View style={styles.tooltipContent}>
      <View style={styles.tooltipHeader}>
        <Text style={styles.tooltipLabel}>{item.label}</Text>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close tooltip">
          <Text style={styles.tooltipClose}>×</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.tooltipValue}>{formatValueForAccessibility(item.value)}</Text>
      {item.secondaryValue !== undefined && (
        <Text style={styles.tooltipSecondary}>
          vs {formatValueForAccessibility(item.secondaryValue)}
        </Text>
      )}
    </View>
  );

  // Render accessible data table
  const renderAccessibleDataTable = () => {
    if (!showAccessibleDataTable || !isAccessibilityEnabled) return null;

    return (
      <View
        accessibilityRole="list"
        accessibilityLabel="Chart data table"
        style={styles.accessibleTable}
      >
        {data.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}: ${formatValueForAccessibility(item.value)}${
              item.secondaryValue !== undefined
                ? `, compared to ${formatValueForAccessibility(item.secondaryValue)}`
                : ''
            }`}
            accessibilityHint="Double tap to select"
            onPress={() =>
              handleDataPointPress(item as T, index, { x: 0, y: 0 })
            }
            style={styles.accessibleTableRow}
          >
            <Text style={styles.accessibleTableLabel}>{item.label}</Text>
            <Text style={styles.accessibleTableValue}>
              {formatValueForAccessibility(item.value)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container} ref={containerRef}>
      {/* Main chart area */}
      <View
        style={[styles.chartContainer, { height }]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || chartAccessibilityDescription}
        accessibilityHint={accessibilityHint}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.chartWrapper,
            {
              transform: [
                { scale: zoomAnim },
                { translateX: panAnim.x },
                { translateY: panAnim.y },
              ],
            },
          ]}
        >
          {renderChart({
            data,
            selectedIndex: tooltip.visible ? tooltip.index : null,
            zoomLevel,
            panOffset,
          })}
        </Animated.View>

        {/* Zoom reset button */}
        {zoomLevel > 1 && (
          <TouchableOpacity
            style={styles.zoomResetButton}
            onPress={resetZoom}
            accessibilityRole="button"
            accessibilityLabel="Reset zoom"
          >
            <Text style={styles.zoomResetText}>Reset</Text>
          </TouchableOpacity>
        )}

        {/* Zoom indicator */}
        {enableZoom && zoomLevel !== 1 && (
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomIndicatorText}>
              {(zoomLevel * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      {/* Accessible data table for screen readers */}
      {renderAccessibleDataTable()}

      {/* Tooltip Modal */}
      <Modal
        visible={tooltip.visible}
        transparent
        animationType="fade"
        onRequestClose={closeTooltip}
      >
        <Pressable style={styles.modalOverlay} onPress={closeTooltip}>
          <View
            style={[
              styles.tooltip,
              {
                top: Math.min(
                  tooltip.position.y + 10,
                  Dimensions.get('window').height - 150
                ),
                left: Math.min(
                  tooltip.position.x - 75,
                  Dimensions.get('window').width - 160
                ),
              },
            ]}
          >
            {tooltip.item &&
              (renderTooltip
                ? renderTooltip({
                    item: tooltip.item,
                    index: tooltip.index,
                    position: tooltip.position,
                    onClose: closeTooltip,
                  })
                : renderDefaultTooltip({
                    item: tooltip.item,
                    index: tooltip.index,
                    position: tooltip.position,
                    onClose: closeTooltip,
                  }))}
          </View>
        </Pressable>
      </Modal>

      {/* Options Menu Modal */}
      <Modal
        visible={optionsMenu.visible}
        transparent
        animationType="slide"
        onRequestClose={closeOptionsMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeOptionsMenu}>
          <View style={styles.optionsMenuContainer}>
            <View style={styles.optionsMenu}>
              {optionsMenu.item && (
                <View style={styles.optionsMenuHeader}>
                  <Text style={styles.optionsMenuTitle}>
                    {optionsMenu.item.label}
                  </Text>
                  <Text style={styles.optionsMenuSubtitle}>
                    {formatValueForAccessibility(optionsMenu.item.value)}
                  </Text>
                </View>
              )}

              <ScrollView style={styles.optionsMenuItems}>
                {optionsMenuItems?.map((menuItem) => (
                  <TouchableOpacity
                    key={menuItem.id}
                    style={styles.optionsMenuItem}
                    onPress={() => {
                      closeOptionsMenu();
                      menuItem.onPress();
                    }}
                    accessibilityRole="menuitem"
                    accessibilityLabel={menuItem.label}
                  >
                    {menuItem.icon && (
                      <Text style={styles.optionsMenuItemIcon}>
                        {menuItem.icon}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.optionsMenuItemLabel,
                        menuItem.destructive && styles.optionsMenuItemDestructive,
                      ]}
                    >
                      {menuItem.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.optionsMenuCancel}
                onPress={closeOptionsMenu}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.optionsMenuCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Hook to create interactive data points for charts
 */
export function useInteractiveDataPoints<T extends ChartDataPoint>(
  data: T[],
  onPress: (item: T, index: number, position: TooltipPosition) => void,
  onLongPress?: (item: T, index: number) => void
) {
  const createPressHandler = useCallback(
    (item: T, index: number) => {
      return {
        onPress: (event: any) => {
          const position = {
            x: event.nativeEvent?.pageX || 0,
            y: event.nativeEvent?.pageY || 0,
          };
          onPress(item, index, position);
        },
        onLongPress: () => {
          onLongPress?.(item, index);
        },
      };
    },
    [onPress, onLongPress]
  );

  return {
    createPressHandler,
  };
}

/**
 * Pre-built chart option menus
 */
export const chartOptionMenus = {
  viewDetails: (onPress: () => void): OptionsMenuItem => ({
    id: 'view-details',
    label: 'View Details',
    icon: '🔍',
    onPress,
  }),
  exportData: (onPress: () => void): OptionsMenuItem => ({
    id: 'export',
    label: 'Export Data',
    icon: '📤',
    onPress,
  }),
  shareChart: (onPress: () => void): OptionsMenuItem => ({
    id: 'share',
    label: 'Share',
    icon: '📱',
    onPress,
  }),
  filterByThis: (onPress: () => void): OptionsMenuItem => ({
    id: 'filter',
    label: 'Filter by This',
    icon: '🔎',
    onPress,
  }),
  hideFromChart: (onPress: () => void): OptionsMenuItem => ({
    id: 'hide',
    label: 'Hide from Chart',
    icon: '👁️',
    onPress,
    destructive: true,
  }),
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  chartWrapper: {
    flex: 1,
  },
  zoomResetButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  zoomResetText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  zoomIndicatorText: {
    color: 'white',
    fontSize: 10,
  },
  accessibleTable: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  accessibleTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accessibleTableLabel: {
    fontSize: 14,
    color: '#333',
  },
  accessibleTableValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipContent: {},
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tooltipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  tooltipClose: {
    fontSize: 24,
    color: '#999',
    paddingLeft: 8,
  },
  tooltipValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  tooltipSecondary: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  optionsMenuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  optionsMenu: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '60%',
  },
  optionsMenuHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  optionsMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  optionsMenuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  optionsMenuItems: {
    maxHeight: 300,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionsMenuItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionsMenuItemLabel: {
    fontSize: 16,
    color: '#333',
  },
  optionsMenuItemDestructive: {
    color: '#ff3b30',
  },
  optionsMenuCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  optionsMenuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default InteractiveChart;
