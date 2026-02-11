import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, Menu } from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';

export interface DesignerHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  showMenu?: boolean;
}

/**
 * DesignerHeader Component
 *
 * Consistent header for all Design Engineer screens
 * Includes title, optional subtitle, back button, refresh, and menu
 *
 * Usage:
 * <DesignerHeader title="Dashboard" subtitle={projectName} onRefresh={refresh} />
 * <DesignerHeader title="Design Documents" showBack />
 */
export const DesignerHeader: React.FC<DesignerHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onRefresh,
  refreshing = false,
  showMenu = true,
}) => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      })
    );
  };

  const handleTutorial = () => {
    setMenuVisible(false);
    // Navigate to tutorial if available
    (navigation as any).navigate('DesignEngineerDashboard', { showTutorial: true });
  };

  return (
    <Appbar.Header style={styles.header}>
      {showBack && (
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
      )}
      <Appbar.Content title={title} subtitle={subtitle} color="#fff" />

      {/* Refresh Button (optional) */}
      {onRefresh && (
        <Appbar.Action
          icon="refresh"
          onPress={onRefresh}
          disabled={refreshing}
          color="#fff"
        />
      )}

      {/* Menu Button (Tutorial + Logout) */}
      {showMenu && (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
              color="#fff"
            />
          }
        >
          <Menu.Item
            onPress={handleTutorial}
            title="Tutorial"
            leadingIcon="help-circle-outline"
          />
          <Menu.Item
            onPress={handleLogout}
            title="Logout"
            leadingIcon="logout"
          />
        </Menu>
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#673AB7',
  },
});
