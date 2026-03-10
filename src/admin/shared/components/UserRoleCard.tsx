/**
 * UserRoleCard - Shared Component
 * Reusable user card with role badge, status, and configurable actions
 *
 * Features:
 * - User avatar with initials
 * - Role badge with color coding
 * - Status indicator (active/inactive)
 * - Project assignment display
 * - Contact information (email, phone)
 * - Action buttons (Edit, Delete, Reset Password, Toggle Status)
 * - Multiple variants (default, compact, detailed)
 * - Last updated timestamp
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Chip, Button, Avatar, IconButton } from 'react-native-paper';
import type { UserRoleCardProps } from '../types';
import { COLORS } from '../../../theme/colors';

export const UserRoleCard: React.FC<UserRoleCardProps> = ({
  user,
  role,
  project,
  onPress,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
  showActions = true,
  variant = 'default',
}) => {
  // Get user initials
  const getInitials = () => {
    const names = user.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  };

  // Get role badge color
  const getRoleColor = () => {
    if (!role) return COLORS.DISABLED;

    const roleColors: Record<string, string> = {
      admin: COLORS.ERROR,
      manager: COLORS.INFO,
      logistics: COLORS.WARNING,
      commercial: COLORS.SUCCESS,
      planner: COLORS.STATUS_EVALUATED,
      designer: '#00BCD4',
      supervisor: '#795548',
    };

    return roleColors[role.name.toLowerCase()] || COLORS.DISABLED;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return formatDate(timestamp);
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <Card mode="elevated" style={styles.card} onPress={onPress ? () => onPress(user) : undefined}>
        <Card.Content>
          <View style={styles.compactContainer}>
            <Avatar.Text
              size={36}
              label={getInitials()}
              style={[styles.avatar, { backgroundColor: getRoleColor() }]}
            />
            <View style={styles.compactInfo}>
              <View style={styles.compactHeader}>
                <Text style={styles.username}>{user.username}</Text>
                {user.isActive && (
                  <View style={[styles.statusDot, styles.activeDot]} />
                )}
              </View>
              <Text style={styles.fullNameCompact} numberOfLines={1}>
                {user.fullName}
              </Text>
            </View>
            {role && (
              <Chip
                mode="flat"
                style={[styles.roleChip, { backgroundColor: getRoleColor() + '20' }]}
                textStyle={[styles.roleText, { color: getRoleColor() }]}
                compact
              >
                {role.name}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  }

  // Render detailed variant
  if (variant === 'detailed') {
    return (
      <Card mode="elevated" style={styles.card} onPress={onPress ? () => onPress(user) : undefined}>
        <Card.Content>
          {/* Header with avatar and basic info */}
          <View style={styles.detailedHeader}>
            <Avatar.Text
              size={56}
              label={getInitials()}
              style={[styles.avatar, { backgroundColor: getRoleColor() }]}
            />
            <View style={styles.detailedInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.fullName}>{user.fullName}</Text>
                {user.isActive ? (
                  <Chip
                    mode="flat"
                    style={styles.activeChip}
                    textStyle={styles.activeText}
                    compact
                  >
                    ACTIVE
                  </Chip>
                ) : (
                  <Chip
                    mode="flat"
                    style={styles.inactiveChip}
                    textStyle={styles.inactiveText}
                    compact
                  >
                    INACTIVE
                  </Chip>
                )}
              </View>
              <Text style={styles.usernameDetailed}>@{user.username}</Text>
              {role && (
                <Chip
                  mode="flat"
                  style={[styles.roleChipDetailed, { backgroundColor: getRoleColor() + '20' }]}
                  textStyle={[styles.roleText, { color: getRoleColor() }]}
                  compact
                >
                  {role.name}
                </Chip>
              )}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <View style={styles.contactRow}>
              <IconButton icon="email" size={16} style={styles.contactIcon} />
              <Text style={styles.contactText}>{user.email || 'No email'}</Text>
            </View>
            <View style={styles.contactRow}>
              <IconButton icon="phone" size={16} style={styles.contactIcon} />
              <Text style={styles.contactText}>{user.phone || 'No phone'}</Text>
            </View>
          </View>

          {/* Project Assignment */}
          {project && (
            <View style={styles.projectSection}>
              <Text style={styles.sectionLabel}>Project Assignment</Text>
              <Text style={styles.projectName}>{project.name}</Text>
            </View>
          )}

          {/* User ID */}
          <View style={styles.metadataSection}>
            <Text style={styles.metadataText}>User ID: {user.id}</Text>
          </View>

          {/* Action Buttons */}
          {showActions && (
            <View style={styles.actionsContainer}>
              {onEdit && (
                <Button
                  mode="contained"
                  onPress={() => onEdit(user)}
                  style={styles.actionButton}
                  compact
                >
                  Edit
                </Button>
              )}
              {onToggleStatus && (
                <Button
                  mode="outlined"
                  onPress={() => onToggleStatus(user)}
                  style={styles.actionButton}
                  compact
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              {onResetPassword && (
                <Button
                  mode="outlined"
                  onPress={() => onResetPassword(user)}
                  style={styles.actionButton}
                  compact
                >
                  Reset Password
                </Button>
              )}
              {onDelete && (
                <Button
                  mode="outlined"
                  onPress={() => onDelete(user)}
                  style={styles.actionButton}
                  textColor="#f44336"
                  compact
                >
                  Delete
                </Button>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  }

  // Render default variant
  return (
    <Card mode="elevated" style={styles.card} onPress={onPress ? () => onPress(user) : undefined}>
      <Card.Content>
        <View style={styles.defaultHeader}>
          <Avatar.Text
            size={48}
            label={getInitials()}
            style={[styles.avatar, { backgroundColor: getRoleColor() }]}
          />
          <View style={styles.defaultInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.fullName}>{user.fullName}</Text>
              {user.isActive && (
                <View style={[styles.statusDot, styles.activeDot]} />
              )}
            </View>
            <Text style={styles.username}>@{user.username}</Text>
            {role && (
              <Chip
                mode="flat"
                style={[styles.roleChip, { backgroundColor: getRoleColor() + '20' }]}
                textStyle={[styles.roleText, { color: getRoleColor() }]}
                compact
              >
                {role.name}
              </Chip>
            )}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.defaultContact}>
          <Text style={styles.contactTextDefault}>{user.email || 'No email'}</Text>
          {project && (
            <Text style={styles.projectNameDefault} numberOfLines={1}>
              Project: {project.name}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionsContainerDefault}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => onEdit(user)}
              />
            )}
            {onToggleStatus && (
              <IconButton
                icon={user.isActive ? 'cancel' : 'check-circle'}
                size={20}
                onPress={() => onToggleStatus(user)}
              />
            )}
            {onResetPassword && (
              <IconButton
                icon="lock-reset"
                size={20}
                onPress={() => onResetPassword(user)}
              />
            )}
            {onDelete && (
              <IconButton
                icon="delete"
                size={20}
                iconColor="#f44336"
                onPress={() => onDelete(user)}
              />
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 15,
    marginVertical: 8,
    elevation: 2,
  },
  avatar: {
    marginRight: 12,
  },

  // Compact variant styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  fullNameCompact: {
    fontSize: 12,
    color: '#666',
  },

  // Default variant styles
  defaultHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  defaultInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  defaultContact: {
    marginBottom: 8,
  },
  contactTextDefault: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  projectNameDefault: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  actionsContainerDefault: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },

  // Detailed variant styles
  detailedHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailedInfo: {
    flex: 1,
  },
  usernameDetailed: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  contactSection: {
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactIcon: {
    margin: 0,
    marginRight: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#666',
  },
  projectSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  metadataSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  metadataText: {
    fontSize: 11,
    color: '#999',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    marginRight: 8,
  },

  // Status indicators
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: COLORS.SUCCESS,
  },

  // Chips
  roleChip: {
    alignSelf: 'flex-start',
  },
  roleChipDetailed: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeChip: {
    backgroundColor: COLORS.SUCCESS,
  },
  activeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveChip: {
    backgroundColor: COLORS.DISABLED,
  },
  inactiveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
