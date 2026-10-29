'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/hrms';
import { api } from '../lib/api';
import { findOrganizationByEmail } from '../lib/companyService';

export const isUserAdminRole = (role?: string): boolean => {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return (
    normalized === 'SUPER_ADMIN' ||
    normalized === 'HR_ADMIN' ||
    normalized === 'COMPANY_ADMIN' ||
    normalized === 'ORG_ADMIN' ||
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

export interface DemoUserAccount {
  key: 'admin' | 'employee' | 'superadmin';
  label: string;
  badge: string;
  identifier: string;
  aliases: string[];
  password: string;
  role: Role;
  portal: 'admin' | 'employee';
  user: User;
}

export const DEMO_USERS: DemoUserAccount[] = [];

interface AuthContextType {
  user: User;
  role: Role;
  portalMode: 'admin' | 'employee';
  setPortalMode: (mode: 'admin' | 'employee') => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string; role?: string; notInOrganization?: boolean }>;
  loginAsSuperAdmin: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; message?: string; notInOrganization?: boolean }>;
  loginAsAdmin: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; message?: string; notInOrganization?: boolean }>;
  loginAsEmployee: (codeOrEmail: string, passwordOrPin?: string) => Promise<{ success: boolean; message?: string; notInOrganization?: boolean }>;
  loginWithDemoAccount: (accountKey: 'admin' | 'employee' | 'superadmin') => Promise<{ success: boolean; role?: string; message?: string }>;
  registerUser: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    departmentId?: string;
    designationId?: string;
  }) => Promise<{ success: boolean; message?: string; user?: any; notInOrganization?: boolean }>;
  switchRole: (newRole: Role) => void;
  updateUserProfile: (updates: Partial<User>) => void;
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
        enriched.companyId = matched.companyId || enriched.companyId;
        enriched.companyName = matched.companyName || enriched.companyName;
      }
      if (!enriched.companyId && enriched.email) {
        const org = findOrganizationByEmail(enriched.email);
        if (org.isMember && org.companyId) {
          enriched.companyId = org.companyId;
          enriched.companyName = org.companyName;
        }
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

    if (typeof window !== 'undefined') {
      try {
        const PURGE_ALL_MOCKS_KEY = 'hrms_pure_database_sync_v4';
        if (localStorage.getItem(PURGE_ALL_MOCKS_KEY) !== 'true') {
          // 1. Purge any stale demo or fake offline sessions
          const savedToken = localStorage.getItem('hrms_auth_token') || '';
          if (
            savedToken.startsWith('demo_token_') ||
            savedToken.startsWith('token_admin-') ||
            savedToken.startsWith('token_emp-')
          ) {
            localStorage.removeItem('hrms_auth_token');
            localStorage.removeItem('bearerToken');
            localStorage.removeItem('hrms_is_authenticated');
            localStorage.removeItem('hrms_auth_user');
            localStorage.removeItem('hrms_current_role');
            localStorage.removeItem('hrms_portal_mode');
          }

          // 2. Clear all local mock caches so data is strictly fetched from backend database
          localStorage.removeItem('hrms_employees_records');
          localStorage.removeItem('hrms_daily_attendance_records');
          localStorage.removeItem('hrms_leave_requests');
          localStorage.removeItem('hrms_payroll_records');
          localStorage.removeItem('hrms_notices_records');
          localStorage.removeItem('hrms_multi_tenant_companies');
          localStorage.removeItem('hrms_tenant_company_employees');

          localStorage.setItem(PURGE_ALL_MOCKS_KEY, 'true');
        }
      } catch {}
    }

    if (token && token.startsWith('demo_token_')) {
      localStorage.removeItem('hrms_auth_token');
      localStorage.removeItem('bearerToken');
      localStorage.removeItem('hrms_is_authenticated');
      localStorage.removeItem('hrms_auth_user');
      localStorage.removeItem('hrms_current_role');
      localStorage.removeItem('hrms_portal_mode');
    }

    if (storedAuth === 'true' && token && !token.startsWith('demo_token_')) {

      const safetyTimer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

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
          clearTimeout(safetyTimer);
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

  // 1-Click Instant Demo Login (Disabled in production mode)
  const loginWithDemoAccount = async (
    _accountKey: 'admin' | 'employee' | 'superadmin'
  ): Promise<{ success: boolean; role?: string; message?: string }> => {
    return { success: false, message: 'Demo accounts have been permanently removed.' };
  };

  const login = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; message?: string; role?: string; notInOrganization?: boolean }> => {
    const trimmedInput = identifier.trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    if (!password || password.trim().length === 0) {
      return { success: false, message: 'Password is required.' };
    }

    const org = findOrganizationByEmail(identifier);

    // 1. Direct login via backend API & database
    try {
      const res = await api.login(identifier.trim(), password);
      if (res && res.user) {
        const userRole = res.user.role || org.role || 'EMPLOYEE';
        const targetPortal = determinePortalMode(userRole);
        const enriched = await enrichUserData({
          ...res.user,
          companyId: res.user.companyId || org.companyId || 'comp-paneliya',
          companyName: res.user.companyName || org.companyName || 'Paneliya Technology Inc.',
        });

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
      return { success: false, message: err?.message || 'Invalid credentials. User not found in database.' };
    }
  };

  const loginAsSuperAdmin = async (
    emailOrPhone: string,
    password?: string
  ): Promise<{ success: boolean; message?: string; notInOrganization?: boolean }> => {
    const trimmedInput = emailOrPhone.trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    if (!password || password.trim().length === 0) {
      return { success: false, message: 'Password is required.' };
    }

    const org = findOrganizationByEmail(emailOrPhone);

    try {
      const res = await api.login(emailOrPhone.trim(), password);
      if (res && res.user) {
        const userRole = res.user.role || 'SUPER_ADMIN';
        if (userRole !== 'SUPER_ADMIN') {
          return { success: false, message: 'Access denied: You do not have Super Admin privileges.' };
        }

        try {
          const superAdminUser = await api.getSuperAdminUser('user-1');
          if (superAdminUser) {
            localStorage.setItem('hrms_superadmin_user_data', JSON.stringify(superAdminUser));
          }
        } catch (saErr) {
          console.warn('Super Admin API call error:', saErr);
        }

        const enriched = await enrichUserData({
          ...res.user,
          companyId: res.user.companyId || org.companyId || 'comp-paneliya',
          companyName: res.user.companyName || org.companyName || 'Paneliya Technology Inc.',
        });
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
      return { success: false, message: err?.message || 'Invalid Super Admin credentials.' };
    }
  };

  const loginAsAdmin = async (
    emailOrPhone: string,
    password?: string
  ): Promise<{ success: boolean; message?: string; notInOrganization?: boolean }> => {
    const trimmedInput = emailOrPhone.trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    if (!password || password.trim().length === 0) {
      return { success: false, message: 'Password is required.' };
    }

    const org = findOrganizationByEmail(emailOrPhone);

    try {
      const res = await api.login(emailOrPhone.trim(), password);
      if (res && res.user) {
        const userRole = res.user.role || org.role || 'HR_ADMIN';
        if (!isUserAdminRole(userRole)) {
          return { success: false, message: 'Access denied: You are registered as an Employee. Please use the Staff Employee Login tab.' };
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

        const enriched = await enrichUserData({
          ...res.user,
          companyId: res.user.companyId || org.companyId || 'comp-paneliya',
          companyName: res.user.companyName || org.companyName || 'Paneliya Technology Inc.',
        });
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
      return { success: false, message: err?.message || 'Invalid Admin credentials. User not found in database.' };
    }
  };

  const loginAsEmployee = async (
    codeOrEmail: string,
    passwordOrPin?: string
  ): Promise<{ success: boolean; message?: string; notInOrganization?: boolean }> => {
    const trimmed = codeOrEmail.trim().toLowerCase();
    const trimmedPass = (passwordOrPin || '').trim();

    if (!passwordOrPin || passwordOrPin.trim().length === 0) {
      return { success: false, message: 'Password / PIN is required.' };
    }

    const org = findOrganizationByEmail(codeOrEmail);

    try {
      const res = await api.login(codeOrEmail.trim(), passwordOrPin);
      if (res && res.user) {
        const userRole = res.user.role || org.role || 'EMPLOYEE';
        const targetPortal = determinePortalMode(userRole);
        const enriched = await enrichUserData({
          ...res.user,
          companyId: res.user.companyId || org.companyId || 'comp-paneliya',
          companyName: res.user.companyName || org.companyName || 'Paneliya Technology Inc.',
        });
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
      return { success: false, message: err?.message || 'Invalid employee credentials. User not found in database.' };
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
  }): Promise<{ success: boolean; message?: string; user?: any; notInOrganization?: boolean }> => {
    const org = findOrganizationByEmail(data.email);

    try {
      const res = await api.register(data);
      if (res && res.user) {
        const userRole = res.user.role || data.role || 'EMPLOYEE';
        const targetPortal = determinePortalMode(userRole);
        const enriched = await enrichUserData({
          ...res.user,
          companyId: res.user.companyId || org.companyId || 'comp-paneliya',
          companyName: res.user.companyName || org.companyName || 'Paneliya Technology Inc.',
        });

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
      // Offline fallback: If employee was pre-added by admin, update their password and log in
      if (org.isMember && org.employee) {
        const emp = org.employee;
        emp.password = data.password;
        emp.firstName = data.firstName || emp.firstName;
        emp.lastName = data.lastName || emp.lastName;
        emp.phone = data.phone || emp.phone;

        const userRole = (data.role as Role) || org.role || 'EMPLOYEE';
        const targetPortal = determinePortalMode(userRole);
        const localUser: User = {
          id: emp.id,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          phone: emp.phone,
          role: userRole,
          departmentName: emp.departmentName,
          designationTitle: emp.designationTitle,
          avatarUrl: emp.avatarUrl,
          companyId: org.companyId,
          companyName: org.companyName,
        };
        setUser(localUser);
        setPortalModeState(targetPortal);
        setIsAuthenticated(true);
        localStorage.setItem('hrms_is_authenticated', 'true');
        localStorage.setItem('hrms_portal_mode', targetPortal);
        localStorage.setItem('hrms_current_role', userRole);
        localStorage.setItem('hrms_auth_user', JSON.stringify(localUser));
        localStorage.setItem('hrms_auth_token', `token_${localUser.id}`);
        localStorage.setItem('bearerToken', `token_${localUser.id}`);
        return { success: true, user: localUser };
      }

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

  const updateUserProfile = (updates: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem('hrms_auth_user', JSON.stringify(updated));
        window.dispatchEvent(new Event('hrms_auth_user_updated'));
      }
      return updated;
    });
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
        loginWithDemoAccount,
        registerUser,
        switchRole,
        updateUserProfile,
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
