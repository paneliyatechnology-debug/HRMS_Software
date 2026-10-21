'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/hrms';
import { mockUsers } from '../lib/mockData';

interface AuthContextType {
  user: User;
  role: Role;
  switchRole: (newRole: Role) => void;
  hasPermission: (action: string) => boolean;
  allUsers: User[];
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(mockUsers[0]);

  useEffect(() => {
    const saved = localStorage.getItem('hrms_current_role');
    if (saved) {
      const matched = mockUsers.find((u) => u.role === saved);
      if (matched) setUser(matched);
    }
  }, []);

  const switchRole = (newRole: Role) => {
    const matched = mockUsers.find((u) => u.role === newRole) || {
      id: `user-${Date.now()}`,
      email: `${newRole.toLowerCase()}@paneliya.com`,
      firstName: newRole.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
      lastName: 'User',
      role: newRole,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    setUser(matched);
    localStorage.setItem('hrms_current_role', newRole);
  };

  const logout = () => {
    localStorage.removeItem('hrms_current_role');
    setUser(mockUsers[0]);
  };

  const hasPermission = (action: string): boolean => {
    if (user.role === 'SUPER_ADMIN') return true;

    switch (action) {
      case 'MANAGE_EMPLOYEES':
        return ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'].includes(user.role);
      case 'PROCESS_PAYROLL':
        return ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN'].includes(user.role);
      case 'APPROVE_LEAVES':
        return ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user.role);
      case 'MANAGE_RECRUITMENT':
        return ['SUPER_ADMIN', 'HR_ADMIN', 'RECRUITER'].includes(user.role);
      case 'MANAGE_ASSETS':
        return ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role);
      case 'VIEW_AUDIT_LOGS':
        return ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role);
      case 'VIEW_ALL_REPORTS':
        return ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN'].includes(user.role);
      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        switchRole,
        hasPermission,
        allUsers: mockUsers,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
