/**
 * WBSTreeView - Hierarchical WBS tree visualization component
 *
 * A reusable component for displaying Work Breakdown Structure (WBS) in a tree format
 * with expand/collapse functionality, progress indicators, and item counts.
 *
 * @example
 * ```tsx
 * <WBSTreeView
 *   wbsTree={state.data.wbsTree}
 *   expandedNodes={state.ui.expandedNodes}
 *   selectedNode={state.ui.selectedNode}
 *   onToggleNode={handleToggleNode}
 *   onSelectNode={handleSelectNode}
 *   onNodePress={handleNodePress}
 *   showItemCount
 *   showProgress
 *   highlightCriticalPath
 * />
 * ```
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, IconButton, ProgressBar, Surface, Chip } from 'react-native-paper';
import { WBSTreeViewProps, WBSTreeNode } from '../types';

const INDENT_SIZE = 20; // pixels per level
const NODE_HEIGHT = 70; // height of each tree node
const CRITICAL_PATH_COLOR = '#d32f2f';
const PROGRESS_COLOR = '#4CAF50';

/**
 * Flatten tree structure for FlatList rendering
 */
const flattenTree = (
  nodes: WBSTreeNode[],
  expandedNodes: Set<string>,
  parentExpanded = true
): Array<WBSTreeNode & { isExpanded: boolean; isVisible: boolean }> => {
  const flattened: Array<WBSTreeNode & { isExpanded: boolean; isVisible: boolean }> = [];

  for (const node of nodes) {
    const isExpanded = expandedNodes.has(node.id);
    const isVisible = parentExpanded;

    flattened.push({
      ...node,
      isExpanded,
      isVisible,
    });

    if (node.children.length > 0) {
      const childrenFlattened = flattenTree(node.children, expandedNodes, isExpanded && isVisible);
      flattened.push(...childrenFlattened);
    }
  }

  return flattened;
};

/**
 * Individual tree node component
 */
interface TreeNodeProps {
  node: WBSTreeNode;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onPress?: (node: WBSTreeNode) => void;
  onLongPress?: (node: WBSTreeNode) => void;
  showItemCount: boolean;
  showProgress: boolean;
  highlightCriticalPath: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onPress,
  onLongPress,
  showItemCount,
  showProgress,
  highlightCriticalPath,
}) => {
  const hasChildren = node.children.length > 0;
  const indentLevel = node.level;
  const isCritical = highlightCriticalPath && node.isCriticalPath;

  const handlePress = () => {
    onSelect(node.id);
    if (onPress) {
      onPress(node);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(node);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[
        styles.nodeContainer,
        { paddingLeft: indentLevel * INDENT_SIZE },
        isSelected && styles.selectedNode,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.nodeContent}>
        {/* Expand/Collapse Button */}
        <View style={styles.expandButton}>
          {hasChildren ? (
            <IconButton
              icon={isExpanded ? 'chevron-down' : 'chevron-right'}
              size={20}
              onPress={() => onToggle(node.id)}
              style={styles.chevronButton}
            />
          ) : (
            <View style={styles.chevronPlaceholder} />
          )}
        </View>

        {/* Node Info */}
        <View style={styles.nodeInfo}>
          <View style={styles.nodeHeader}>
            <Text
              variant="labelSmall"
              style={[styles.wbsCode, isCritical && styles.criticalText]}
            >
              {node.wbsCode}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.nodeName, isCritical && styles.criticalText]}
              numberOfLines={1}
            >
              {node.name}
            </Text>
          </View>

          {/* Item Count & Progress */}
          <View style={styles.nodeDetails}>
            {showItemCount && (
              <Chip mode="outlined" style={styles.itemCountChip} compact>
                {node.itemCount} {node.itemCount === 1 ? 'item' : 'items'}
              </Chip>
            )}

            {showProgress && (
              <View style={styles.progressContainer}>
                <Text variant="labelSmall" style={styles.progressLabel}>
                  {node.completedCount}/{node.itemCount}
                </Text>
                <ProgressBar
                  progress={node.progress / 100}
                  color={PROGRESS_COLOR}
                  style={styles.progressBar}
                />
                <Text variant="labelSmall" style={styles.progressPercentage}>
                  {Math.round(node.progress)}%
                </Text>
              </View>
            )}

            {isCritical && (
              <Chip
                mode="flat"
                style={styles.criticalChip}
                textStyle={styles.criticalChipText}
                icon="alert-circle"
                compact
              >
                Critical
              </Chip>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Main WBSTreeView component
 */
export const WBSTreeView: React.FC<WBSTreeViewProps> = ({
  wbsTree,
  expandedNodes,
  selectedNode,
  onToggleNode,
  onSelectNode,
  onNodePress,
  onNodeLongPress,
  showItemCount = true,
  showProgress = true,
  highlightCriticalPath = true,
  style,
}) => {
  // Flatten tree for rendering
  const flatData = React.useMemo(() => {
    return flattenTree(wbsTree, expandedNodes);
  }, [wbsTree, expandedNodes]);

  // Filter visible nodes
  const visibleData = React.useMemo(() => {
    return flatData.filter(node => node.isVisible);
  }, [flatData]);

  const renderItem = ({ item }: { item: WBSTreeNode & { isExpanded: boolean } }) => {
    return (
      <TreeNode
        node={item}
        isExpanded={item.isExpanded}
        isSelected={selectedNode === item.id}
        onToggle={onToggleNode}
        onSelect={onSelectNode}
        onPress={onNodePress}
        onLongPress={onNodeLongPress}
        showItemCount={showItemCount}
        showProgress={showProgress}
        highlightCriticalPath={highlightCriticalPath}
      />
    );
  };

  const keyExtractor = (item: WBSTreeNode) => item.id;

  return (
    <Surface style={[styles.container, style]}>
      {visibleData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            No WBS items to display
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={(data, index) => ({
            length: NODE_HEIGHT,
            offset: NODE_HEIGHT * index,
            index,
          })}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    elevation: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  nodeContainer: {
    height: NODE_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  selectedNode: {
    backgroundColor: '#E3F2FD',
  },
  nodeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronButton: {
    margin: 0,
  },
  chevronPlaceholder: {
    width: 40,
  },
  nodeInfo: {
    flex: 1,
    paddingRight: 12,
  },
  nodeHeader: {
    marginBottom: 4,
  },
  wbsCode: {
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  nodeName: {
    fontWeight: '500',
  },
  criticalText: {
    color: CRITICAL_PATH_COLOR,
    fontWeight: 'bold',
  },
  nodeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemCountChip: {
    height: 24,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 120,
  },
  progressLabel: {
    color: '#666',
    minWidth: 35,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressPercentage: {
    color: '#666',
    minWidth: 35,
    textAlign: 'right',
  },
  criticalChip: {
    height: 24,
    backgroundColor: CRITICAL_PATH_COLOR,
  },
  criticalChipText: {
    color: '#FFF',
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#999',
  },
});
