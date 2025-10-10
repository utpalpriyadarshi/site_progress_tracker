import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth, UserRole } from './AuthContext';

interface RoleSwitcherProps {
  onRoleChange?: (role: UserRole) => void;
}

const roleDisplayNames: Record<UserRole, string> = {
  supervisor: 'Supervisor',
  manager: 'Manager',
  planning: 'Planning',
  logistics: 'Logistics',
};

const roleIcons: Record<UserRole, string> = {
  supervisor: 'account-hard-hat',
  manager: 'briefcase',
  planning: 'calendar-check',
  logistics: 'truck-delivery',
};

export const RoleSwitcher = ({ onRoleChange }: RoleSwitcherProps) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { user, currentRole, selectRole } = useAuth();

  if (!user || user.availableRoles.length <= 1) {
    // Don't show switcher for users with only one role
    return null;
  }

  const handleRoleSelect = async (role: UserRole) => {
    try {
      await selectRole(role);
      setMenuVisible(false);
      if (onRoleChange) {
        onRoleChange(role);
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  };

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <TouchableOpacity
          style={styles.switcherButton}
          onPress={() => setMenuVisible(true)}
        >
          <Icon
            name={currentRole ? roleIcons[currentRole] : 'account-switch'}
            size={20}
            color="#007AFF"
          />
          <Text style={styles.switcherText}>
            {currentRole ? roleDisplayNames[currentRole] : 'Select Role'}
          </Text>
          <Icon name="chevron-down" size={20} color="#007AFF" />
        </TouchableOpacity>
      }
    >
      <View style={styles.menuHeader}>
        <Text style={styles.menuHeaderText}>Switch Role</Text>
      </View>
      {user.availableRoles.map((role) => (
        <Menu.Item
          key={role}
          onPress={() => handleRoleSelect(role)}
          title={roleDisplayNames[role]}
          leadingIcon={roleIcons[role]}
          titleStyle={currentRole === role ? styles.activeRoleText : undefined}
          style={currentRole === role ? styles.activeRoleItem : undefined}
        />
      ))}
    </Menu>
  );
};

const styles = StyleSheet.create({
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  switcherText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  activeRoleItem: {
    backgroundColor: '#f0f8ff',
  },
  activeRoleText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default RoleSwitcher;
