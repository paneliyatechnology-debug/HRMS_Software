'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/hrms';
import { mockUsers, mockEmployees } from '../lib/mockData';
import { api } from '../lib/api';

interface AuthContextType {
  user: User;
  role: Role;
  portalMode: 'admin' | 'employee';
  setPortalMode: (mode: 'admin' | 'employee') => void;
  isAuthenticated: boolean;
  loginAsAdmin: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginAsEmployee: (codeOrEmail: string, passwordOrPin?: string) => Promise<{ success: boolean; message?: string }>;
  switchRole: (newRole: Role) => void;
  hasPermission: (action: string) => boolean;
  allUsers: User[];
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(mockUsers[0]);
  const [portalMode, setPortalModeState] = useState<'admin' | 'employee'>('admin');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // default true or check localStorage

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('hrms_is_authenticated');
      const savedRole = localStorage.getItem('hrms_current_role');
      const savedPortal = localStorage.getItem('hrms_portal_mode') as 'admin' | 'employee' | null;
      const storedUserData = localStorage.getItem('hrms_auth_user');

      if (storedAuth !== null) {
        setIsAuthenticated(storedAuth === 'true');
      }

      if (savedPortal) {
        setPortalModeState(savedPortal);
      }

      if (storedUserData) {
        try {
          setUser(JSON.parse(storedUserData));
        } catch {
          // ignore
        }
      } else if (savedRole) {
        const matched = mockUsers.find((u) => u.role === savedRole);
        if (matched) setUser(matched);
      }
    } catch (e) {
      console.warn('Auth restoration error:', e);
    }
  }, []);

  const setPortalMode = (mode: 'admin' | 'employee') => {
    setPortalModeState(mode);
    localStorage.setItem('hrms_portal_mode', mode);
  };

  const loginAsAdmin = async (
    emailOrPhone: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmedInput = emailOrPhone.trim().toLowerCase();

    // Check credentials (supports phone: 6352486893, email: keyur.sangani1234@gmail.com, or admin demo)
    const isAdminMatch =
      trimmedInput === 'keyur.sangani1234@gmail.com' ||
      trimmedInput === '6352486893' ||
      trimmedInput === 'admin' ||
      trimmedInput.includes('sangani');

    if (isAdminMatch) {
      const adminUser: User = {
        id: 'user-1',
        email: 'keyur.sangani1234@gmail.com',
        firstName: 'Keyur',
        lastName: 'Sangani',
        role: 'SUPER_ADMIN',
        employeeId: 'emp-1',
        avatarUrl: '',
      };

      try {
        await api.login(adminUser.email, password || '123456789');
      } catch (err) {
        console.warn('Backend login fallback used:', err);
      }

      setUser(adminUser);
      setPortalModeState('admin');
      setIsAuthenticated(true);

      localStorage.setItem('hrms_is_authenticated', 'true');
      localStorage.setItem('hrms_portal_mode', 'admin');
      localStorage.setItem('hrms_current_role', 'SUPER_ADMIN');
      localStorage.setItem('hrms_auth_user', JSON.stringify(adminUser));

      return { success: true };
    }

    // Attempt backend login directly
    try {
      const res = await api.login(trimmedInput, password);
      if (res && res.user) {
        setUser(res.user);
        setPortalModeState('admin');
        setIsAuthenticated(true);
        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', 'admin');
        localStorage.setItem('hrms_auth_user', JSON.stringify(res.user));
        return { success: true };
      }
    } catch (err: any) {
      // not matched
    }

    return {
      success: false,
      message: 'Invalid Admin credentials. Try phone: 6352486893 or email: keyur.sangani1234@gmail.com with password: 123456789',
    };
  };

  const loginAsEmployee = async (
    codeOrEmail: string,
    passwordOrPin?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmed = codeOrEmail.trim().toLowerCase();

    // Match in employees list
    const foundEmp = mockEmployees.find(
      (e) =>
        e.employeeCode.toLowerCase() === trimmed ||
        e.email.toLowerCase() === trimmed ||
        e.phone.includes(trimmed) ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(trimmed)
    );

    if (foundEmp) {
      const empUser: User = {
        id: `user-${foundEmp.id}`,
        email: foundEmp.email,
        firstName: foundEmp.firstName,
        lastName: foundEmp.lastName,
        role: 'EMPLOYEE',
        employeeId: foundEmp.id,
        avatarUrl: foundEmp.avatarUrl,
      };

      setUser(empUser);
      setPortalModeState('employee');
      setIsAuthenticated(true);

      localStorage.setItem('hrms_is_authenticated', 'true');
      localStorage.setItem('hrms_portal_mode', 'employee');
      localStorage.setItem('hrms_current_role', 'EMPLOYEE');
      localStorage.setItem('hrms_auth_user', JSON.stringify(empUser));

      return { success: true };
    }

    return {
      success: false,
      message: 'Employee not found. Please enter valid Employee Code (e.g. EMP-1, EMP-2, EMP-3) or registered email.',
    };
  };

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
    localStorage.setItem('hrms_auth_user', JSON.stringify(matched));
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('hrms_is_authenticated');
    localStorage.removeItem('hrms_current_role');
    localStorage.removeItem('hrms_auth_user');
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
        portalMode,
        setPortalMode,
        isAuthenticated,
        loginAsAdmin,
        loginAsEmployee,
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
