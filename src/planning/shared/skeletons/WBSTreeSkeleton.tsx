/**
 * WBSTreeSkeleton - Loading skeleton for WBSTreeView component
 *
 * Provides a loading placeholder that matches the hierarchical WBS tree layout
 * with proper indentation for different levels.
 *
 * @example
 * ```tsx
 * {loading ? (
 *   <WBSTreeSkeleton nodeCount={8} />
 * ) : (
 *   <WBSTreeView {...props} />
 * )}
 * ```
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons/Skeleton';

/**
 * WBSTreeSkeleton Props
 */
export interface WBSTreeSkeletonProps {
  /**
   * Number of tree nodes to display
   * @default 8
   */
  nodeCount?: number;

  /**
   * Whether to show the header section
   * @default true
   */
  showHeader?: boolean;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * Individual tree node skeleton with level-based indentation
 */
interface TreeNodeSkeletonProps {
  level: number;
  hasChildren: boolean;
}

const TreeNodeSkeleton: React.FC<TreeNodeSkeletonProps> = ({ level, hasChildren }) => {
  const indentSize = 20;
  const paddingLeft = level * indentSize;

  return (
    <View style={[styles.node, { paddingLeft }]}>
      {/* Expand/Collapse button placeholder */}
      <View style={styles.expandButton}>
        {hasChildren && (
          <Skeleton width={24} height={24} borderRadius={12} marginBottom={0} />
        )}
      </View>

      {/* Node content */}
      <View style={styles.nodeContent}>
        {/* WBS Code and Name */}
        <View style={styles.nodeHeader}>
          <Skeleton width="20%" height={12} marginBottom={4} />
          <Skeleton width="70%" height={16} marginBottom={0} />
        </View>

        {/* Details: Item count, Progress */}
        <View style={styles.nodeDetails}>
          <Skeleton width={60} height={24} borderRadius={12} marginBottom={0} />
          <View style={styles.progressContainer}>
            <Skeleton width={30} height={10} marginBottom={0} />
            <Skeleton width={80} height={6} borderRadius={3} marginBottom={0} />
            <Skeleton width={30} height={10} marginBottom={0} />
          </View>
        </View>
      </View>
    </View>
  );
};

/**
 * WBSTreeSkeleton Component
 */
export const WBSTreeSkeleton: React.FC<WBSTreeSkeletonProps> = ({
  nodeCount = 8,
  showHeader = true,
  style,
}) => {
  // Define node structure with levels
  // Level 0: 2 nodes, Level 1: 3 nodes, Level 2: 3 nodes
  const nodeStructure = [
    { level: 0, hasChildren: true },   // Root node 1
    { level: 1, hasChildren: true },   // Child of root 1
    { level: 2, hasChildren: false },  // Child of level 1
    { level: 2, hasChildren: false },  // Child of level 1
    { level: 0, hasChildren: true },   // Root node 2
    { level: 1, hasChildren: false },  // Child of root 2
    { level: 1, hasChildren: true },   // Child of root 2
    { level: 2, hasChildren: false },  // Child of level 1
  ];

  const nodesToDisplay = nodeStructure.slice(0, nodeCount);

  return (
    <View style={[styles.container, style]}>
      {/* Header Section */}
      {showHeader && (
        <View style={styles.header}>
          <Skeleton width="50%" height={24} marginBottom={12} />
          <View style={styles.viewModeToggle}>
            <Skeleton width={80} height={32} borderRadius={4} marginBottom={0} />
            <Skeleton width={80} height={32} borderRadius={4} marginBottom={0} />
          </View>
        </View>
      )}

      {/* Tree Nodes */}
      <View style={styles.treeContainer}>
        {nodesToDisplay.map((node, index) => (
          <TreeNodeSkeleton
            key={index}
            level={node.level}
            hasChildren={node.hasChildren}
          />
        ))}
      </View>
    </View>
  );
};

const NODE_HEIGHT = 70;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  treeContainer: {
    flex: 1,
  },
  node: {
    height: NODE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  expandButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeContent: {
    flex: 1,
    paddingRight: 12,
  },
  nodeHeader: {
    marginBottom: 6,
  },
  nodeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 120,
  },
});
