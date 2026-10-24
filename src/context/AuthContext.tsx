'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/hrms';
import { api } from '../lib/api';

export const isUserAdminRole = (role?: string): boolean => {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return (
    normalized === 'SUPER_ADMIN' ||
    normalized === 'HR_ADMIN' ||
    normalized === 'FINANCE_ADMIN' ||
    normalized === 'ADMIN'
  );
};

export const determinePortalMode = (role?: string): 'admin' | 'employee' => {
  return isUserAdminRole(role) ? 'admin' : 'employee';
};

const emptyUser: User = {
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  role: 'EMPLOYEE',
  avatarUrl: '',
};

interface AuthContextType {
  user: User;
  role: Role;
  portalMode: 'admin' | 'employee';
  setPortalMode: (mode: 'admin' | 'employee') => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string; role?: string }>;
  loginAsSuperAdmin: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginAsAdmin: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginAsEmployee: (codeOrEmail: string, passwordOrPin?: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    departmentId?: string;
    designationId?: string;
  }) => Promise<{ success: boolean; message?: string; user?: any }>;
  switchRole: (newRole: Role) => void;
  hasPermission: (action: string) => boolean;
  allUsers: User[];
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(emptyUser);
  const [portalMode, setPortalModeState] = useState<'admin' | 'employee'>('employee');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const enrichUserData = async (baseUser: any) => {
    if (!baseUser) return baseUser;
    let enriched = { ...baseUser };
    try {
      const backendEmps = await api.getEmployees().catch(() => []);
      const matched = backendEmps.find((e: any) =>
        (baseUser.email && e.email?.toLowerCase() === baseUser.email.toLowerCase()) ||
        (baseUser.id && (e.userId === baseUser.id || e.id === baseUser.id || (e as any)._id === baseUser.id)) ||
        (baseUser.employeeId && (e.id === baseUser.employeeId || (e as any)._id === baseUser.employeeId)) ||
        (baseUser.employeeCode && e.employeeCode?.toLowerCase() === baseUser.employeeCode.toLowerCase())
      );
      if (matched) {
        enriched.employeeId = matched.id;
        enriched.employeeCode = matched.employeeCode;
        enriched.departmentName = matched.departmentName;
        enriched.designationTitle = matched.designationTitle;
        enriched.avatarUrl = matched.avatarUrl || enriched.avatarUrl || '';
        enriched.phone = matched.phone || enriched.phone || '';
      }
    } catch (err) {
      console.warn('Could not enrich employee profile:', err);
    }
    return enriched;
  };

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('hrms_auth_token') || localStorage.getItem('bearerToken'))
      : null;
    const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('hrms_is_authenticated') : null;

    if (storedAuth === 'true' && token) {
      api.getMe(token)
        .then(async (meUser) => {
          if (meUser && meUser.id) {
            const enriched = await enrichUserData(meUser);
            setUser(enriched);
            setIsAuthenticated(true);
            const userRole = enriched.role || 'EMPLOYEE';
            const allowedPortal = determinePortalMode(userRole);
            setPortalModeState(allowedPortal);
            localStorage.setItem('hrms_auth_user', JSON.stringify(enriched));
            localStorage.setItem('hrms_current_role', userRole);
            localStorage.setItem('hrms_portal_mode', allowedPortal);
          } else {
            throw new Error('User not found');
          }
        })
        .catch(() => {
          setUser(emptyUser);
          setIsAuthenticated(false);
          localStorage.removeItem('hrms_is_authenticated');
          localStorage.removeItem('hrms_auth_token');
          localStorage.removeItem('bearerToken');
          localStorage.removeItem('hrms_auth_user');
          localStorage.removeItem('hrms_current_role');
          localStorage.removeItem('hrms_portal_mode');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setUser(emptyUser);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const setPortalMode = (mode: 'admin' | 'employee') => {
    if (mode === 'admin' && !isUserAdminRole(user?.role)) {
      console.warn('Access denied: Employee accounts cannot access Admin portal.');
      setPortalModeState('employee');
      localStorage.setItem('hrms_portal_mode', 'employee');
      return;
    }
    setPortalModeState(mode);
    localStorage.setItem('hrms_portal_mode', mode);
  };

  const login = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; message?: string; role?: string }> => {
    const trimmedInput = identifier.trim();
    if (!password || password.trim().length === 0) {
      return { success: false, message: 'Password is required.' };
    }

    try {
      const res = await api.login(trimmedInput, password);
      if (res && res.user) {
        const userRole = res.user.role || 'EMPLOYEE';
        const targetPortal = determinePortalMode(userRole);
        const enriched = await enrichUserData(res.user);

        if (userRole === 'SUPER_ADMIN') {
          try {
            const superAdminUser = await api.getSuperAdminUser('user-1');
            if (superAdminUser) {
              localStorage.setItem('hrms_superadmin_user_data', JSON.stringify(superAdminUser));
            }
          } catch (saErr) {
            console.warn('Super Admin API call error:', saErr);
          }
        }

        setUser(enriched);
        setPortalModeState(targetPortal);
        setIsAuthenticated(true);
        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', targetPortal);
        localStorage.setItem('hrms_current_role', userRole);
        localStorage.setItem('hrms_auth_user', JSON.stringify(enriched));
        return { success: true, role: userRole };
      }
      return { success: false, message: res?.message || 'Invalid credentials.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Invalid email or password.' };
    }
  };

  const loginAsSuperAdmin = async (
    emailOrPhone: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmedInput = emailOrPhone.trim();
    if (!password || password.trim().length === 0) {
      return { success: false, message: 'Password is required.' };
    }

    try {
      const res = await api.login(trimmedInput, password);
      if (res && res.user) {
        const userRole = res.user.role || 'SUPER_ADMIN';
        if (userRole !== 'SUPER_ADMIN') {
          return { success: false, message: 'Access denied: You do not have Super Admin privileges.' };
        }

        // Call /api/super-admin/users/user-1 on superadmin login
        try {
          const superAdminUser = await api.getSuperAdminUser('user-1');
          if (superAdminUser) {
            localStorage.setItem('hrms_superadmin_user_data', JSON.stringify(superAdminUser));
          }
        } catch (saErr) {
          console.warn('Super Admin API call error:', saErr);
        }

        const enriched = await enrichUserData(res.user);
        setUser(enriched);
        setPortalModeState('admin');
        setIsAuthenticated(true);
        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', 'admin');
        localStorage.setItem('hrms_current_role', 'SUPER_ADMIN');
        localStorage.setItem('hrms_initial_module', 'super_admin');
        localStorage.setItem('hrms_auth_user', JSON.stringify(enriched));
        return { success: true };
      }
      return { success: false, message: res?.message || 'Invalid Super Admin credentials.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Invalid Super Admin credentials.' };
    }
  };

  const loginAsAdmin = async (
    emailOrPhone: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmedInput = emailOrPhone.trim();
    if (!password || password.trim().length === 0) {
      return { success: false, message: 'Password is required.' };
    }

    try {
      const res = await api.login(trimmedInput, password);
      if (res && res.user) {
        const userRole = res.user.role || 'HR_ADMIN';
        if (!isUserAdminRole(userRole)) {
          return { success: false, message: 'Access denied: You do not have Admin privileges. Please use Staff Login.' };
        }
        if (userRole === 'SUPER_ADMIN') {
          try {
            const superAdminUser = await api.getSuperAdminUser('user-1');
            if (superAdminUser) {
              localStorage.setItem('hrms_superadmin_user_data', JSON.stringify(superAdminUser));
            }
          } catch (saErr) {
            console.warn('Super Admin API call error:', saErr);
          }
        }

        const enriched = await enrichUserData(res.user);
        setUser(enriched);
        setPortalModeState('admin');
        setIsAuthenticated(true);
        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', 'admin');
        localStorage.setItem('hrms_current_role', userRole);
        localStorage.setItem('hrms_initial_module', userRole === 'SUPER_ADMIN' ? 'super_admin' : 'dashboard');
        localStorage.setItem('hrms_auth_user', JSON.stringify(enriched));
        return { success: true };
      }
      return { success: false, message: res?.message || 'Invalid Admin credentials.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Invalid credentials. Please verify your email and password.' };
    }
  };

  const loginAsEmployee = async (
    codeOrEmail: string,
    passwordOrPin?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmed = codeOrEmail.trim();
    if (!passwordOrPin || passwordOrPin.trim().length === 0) {
      return { success: false, message: 'Password / PIN is required.' };
    }

    try {
      const res = await api.login(trimmed, passwordOrPin);
      if (res && res.user) {
        const userRole = res.user.role || 'EMPLOYEE';
        const targetPortal = determinePortalMode(userRole);
        const enriched = await enrichUserData(res.user);
        setUser(enriched);
        setPortalModeState(targetPortal);
        setIsAuthenticated(true);
        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', targetPortal);
        localStorage.setItem('hrms_current_role', userRole);
        localStorage.setItem('hrms_auth_user', JSON.stringify(enriched));
        return { success: true };
      }
      return { success: false, message: res?.message || 'Invalid employee credentials.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Invalid credentials. Employee not found or password incorrect.' };
    }
  };

  const registerUser = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    departmentId?: string;
    designationId?: string;
  }): Promise<{ success: boolean; message?: string; user?: any }> => {
    try {
      const res = await api.register(data);
      if (res && res.user) {
        const userRole = res.user.role || data.role || 'EMPLOYEE';
        const targetPortal = determinePortalMode(userRole);
        const enriched = await enrichUserData(res.user);

        setUser(enriched);
        setPortalModeState(targetPortal);
        setIsAuthenticated(true);
        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', targetPortal);
        localStorage.setItem('hrms_current_role', userRole);
        localStorage.setItem('hrms_auth_user', JSON.stringify(enriched));

        window.dispatchEvent(new Event('hrms_employees_updated'));

        return { success: true, user: enriched };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Registration failed. Please check your details.',
      };
    }
  };

  const switchRole = (newRole: Role) => {
    if (!user || !user.id) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('hrms_current_role', newRole);
    localStorage.setItem('hrms_auth_user', JSON.stringify(updated));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(emptyUser);
    localStorage.removeItem('hrms_is_authenticated');
    localStorage.removeItem('hrms_current_role');
    localStorage.removeItem('hrms_portal_mode');
    localStorage.removeItem('hrms_auth_user');
    localStorage.removeItem('hrms_auth_token');
    localStorage.removeItem('bearerToken');
    window.dispatchEvent(new Event('hrms_auth_logout'));
  };

  const hasPermission = (action: string): boolean => {
    if (!user || !user.role) return false;
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
        role: user.role || 'EMPLOYEE',
        portalMode,
        setPortalMode,
        isAuthenticated,
        isLoading,
        login,
        loginAsSuperAdmin,
        loginAsAdmin,
        loginAsEmployee,
        registerUser,
        switchRole,
        hasPermission,
        allUsers: [],
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
