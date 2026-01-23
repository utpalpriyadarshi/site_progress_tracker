import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import UserModel from '../../../../models/UserModel';
import RoleModel from '../../../../models/RoleModel';
import { RoleChip } from './RoleChip';
import { StatusChip } from './StatusChip';
import { getRoleName, getRoleColor, getProjectName, roleRequiresProject } from '../utils';

interface UserCardProps {
  user: UserModel;
  roles: RoleModel[];
  projects: any[];
  onEdit: (user: UserModel) => void;
  onDelete: (user: UserModel) => void;
  onToggleStatus: (user: UserModel) => void;
  onResetPassword: (user: UserModel) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  roles,
  projects,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
}) => {
  const roleName = getRoleName(user.roleId, roles);
  const roleColor = getRoleColor(roleName);
  const projectName = getProjectName(user.projectId || '', projects);
  const showProject = roleRequiresProject(roleName);

  return (
    <Card
      style={styles.card}
      accessible={true}
      accessibilityLabel={`User card for ${user.fullName}, ${roleName}, ${user.isActive ? 'active' : 'inactive'}`}
      accessibilityRole="button"
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Title style={styles.userName}>{user.fullName}</Title>
            <Paragraph style={styles.username}>@{user.username}</Paragraph>
          </View>
          <RoleChip roleId={user.roleId} roleName={roleName} roleColor={roleColor} />
        </View>

        {user.email && <Paragraph style={styles.detail}>Email: {user.email}</Paragraph>}
        {user.phone && <Paragraph style={styles.detail}>Phone: {user.phone}</Paragraph>}

        {showProject && (
          <Paragraph style={styles.detail}>📁 Project: {projectName}</Paragraph>
        )}

        <View style={styles.statusContainer}>
          <StatusChip isActive={user.isActive} />
        </View>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <View style={styles.buttonRow}>
          <Button
            onPress={() => onToggleStatus(user)}
            style={styles.actionButton}
            accessibilityLabel={user.isActive ? `Deactivate ${user.fullName}` : `Activate ${user.fullName}`}
            accessibilityHint={user.isActive ? 'Deactivates this user account' : 'Activates this user account'}
            accessibilityRole="button"
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            onPress={() => onEdit(user)}
            style={styles.actionButton}
            accessibilityLabel={`Edit ${user.fullName}`}
            accessibilityHint="Opens form to edit user details"
            accessibilityRole="button"
          >
            Edit
          </Button>
        </View>
        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={() => onResetPassword(user)}
            icon="lock-reset"
            style={styles.actionButton}
            accessibilityLabel={`Reset password for ${user.fullName}`}
            accessibilityHint="Opens dialog to set a new password"
            accessibilityRole="button"
          >
            Reset Password
          </Button>
          <Button
            textColor="#F44336"
            onPress={() => onDelete(user)}
            style={styles.actionButton}
            accessibilityLabel={`Delete ${user.fullName}`}
            accessibilityHint="Permanently removes this user"
            accessibilityRole="button"
          >
            Delete
          </Button>
        </View>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 15,
    marginTop: 0,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  statusContainer: {
    marginTop: 10,
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
