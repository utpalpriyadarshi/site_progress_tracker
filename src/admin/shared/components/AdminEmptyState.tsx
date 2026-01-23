import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

/**
 * AdminEmptyState Component
 *
 * Contextual empty state component for Admin screens with:
 * - Icon/illustration
 * - Title and message
 * - Helpful tips
 * - Primary and secondary actions
 * - Accessibility support
 */

export interface AdminEmptyStateProps {
  /** Icon or emoji to display */
  icon?: string;
  /** Main title */
  title: string;
  /** Descriptive message */
  message?: string;
  /** Helpful tips list */
  tips?: string[];
  /** Primary action button text */
  actionText?: string;
  /** Primary action handler */
  onAction?: () => void;
  /** Secondary action button text */
  secondaryActionText?: string;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Style variant */
  variant?: 'default' | 'compact' | 'large';
  /** Container style override */
  style?: ViewStyle;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon = '📋',
  title,
  message,
  tips,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  variant = 'default',
  style,
}) => {
  const isCompact = variant === 'compact';
  const isLarge = variant === 'large';

  const accessibilityLabel = [
    title,
    message,
    tips ? `Tips: ${tips.join('. ')}` : '',
    actionText ? `Action available: ${actionText}` : '',
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View
      style={[
        styles.container,
        isCompact && styles.containerCompact,
        isLarge && styles.containerLarge,
        style,
      ]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Icon */}
      <Text
        style={[
          styles.icon,
          isCompact && styles.iconCompact,
          isLarge && styles.iconLarge,
        ]}
        accessibilityElementsHidden
      >
        {icon}
      </Text>

      {/* Title */}
      <Text
        style={[
          styles.title,
          isCompact && styles.titleCompact,
          isLarge && styles.titleLarge,
        ]}
      >
        {title}
      </Text>

      {/* Message */}
      {message && (
        <Text
          style={[
            styles.message,
            isCompact && styles.messageCompact,
          ]}
        >
          {message}
        </Text>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && !isCompact && (
        <View
          style={styles.tipsContainer}
          accessible={true}
          accessibilityLabel={`${tips.length} helpful tips`}
        >
          {tips.map((tip, index) => (
            <View
              key={index}
              style={styles.tipRow}
            >
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      {(actionText || secondaryActionText) && (
        <View style={styles.actionsContainer}>
          {actionText && onAction && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={actionText}
              accessibilityHint="Tap to perform this action"
            >
              <Text style={styles.primaryButtonText}>{actionText}</Text>
            </TouchableOpacity>
          )}

          {secondaryActionText && onSecondaryAction && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSecondaryAction}
              accessibilityRole="button"
              accessibilityLabel={secondaryActionText}
            >
              <Text style={styles.secondaryButtonText}>{secondaryActionText}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * NoUsersEmptyState - Empty state for Role Management screen
 */
export interface NoUsersEmptyStateProps {
  onAddUser?: () => void;
  searchQuery?: string;
}

export const NoUsersEmptyState: React.FC<NoUsersEmptyStateProps> = ({
  onAddUser,
  searchQuery,
}) => {
  if (searchQuery) {
    return (
      <AdminEmptyState
        icon="🔍"
        title="No users found"
        message={`No users match "${searchQuery}"`}
        tips={[
          'Check the spelling of your search',
          'Try searching by username or full name',
          'Remove filters to see all users',
        ]}
        variant="compact"
      />
    );
  }

  return (
    <AdminEmptyState
      icon="👥"
      title="No Users Yet"
      message="Start by adding users to the system. Each user can be assigned a role and project."
      tips={[
        'Add users with the + button below',
        'Assign roles like Manager, Supervisor, or Commercial',
        'Link users to specific projects',
        'Reset passwords if users forget them',
      ]}
      actionText="Add First User"
      onAction={onAddUser}
    />
  );
};

/**
 * NoProjectsEmptyState - Empty state for Project Management screen
 */
export interface NoProjectsEmptyStateProps {
  onAddProject?: () => void;
  searchQuery?: string;
}

export const NoProjectsEmptyState: React.FC<NoProjectsEmptyStateProps> = ({
  onAddProject,
  searchQuery,
}) => {
  if (searchQuery) {
    return (
      <AdminEmptyState
        icon="🔍"
        title="No projects found"
        message={`No projects match "${searchQuery}"`}
        tips={[
          'Check the spelling of your search',
          'Try searching by project name or code',
          'Clear the search to see all projects',
        ]}
        variant="compact"
      />
    );
  }

  return (
    <AdminEmptyState
      icon="📁"
      title="No Projects Yet"
      message="Create your first project to start tracking construction progress across sites."
      tips={[
        'Create a project with the + button',
        'Set start and end dates for timeline tracking',
        'Add sites to projects later',
        'Assign users to work on specific projects',
      ]}
      actionText="Create First Project"
      onAction={onAddProject}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  containerCompact: {
    padding: 24,
  },
  containerLarge: {
    padding: 48,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  iconCompact: {
    fontSize: 32,
    marginBottom: 12,
  },
  iconLarge: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 16,
  },
  titleLarge: {
    fontSize: 22,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  messageCompact: {
    fontSize: 13,
  },
  tipsContainer: {
    marginTop: 20,
    alignSelf: 'stretch',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
    lineHeight: 18,
  },
  actionsContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
