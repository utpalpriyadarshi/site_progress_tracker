import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, IconButton } from 'react-native-paper';
import { useNavigation, CommonActions, DrawerActions } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';
import { COLORS } from '../../theme/colors';

export interface SupervisorHeaderProps {
  title: string;
  showBack?: boolean;
  rightActions?: React.ReactNode;
}

/**
 * SupervisorHeader Component
 *
 * Consistent header for all supervisor screens
 * Includes title, optional back button, and logout button
 *
 * Usage:
 * <SupervisorHeader title="Dashboard" />
 * <SupervisorHeader title="Sites" showBack={false} />
 */
export const SupervisorHeader: React.FC<SupervisorHeaderProps> = ({
  title,
  showBack = false,
  rightActions,
}) => {
  const navigation = useNavigation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      })
    );
  };

  const handleDrawerToggle = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  return (
    <Appbar.Header style={styles.header}>
      {showBack
        ? <Appbar.BackAction onPress={() => navigation.goBack()} />
        : <IconButton icon="menu" size={26} iconColor="#FFF" onPress={handleDrawerToggle} style={styles.menuButton} />
      }
      <Appbar.Content title={title} />

      {/* Custom right actions (optional) */}
      {rightActions}

      {/* Logout Button (always present) */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.PRIMARY,
  },
  menuButton: {
    marginLeft: 2,
  },
  logoutButton: {
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
