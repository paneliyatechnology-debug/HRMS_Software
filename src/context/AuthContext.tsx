'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/hrms';
import { api } from '../lib/api';
import { findOrganizationByEmail } from '../lib/companyService';
import { purgeLocalBusinessData } from '../lib/storageCleanup';
import { getCookie, setCookie, removeCookie, purgeAuthLocalStorage } from '../lib/cookies';

export type PortalMode = 'admin' | 'employee';

export const isUserAdminRole = (role?: string): boolean => {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return (
    normalized === 'SUPER_ADMIN' ||
    normalized === 'ADMIN' ||
    normalized === 'HR' ||
    normalized === 'HR_ADMIN' ||
    normalized === 'COMPANY_ADMIN' ||
    normalized === 'ORG_ADMIN'
  );
};

export const isHrRole = (role?: string): boolean => {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return normalized === 'HR' || normalized === 'HR_ADMIN';
};

export const determinePortalMode = (role?: string): PortalMode => {
  return isUserAdminRole(role) ? 'admin' : 'employee';
};

function industryModuleKeys(industry: { modules?: { key?: string }[] } | null | undefined) {
  if (!Array.isArray(industry?.modules)) return [];
  return industry.modules.map((module) => String(module?.key || '')).filter(Boolean);
}

export function portalFromPermissions(permissions?: { key: string }[]): PortalMode | null {
  const keys = new Set((permissions || []).map((permission) => permission.key));
  if (keys.has('workspace.admin')) return 'admin';
  if (keys.has('workspace.hr')) return 'admin';
  if (keys.has('workspace.employee')) return 'employee';
  return null;
}

const emptyUser: User = {
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  role: 'EMPLOYEE',
  avatarUrl: '',
};

export interface DemoUserAccount {
  key: 'admin' | 'employee';
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
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string; role?: string; notInOrganization?: boolean }>;
  loginAsAdmin: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; message?: string; notInOrganization?: boolean }>;
  loginAsEmployee: (codeOrEmail: string, passwordOrPin?: string) => Promise<{ success: boolean; message?: string; notInOrganization?: boolean }>;
  loginWithDemoAccount: (accountKey: 'admin' | 'employee') => Promise<{ success: boolean; role?: string; message?: string }>;
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
  registerCompanyAccount: (data: {
    companyName: string;
    companyLegalName?: string;
    gstNumber?: string;
    gstin?: string;
    industry?: string;
    industrySector?: string;
    address?: string;
    officeAddress?: string;
    city?: string;
    state?: string;
    firstName: string;
    lastName: string;
    email: string;
    officialEmail?: string;
    phone: string;
    mobileNumber?: string;
    password?: string;
    confirmPassword?: string;
  }) => Promise<{ success: boolean; message?: string; user?: any; company?: any }>;
  switchRole: (newRole: Role) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  hasPermission: (action: string) => boolean;
  allUsers: User[];
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    if (typeof window !== 'undefined') {
      const cachedUserStr = getCookie('hrms_auth_user');
      if (cachedUserStr) {
        try {
          const parsed = JSON.parse(cachedUserStr);
          if (parsed && parsed.id) return parsed;
        } catch {}
      }
    }
    return emptyUser;
  });
  const [portalMode, setPortalModeState] = useState<PortalMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = getCookie('hrms_portal_mode');
      if (savedMode === 'admin' || savedMode === 'employee') return savedMode;
    }
    return 'employee';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedAuth = getCookie('hrms_is_authenticated');
      const cachedUserStr = getCookie('hrms_auth_user');
      return storedAuth === 'true' && Boolean(cachedUserStr);
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedAuth = getCookie('hrms_is_authenticated');
      const cachedUserStr = getCookie('hrms_auth_user');
      if (storedAuth === 'true' && Boolean(cachedUserStr)) return false;
    }
    return true;
  });

  const enrichUserData = async (baseUser: any) => {
    if (!baseUser) return baseUser;
    let enriched = { ...baseUser };
    if (enriched.id && (enriched.companyId || enriched.role === 'ADMIN')) {
      return enriched;
    }
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
    // Migration: If any legacy auth items exist in localStorage, migrate them to cookies and purge localStorage
    if (typeof window !== 'undefined') {
      try {
        const legacyToken = localStorage.getItem('hrms_auth_token') || localStorage.getItem('bearerToken');
        if (legacyToken && !getCookie('hrms_auth_token')) {
          setCookie('hrms_auth_token', legacyToken);
          setCookie('bearerToken', legacyToken);
        }
        const legacyAuth = localStorage.getItem('hrms_is_authenticated');
        if (legacyAuth && !getCookie('hrms_is_authenticated')) {
          setCookie('hrms_is_authenticated', legacyAuth);
        }
        const legacyUser = localStorage.getItem('hrms_auth_user');
        if (legacyUser && !getCookie('hrms_auth_user')) {
          setCookie('hrms_auth_user', legacyUser);
        }
        const legacyRole = localStorage.getItem('hrms_current_role');
        if (legacyRole && !getCookie('hrms_current_role')) {
          setCookie('hrms_current_role', legacyRole);
        }
        const legacyPortal = localStorage.getItem('hrms_portal_mode');
        if (legacyPortal && !getCookie('hrms_portal_mode')) {
          setCookie('hrms_portal_mode', legacyPortal);
        }

        // Purge all legacy auth keys and business caches from localStorage
        purgeAuthLocalStorage();
        purgeLocalBusinessData();

        // Purge any stale demo or fake offline sessions from cookies
        const savedToken = getCookie('hrms_auth_token') || '';
        if (
          savedToken.startsWith('demo_token_') ||
          savedToken.startsWith('token_admin-') ||
          savedToken.startsWith('token_emp-')
        ) {
          removeCookie('hrms_auth_token');
          removeCookie('bearerToken');
          removeCookie('hrms_is_authenticated');
          removeCookie('hrms_auth_user');
          removeCookie('hrms_current_role');
          removeCookie('hrms_portal_mode');
        }
      } catch {}
    }

    const storedAuth = typeof window !== 'undefined' ? getCookie('hrms_is_authenticated') : null;
    const cachedUserStr = typeof window !== 'undefined' ? getCookie('hrms_auth_user') : null;

    if (storedAuth === 'true' && cachedUserStr) {
      try {
        const cachedUser = JSON.parse(cachedUserStr);
        if (cachedUser?.id) {
          const allowedPortal = portalFromPermissions(cachedUser.permissions) || 'employee';
          setUser(cachedUser);
          setIsAuthenticated(true);
          setPortalModeState(allowedPortal);
          api.getProfile()
            .then((profile) => {
              if (!profile?.user) return;
              const role = profile.user.role || cachedUser.role;
              const permissions = profile.permissions || [];
              const portal = portalFromPermissions(permissions) || 'employee';
              const companyProfile = profile.company || null;
              const dynamicModules =
                profile.allowedModules ||
                profile.user?.allowedModules ||
                profile.modules ||
                profile.user?.modules ||
                cachedUser.allowedModules;
              const next = {
                ...cachedUser,
                ...profile.user,
                industryModules: industryModuleKeys(profile.industry),
                allowedModules: dynamicModules,
                modules: profile.modules || profile.user?.modules || cachedUser.modules,
                permissions: permissions.length ? permissions : cachedUser.permissions || [],
                companyProfile,
                companyName: companyProfile?.name || profile.user?.companyName || cachedUser.companyName || '',
              };
              setUser(next);
              setPortalModeState(portal);
              setCookie('hrms_auth_user', JSON.stringify(next));
              setCookie('hrms_current_role', role);
              setCookie('hrms_portal_mode', portal);
            })
            .catch(() => {});
        }
      } catch {}
    } else {
      setUser(emptyUser);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const setPortalMode = (mode: PortalMode) => {
    const allowed = portalFromPermissions(user?.permissions) || 'employee';
    const next = mode === allowed ? mode : allowed;
    setPortalModeState(next);
    setCookie('hrms_portal_mode', next);
    purgeAuthLocalStorage();
  };

  // 1-Click Instant Demo Login (Disabled in production mode)
  const loginWithDemoAccount = async (
    _accountKey: 'admin' | 'employee'
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
        const token = res.token || res.accessToken || res.data?.token || res.data?.accessToken;
        if (token) {
          setCookie('hrms_auth_token', token);
          setCookie('bearerToken', token);
        }
        const profile = await api.getProfile();
        const userRole = profile?.user?.role || res.user.role || org.role || 'EMPLOYEE';
        const permissions = profile?.permissions || [];
        const targetPortal = portalFromPermissions(permissions) || 'employee';
        const companyProfile = profile?.company || null;
        const dynamicModules =
          profile?.allowedModules ||
          profile?.user?.allowedModules ||
          profile?.modules ||
          profile?.user?.modules;
        const enriched = await enrichUserData({
          ...res.user,
          ...profile?.user,
          industryModules: industryModuleKeys(profile?.industry),
          allowedModules: dynamicModules,
          modules: profile?.modules || profile?.user?.modules,
          permissions,
          companyProfile,
          companyId: profile?.user?.companyId || res.user.companyId || org.companyId || '',
          companyName: companyProfile?.name || profile?.user?.companyName || res.user.companyName || org.companyName || '',
        });

        setUser(enriched);
        setPortalModeState(targetPortal);
        setIsAuthenticated(true);
        setCookie('hrms_is_authenticated', 'true');
        setCookie('hrms_portal_mode', targetPortal);
        setCookie('hrms_current_role', userRole);
        setCookie('hrms_auth_user', JSON.stringify(enriched));
        purgeAuthLocalStorage();
        return { success: true, role: userRole };
      }
      return { success: false, message: res?.message || 'Invalid credentials.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Invalid credentials. User not found in database.' };
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
        const token = res.token || res.accessToken || res.data?.token || res.data?.accessToken;
        if (token) {
          setCookie('hrms_auth_token', token);
          setCookie('bearerToken', token);
        }
        const userRole = res.user.role || org.role || 'ADMIN';
        if (!isUserAdminRole(userRole)) {
          return { success: false, message: 'Access denied: You are registered as an Employee. Please use the Staff Employee Login tab.' };
        }

        const enriched = await enrichUserData({
          ...res.user,
          companyId: res.user.companyId || org.companyId || '',
          companyName: res.user.companyName || org.companyName || (res.user.companyId ? 'My Organization' : ''),
        });
        const targetPortal = determinePortalMode(userRole);
        setUser(enriched);
        setPortalModeState(targetPortal);
        setIsAuthenticated(true);
        setCookie('hrms_is_authenticated', 'true');
        setCookie('hrms_portal_mode', targetPortal);
        setCookie('hrms_current_role', userRole);
        setCookie('hrms_auth_user', JSON.stringify(enriched));
        purgeAuthLocalStorage();
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
        const token = res.token || res.accessToken || res.data?.token || res.data?.accessToken;
        if (token) {
          setCookie('hrms_auth_token', token);
          setCookie('bearerToken', token);
        }
        const userRole = res.user.role || org.role || 'EMPLOYEE';
        const targetPortal = determinePortalMode(userRole);
        const enriched = await enrichUserData({
          ...res.user,
          companyId: res.user.companyId || org.companyId || '',
          companyName: res.user.companyName || org.companyName || (res.user.companyId ? 'My Organization' : ''),
        });
        setUser(enriched);
        setPortalModeState(targetPortal);
        setIsAuthenticated(true);
        setCookie('hrms_is_authenticated', 'true');
        setCookie('hrms_portal_mode', targetPortal);
        setCookie('hrms_current_role', userRole);
        setCookie('hrms_auth_user', JSON.stringify(enriched));
        purgeAuthLocalStorage();
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
          companyId: res.user.companyId || org.companyId || '',
          companyName: res.user.companyName || org.companyName || (res.user.companyId ? 'My Organization' : ''),
        });

        setUser(enriched);
        setPortalModeState(targetPortal);
        setIsAuthenticated(true);
        setCookie('hrms_is_authenticated', 'true');
        setCookie('hrms_portal_mode', targetPortal);
        setCookie('hrms_current_role', userRole);
        setCookie('hrms_auth_user', JSON.stringify(enriched));
        purgeAuthLocalStorage();

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

  const registerCompanyAccount = async (data: {
    companyName: string;
    companyLegalName?: string;
    gstNumber?: string;
    gstin?: string;
    industry?: string;
    industrySector?: string;
    address?: string;
    officeAddress?: string;
    city?: string;
    state?: string;
    firstName: string;
    lastName: string;
    email: string;
    officialEmail?: string;
    phone: string;
    mobileNumber?: string;
    password?: string;
    confirmPassword?: string;
  }): Promise<{ success: boolean; message?: string; user?: any; company?: any }> => {
    try {
      const res = await api.registerCompany({
        companyName: data.companyName.trim(),
        email: (data.officialEmail || data.email).trim().toLowerCase(),
        phone: (data.mobileNumber || data.phone || '').trim(),
        gstNumber: (data.gstNumber || data.gstin || '').trim(),
        industrySector: (data.industrySector || data.industry || '').trim(),
        state: (data.state || '').trim(),
        city: (data.city || '').trim(),
        address: (data.address || data.officeAddress || '').trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      });

      if (!res?.company) {
        return { success: false, message: 'Company registration failed. Please try again.' };
      }

      return {
        success: true,
        message: res.message || 'Company registered. The login password was sent to the company email.',
        user: res.admin,
        company: res.company,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Company registration failed. Please try again.',
      };
    }
  };

  const switchRole = (newRole: Role) => {
    if (!user || !user.id) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    setCookie('hrms_current_role', newRole);
    setCookie('hrms_auth_user', JSON.stringify(updated));
    purgeAuthLocalStorage();
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        setCookie('hrms_auth_user', JSON.stringify(updated));
        purgeAuthLocalStorage();
        window.dispatchEvent(new Event('hrms_auth_user_updated'));
      }
      return updated;
    });
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setIsAuthenticated(false);
    setUser(emptyUser);
    removeCookie('hrms_is_authenticated');
    removeCookie('hrms_current_role');
    removeCookie('hrms_portal_mode');
    removeCookie('hrms_auth_user');
    removeCookie('hrms_auth_token');
    removeCookie('bearerToken');
    purgeAuthLocalStorage();
    window.dispatchEvent(new Event('hrms_auth_logout'));
  };

  const hasPermission = (action: string): boolean => {
    if (!user || !user.role) return false;
    const role = String(user.role).trim().toUpperCase();
    if (['SUPER_ADMIN', 'ADMIN', 'HR', 'HR_ADMIN', 'COMPANY_ADMIN'].includes(role)) return true;

    if (role === 'MANAGER') {
      if (action === 'APPROVE_LEAVES') return true;
      if (action === 'VIEW_TEAM_REPORTS') return true;
      if (action === 'MANAGE_TASKS') return true;
    }

    switch (action) {
      case 'MANAGE_EMPLOYEES':
      case 'PROCESS_PAYROLL':
      case 'APPROVE_LEAVES':
      case 'MANAGE_RECRUITMENT':
      case 'MANAGE_ASSETS':
      case 'VIEW_AUDIT_LOGS':
      case 'VIEW_ALL_REPORTS':
        return false;
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
        loginAsAdmin,
        loginAsEmployee,
        loginWithDemoAccount,
        registerUser,
        registerCompanyAccount,
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
