import { useState, useEffect } from 'react';
import UserModel from '../../../../models/UserModel';

export const useUserFilters = (users: UserModel[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserModel[]>([]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredUsers,
  };
};
