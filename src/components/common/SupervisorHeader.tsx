import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';

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

  return (
    <Appbar.Header style={styles.header}>
      {showBack && <Appbar.BackAction onPress={() => navigation.goBack()} />}
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
    backgroundColor: '#673AB7',
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
