/**
 * Shared WBS Tree-related types for Planning components
 */

import { ViewStyle } from 'react-native';

/**
 * WBS Tree Node structure
 */
export interface WBSTreeNode {
  id: string;
  wbsCode: string;
  name: string;
  level: number;
  parentId: string | null;
  children: WBSTreeNode[];
  itemCount: number;
  completedCount: number;
  progress: number;
  isCriticalPath: boolean;
}

/**
 * Props for WBSTreeView component
 */
export interface WBSTreeViewProps {
  wbsTree: WBSTreeNode[];
  expandedNodes: Set<string>;
  selectedNode: string | null;
  onToggleNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onNodePress?: (node: WBSTreeNode) => void;
  onNodeLongPress?: (node: WBSTreeNode) => void;
  showItemCount?: boolean;
  showProgress?: boolean;
  highlightCriticalPath?: boolean;
  style?: ViewStyle;
}
