import { useState } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { AdminRole } from '../../context/AdminContext';
import { ROLE_NAVIGATION_MAP } from '../utils';

export const useRoleSwitcher = (
  selectedRole: AdminRole | null,
  setSelectedRole: (role: AdminRole | null) => void
) => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleRoleSwitch = (role: AdminRole) => {
    setMenuVisible(false);
    if (role) {
      setSelectedRole(role);

      // Navigate to the selected role's navigator
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: ROLE_NAVIGATION_MAP[role] }],
        })
      );
    }
  };

  return {
    menuVisible,
    setMenuVisible,
    handleRoleSwitch,
  };
};
