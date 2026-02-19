/**
 * PermissionEditor - Shared Component
 * Visual editor for role permissions management
 *
 * Features:
 * - Grouped permissions display (by category or module)
 * - Toggle switches for each permission
 * - Select all/none per group
 * - Permission description tooltips
 * - Visual hierarchy (category → module → permissions)
 * - Read-only mode
 * - Dirty state indicator
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Switch, Button, Chip, Divider, List } from 'react-native-paper';
import type { PermissionEditorProps, Permission, PermissionGroup } from '../types';
import { COLORS } from '../../../theme/colors';

export const PermissionEditor: React.FC<PermissionEditorProps> = ({
  roleId,
  permissions,
  onPermissionChange,
  readOnly = false,
  groupBy = 'category',
  showDescription = false,
}) => {
  const [localPermissions, setLocalPermissions] = useState<Permission[]>(permissions);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLocalPermissions(permissions);
    setIsDirty(false);
  }, [permissions]);

  // Group permissions by category or module
  const groupedPermissions = useMemo((): PermissionGroup[] => {
    const groups = new Map<string, Permission[]>();

    localPermissions.forEach((permission) => {
      const key = groupBy === 'category' ? permission.category : permission.module;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(permission);
    });

    return Array.from(groups.entries()).map(([name, perms]) => ({
      name,
      permissions: perms,
      enabledCount: perms.filter((p) => p.enabled).length,
      totalCount: perms.length,
    }));
  }, [localPermissions, groupBy]);

  // Toggle group expansion
  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // Toggle single permission
  const togglePermission = (permissionId: string) => {
    if (readOnly) return;

    const updated = localPermissions.map((p) =>
      p.id === permissionId ? { ...p, enabled: !p.enabled } : p
    );
    setLocalPermissions(updated);
    setIsDirty(true);
    onPermissionChange(updated);
  };

  // Toggle all permissions in a group
  const toggleGroupAll = (groupName: string, enabled: boolean) => {
    if (readOnly) return;

    const updated = localPermissions.map((p) => {
      const key = groupBy === 'category' ? p.category : p.module;
      return key === groupName ? { ...p, enabled } : p;
    });
    setLocalPermissions(updated);
    setIsDirty(true);
    onPermissionChange(updated);
  };

  // Get action icon and color
  const getActionStyle = (action: string) => {
    const styles: Record<string, { icon: string; color: string }> = {
      create: { icon: 'plus', color: COLORS.SUCCESS },
      read: { icon: 'eye', color: COLORS.INFO },
      update: { icon: 'pencil', color: COLORS.WARNING },
      delete: { icon: 'delete', color: '#f44336' },
      execute: { icon: 'play', color: COLORS.STATUS_EVALUATED },
    };
    return styles[action] || { icon: 'help', color: COLORS.DISABLED };
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      admin: COLORS.ERROR,
      manager: COLORS.INFO,
      logistics: COLORS.WARNING,
      commercial: COLORS.SUCCESS,
      planning: COLORS.STATUS_EVALUATED,
      design: '#00BCD4',
    };
    return colors[category] || COLORS.DISABLED;
  };

  // Render permission item
  const renderPermissionItem = (permission: Permission) => {
    const actionStyle = getActionStyle(permission.action);

    return (
      <View key={permission.id} style={styles.permissionItem}>
        <View style={styles.permissionInfo}>
          <View style={styles.permissionHeader}>
            <Chip
              mode="flat"
              icon={actionStyle.icon}
              style={[styles.actionChip, { backgroundColor: actionStyle.color + '20' }]}
              textStyle={[styles.actionText, { color: actionStyle.color }]}
              compact
            >
              {permission.action.toUpperCase()}
            </Chip>
            <Text style={styles.permissionName}>{permission.name}</Text>
          </View>
          {showDescription && permission.description && (
            <Text style={styles.permissionDescription}>{permission.description}</Text>
          )}
        </View>
        <Switch
          value={permission.enabled}
          onValueChange={() => togglePermission(permission.id)}
          disabled={readOnly}
        />
      </View>
    );
  };

  // Render permission group
  const renderGroup = (group: PermissionGroup) => {
    const isExpanded = expandedGroups.has(group.name);
    const allEnabled = group.enabledCount === group.totalCount;
    const someEnabled = group.enabledCount > 0 && group.enabledCount < group.totalCount;
    const categoryColor = groupBy === 'category' ? getCategoryColor(group.name) : COLORS.INFO;

    return (
      <Card key={group.name} style={styles.groupCard}>
        <List.Accordion
          title={group.name.toUpperCase()}
          expanded={isExpanded}
          onPress={() => toggleGroup(group.name)}
          left={(props) => (
            <View style={[styles.groupIndicator, { backgroundColor: categoryColor }]} />
          )}
          right={(props) => (
            <View style={styles.groupStats}>
              <Text style={styles.statsText}>
                {group.enabledCount}/{group.totalCount}
              </Text>
            </View>
          )}
          style={styles.groupHeader}
          titleStyle={styles.groupTitle}
        >
          {/* Group Actions */}
          {!readOnly && (
            <View style={styles.groupActions}>
              <Button
                mode="text"
                onPress={() => toggleGroupAll(group.name, true)}
                compact
                disabled={allEnabled}
              >
                Select All
              </Button>
              <Button
                mode="text"
                onPress={() => toggleGroupAll(group.name, false)}
                compact
                disabled={group.enabledCount === 0}
              >
                Clear All
              </Button>
            </View>
          )}

          {/* Permissions List */}
          <View style={styles.permissionsList}>
            {group.permissions.map((permission) => renderPermissionItem(permission))}
          </View>
        </List.Accordion>
      </Card>
    );
  };

  // Calculate summary stats
  const totalEnabled = localPermissions.filter((p) => p.enabled).length;
  const totalPermissions = localPermissions.length;

  return (
    <View style={styles.container}>
      {/* Header with summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Permissions Editor</Text>
              <Text style={styles.summarySubtitle}>Role ID: {roleId}</Text>
            </View>
            <View style={styles.summaryStats}>
              <Text style={styles.summaryCount}>{totalEnabled}</Text>
              <Text style={styles.summaryLabel}>/ {totalPermissions} enabled</Text>
            </View>
          </View>

          {/* Dirty state indicator */}
          {isDirty && (
            <View style={styles.dirtyIndicator}>
              <Text style={styles.dirtyText}>● Unsaved changes</Text>
            </View>
          )}

          {/* Read-only indicator */}
          {readOnly && (
            <Chip
              mode="flat"
              style={styles.readOnlyChip}
              textStyle={styles.readOnlyText}
              icon="lock"
              compact
            >
              READ ONLY
            </Chip>
          )}
        </Card.Content>
      </Card>

      {/* Groups List */}
      <ScrollView style={styles.groupsList}>
        {groupedPermissions.map((group) => renderGroup(group))}
      </ScrollView>

      {/* Expand/Collapse All */}
      <View style={styles.footerActions}>
        <Button
          mode="outlined"
          onPress={() => setExpandedGroups(new Set(groupedPermissions.map((g) => g.name)))}
          compact
        >
          Expand All
        </Button>
        <Button
          mode="outlined"
          onPress={() => setExpandedGroups(new Set())}
          compact
        >
          Collapse All
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Summary Card
  summaryCard: {
    margin: 15,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  summaryStats: {
    alignItems: 'flex-end',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.INFO,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  dirtyIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dirtyText: {
    fontSize: 12,
    color: COLORS.WARNING,
    fontWeight: '600',
  },
  readOnlyChip: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#9E9E9E20',
  },
  readOnlyText: {
    color: COLORS.DISABLED,
    fontSize: 11,
    fontWeight: '600',
  },

  // Groups List
  groupsList: {
    flex: 1,
  },
  groupCard: {
    marginHorizontal: 15,
    marginBottom: 12,
    elevation: 1,
  },
  groupHeader: {
    backgroundColor: '#f5f5f5',
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupIndicator: {
    width: 4,
    height: '100%',
    marginRight: 8,
  },
  groupStats: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  // Group Actions
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
  },

  // Permissions List
  permissionsList: {
    padding: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionChip: {
    marginRight: 8,
  },
  actionText: {
    fontSize: 9,
    fontWeight: '600',
  },
  permissionName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  permissionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 48,
  },

  // Footer Actions
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
