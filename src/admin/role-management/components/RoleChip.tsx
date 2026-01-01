import React from 'react';
import { Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface RoleChipProps {
  roleId: string;
  roleName: string;
  roleColor: string;
}

export const RoleChip: React.FC<RoleChipProps> = ({ roleName, roleColor }) => {
  return (
    <Chip
      style={[styles.roleChip, { backgroundColor: roleColor }]}
      textStyle={styles.roleChipText}
    >
      {roleName}
    </Chip>
  );
};

const styles = StyleSheet.create({
  roleChip: {
    marginLeft: 10,
  },
  roleChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
