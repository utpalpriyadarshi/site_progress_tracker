import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Portal,
  Modal,
  Title,
  TextInput,
  Button,
  Paragraph,
  Menu,
  Chip,
  Divider,
} from 'react-native-paper';
import UserModel from '../../../../models/UserModel';
import RoleModel from '../../../../models/RoleModel';
import { UserFormData } from '../utils/userValidation';
import { getRoleName, getProjectName } from '../utils';

interface UserFormDialogProps {
  visible: boolean;
  editingUser: UserModel | null;
  formData: UserFormData;
  roles: RoleModel[];
  projects: any[];
  roleMenuVisible: boolean;
  projectMenuVisible: boolean;
  onDismiss: () => void;
  onFormDataChange: (data: Partial<UserFormData>) => void;
  onSave: () => void;
  onRoleMenuToggle: (visible: boolean) => void;
  onProjectMenuToggle: (visible: boolean) => void;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  visible,
  editingUser,
  formData,
  roles,
  projects,
  roleMenuVisible,
  projectMenuVisible,
  onDismiss,
  onFormDataChange,
  onSave,
  onRoleMenuToggle,
  onProjectMenuToggle,
}) => {
  const selectedRoleName = getRoleName(formData.roleId, roles);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContent}>
        <ScrollView>
          <Title style={styles.modalTitle}>
            {editingUser ? 'Edit User' : 'Create New User'}
          </Title>

          <TextInput
            label="Username"
            value={formData.username}
            onChangeText={(text) => onFormDataChange({ username: text })}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
          />

          <TextInput
            label={editingUser ? 'Password (leave blank to keep current)' : 'Password'}
            value={formData.password}
            onChangeText={(text) => onFormDataChange({ password: text })}
            style={styles.input}
            mode="outlined"
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            label="Full Name"
            value={formData.fullName}
            onChangeText={(text) => onFormDataChange({ fullName: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Email (optional)"
            value={formData.email}
            onChangeText={(text) => onFormDataChange({ email: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            label="Phone (optional)"
            value={formData.phone}
            onChangeText={(text) => onFormDataChange({ phone: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />

          <Paragraph style={styles.label}>Role</Paragraph>
          <Menu
            visible={roleMenuVisible}
            onDismiss={() => onRoleMenuToggle(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => onRoleMenuToggle(true)}
                style={styles.roleButton}
              >
                {formData.roleId ? selectedRoleName : 'Select Role'}
              </Button>
            }
          >
            {roles.map((role) => (
              <Menu.Item
                key={role.id}
                onPress={() => {
                  onFormDataChange({ roleId: role.id });
                  onRoleMenuToggle(false);
                }}
                title={role.name}
              />
            ))}
          </Menu>

          {/* Project Assignment */}
          <View style={styles.projectSection}>
            <Paragraph style={styles.label}>
              Assigned Project{' '}
              {(['Supervisor', 'Manager'].includes(selectedRoleName))
                ? '(Required)'
                : '(Optional)'}
            </Paragraph>
            <Menu
              visible={projectMenuVisible}
              onDismiss={() => onProjectMenuToggle(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => onProjectMenuToggle(true)}
                  style={styles.roleButton}
                >
                  {getProjectName(formData.projectId, projects)}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  onFormDataChange({ projectId: '' });
                  onProjectMenuToggle(false);
                }}
                title="No Project Assigned"
              />
              <Divider />
              {projects.map((project) => (
                <Menu.Item
                  key={project.id}
                  onPress={() => {
                    onFormDataChange({ projectId: project.id });
                    onProjectMenuToggle(false);
                  }}
                  title={project.name}
                />
              ))}
            </Menu>
          </View>

          <View style={styles.activeToggle}>
            <Paragraph style={styles.label}>Account Status</Paragraph>
            <View style={styles.statusButtons}>
              <Chip
                selected={formData.isActive}
                onPress={() => onFormDataChange({ isActive: true })}
                style={styles.statusOption}
              >
                Active
              </Chip>
              <Chip
                selected={!formData.isActive}
                onPress={() => onFormDataChange({ isActive: false })}
                style={styles.statusOption}
              >
                Inactive
              </Chip>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={onSave}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  label: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  roleButton: {
    marginBottom: 15,
  },
  projectSection: {
    marginVertical: 10,
  },
  activeToggle: {
    marginTop: 10,
  },
  statusButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusOption: {
    marginRight: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
});
