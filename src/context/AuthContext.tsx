'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/hrms';
import { mockUsers, mockEmployees } from '../lib/mockData';
import { getAllEmployees } from '../lib/employeeService';
import { api } from '../lib/api';

interface AuthContextType {
  user: User;
  role: Role;
  portalMode: 'admin' | 'employee';
  setPortalMode: (mode: 'admin' | 'employee') => void;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // strictly false by default, requires login
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('hrms_is_authenticated');
      const savedRole = localStorage.getItem('hrms_current_role');
      const savedPortal = localStorage.getItem('hrms_portal_mode') as 'admin' | 'employee' | null;
      const storedUserData = localStorage.getItem('hrms_auth_user');

      if (storedAuth === 'true') {
        setIsAuthenticated(true);
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
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.warn('Auth restoration error:', e);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
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
    const trimmedInput = emailOrPhone.trim();
    const lowerInput = trimmedInput.toLowerCase();

    // 1. First, attempt direct backend authentication via /api/auth/login
    try {
      const res = await api.login(trimmedInput, password);
      if (res && res.user) {
        setUser(res.user);
        setPortalModeState('admin');
        setIsAuthenticated(true);
        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', 'admin');
        localStorage.setItem('hrms_current_role', res.user.role || 'SUPER_ADMIN');
        localStorage.setItem('hrms_auth_user', JSON.stringify(res.user));
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Backend /auth/login attempt:', err?.message || err);
    }

    // 2. Fetch live employees from backend to check if admin/employee exists by code/phone/email
    try {
      const backendEmps = await api.getEmployees().catch(() => []);
      const allSourceEmps = backendEmps && backendEmps.length > 0 ? backendEmps : getAllEmployees();

      const matchedEmp = allSourceEmps.find((e: any) =>
        e.email?.toLowerCase() === lowerInput ||
        e.employeeCode?.toLowerCase() === lowerInput ||
        (e.phone && e.phone.replace(/\D/g, '').includes(lowerInput.replace(/\D/g, ''))) ||
        e.id?.toLowerCase() === lowerInput ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(lowerInput)
      );

      if (matchedEmp) {
        // Try calling backend login with matched employee's email if possible
        try {
          await api.login(matchedEmp.email, password);
        } catch {
          // Continue with matched profile
        }

        const adminUser: User = {
          id: matchedEmp.userId || `user-${matchedEmp.id}`,
          email: matchedEmp.email,
          firstName: matchedEmp.firstName,
          lastName: matchedEmp.lastName,
          role: (matchedEmp.designationTitle?.toUpperCase().includes('ADMIN') ? 'SUPER_ADMIN' : 'HR_ADMIN') as Role,
          employeeId: matchedEmp.id,
          avatarUrl: matchedEmp.avatarUrl || '',
        };

        setUser(adminUser);
        setPortalModeState('admin');
        setIsAuthenticated(true);

        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', 'admin');
        localStorage.setItem('hrms_current_role', adminUser.role);
        localStorage.setItem('hrms_auth_user', JSON.stringify(adminUser));

        return { success: true };
      }
    } catch (err) {
      console.warn('Backend employees check failed:', err);
    }

    // 3. Fallback demo admin matching
    const isAdminMatch =
      lowerInput === 'keyur.sangani1234@gmail.com' ||
      lowerInput === '6352486893' ||
      lowerInput === 'admin' ||
      lowerInput.includes('sangani');

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

      setUser(adminUser);
      setPortalModeState('admin');
      setIsAuthenticated(true);

      localStorage.setItem('hrms_is_authenticated', 'true');
      localStorage.setItem('hrms_portal_mode', 'admin');
      localStorage.setItem('hrms_current_role', 'SUPER_ADMIN');
      localStorage.setItem('hrms_auth_user', JSON.stringify(adminUser));

      return { success: true };
    }

    return {
      success: false,
      message: 'Invalid credentials. Please enter a valid registered Admin email, phone, or Employee ID.',
    };
  };

  const loginAsEmployee = async (
    codeOrEmail: string,
    passwordOrPin?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmed = codeOrEmail.trim();
    const lowerInput = trimmed.toLowerCase();

    // 1. Fetch live employees directly from Backend API (http://192.168.1.113:4000/api/employees)
    let sourceEmps: any[] = [];
    try {
      sourceEmps = await api.getEmployees();
    } catch (err) {
      console.warn('Failed to fetch backend employees for login, using local data:', err);
      sourceEmps = getAllEmployees();
    }

    if (!sourceEmps || sourceEmps.length === 0) {
      sourceEmps = mockEmployees;
    }

    // Match by Employee Code (e.g. EMP-109, EMP-106, EMP-105, EMP-2), Email, Phone, ID or Name
    const foundEmp = sourceEmps.find((e) =>
      e.employeeCode?.toLowerCase() === lowerInput ||
      e.email?.toLowerCase() === lowerInput ||
      (e.phone && e.phone.replace(/\D/g, '').includes(lowerInput.replace(/\D/g, ''))) ||
      e.id?.toLowerCase() === lowerInput ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(lowerInput)
    );

    if (foundEmp) {
      const empUser: User = {
        id: foundEmp.userId || `user-${foundEmp.id}`,
        email: foundEmp.email,
        firstName: foundEmp.firstName,
        lastName: foundEmp.lastName,
        role: 'EMPLOYEE',
        employeeId: foundEmp.id,
        avatarUrl: foundEmp.avatarUrl || '',
      };

      // Try calling backend login in background so token is stored if user exists in auth table
      try {
        await api.login(foundEmp.email, passwordOrPin);
      } catch {
        // Employee might not have separate auth record yet
      }

      setUser(empUser);
      setPortalModeState('employee');
      setIsAuthenticated(true);

      localStorage.setItem('hrms_is_authenticated', 'true');
      localStorage.setItem('hrms_portal_mode', 'employee');
      localStorage.setItem('hrms_current_role', 'EMPLOYEE');
      localStorage.setItem('hrms_auth_user', JSON.stringify(empUser));

      return { success: true };
    }

    // 2. Also try backend /auth/login directly in case user exists in backend auth table
    try {
      const res = await api.login(trimmed, passwordOrPin);
      if (res && res.user) {
        setUser(res.user);
        setPortalModeState('employee');
        setIsAuthenticated(true);
        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', 'employee');
        localStorage.setItem('hrms_current_role', 'EMPLOYEE');
        localStorage.setItem('hrms_auth_user', JSON.stringify(res.user));
        return { success: true };
      }
    } catch {
      // ignore
    }

    return {
      success: false,
      message: 'Employee record not found in backend. Please check Employee ID (e.g. EMP-109, EMP-106, EMP-105, EMP-2) or registered email.',
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
    setUser(mockUsers[0]);
    localStorage.removeItem('hrms_is_authenticated');
    localStorage.removeItem('hrms_current_role');
    localStorage.removeItem('hrms_portal_mode');
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
        isLoading,
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
