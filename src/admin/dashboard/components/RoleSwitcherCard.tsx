import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Menu, Button } from 'react-native-paper';
import { AdminRole } from '../../../context/AdminContext';
import { AVAILABLE_ROLES } from '../utils';

interface RoleSwitcherCardProps {
  selectedRole: AdminRole | null;
  menuVisible: boolean;
  onMenuToggle: (visible: boolean) => void;
  onRoleSelect: (role: AdminRole) => void;
}

export const RoleSwitcherCard: React.FC<RoleSwitcherCardProps> = ({
  selectedRole,
  menuVisible,
  onMenuToggle,
  onRoleSelect,
}) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Switch Role View</Title>
        <Paragraph style={styles.cardDescription}>
          View the app as a different role to test functionality
        </Paragraph>
        <Menu
          visible={menuVisible}
          onDismiss={() => onMenuToggle(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => onMenuToggle(true)}
              style={styles.roleButton}
            >
              {selectedRole ? `Current: ${selectedRole}` : 'Select Role to Switch'}
            </Button>
          }
        >
          {AVAILABLE_ROLES.map((role) => (
            <Menu.Item
              key={role.key}
              onPress={() => onRoleSelect(role.key)}
              title={role.label}
            />
          ))}
        </Menu>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 15,
    marginBottom: 10,
  },
  cardDescription: {
    marginTop: 5,
    marginBottom: 15,
    color: '#666',
  },
  roleButton: {
    marginTop: 10,
  },
});
