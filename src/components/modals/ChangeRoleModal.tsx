'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Crown,
  Users,
  User,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Employee, Role } from '../../types/hrms';
import { useModalOverlay } from '../../lib/useModalOverlay';
import { ASSIGNABLE_ROLE_DEFINITIONS, getRoleDefinition, RoleDefinition } from '../../lib/roleConfig';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess?: (updatedEmployee: Employee) => void;
}

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [selectedRole, setSelectedRole] = useState<Role>('EMPLOYEE');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSelf = Boolean(
    employee &&
      user &&
      (Boolean(employee.email && user.email && employee.email.toLowerCase() === user.email.toLowerCase()) ||
        Boolean(user.employeeId && (employee.id === user.employeeId || (employee as any).employeeId === user.employeeId)) ||
        Boolean(user.id && (employee.id === user.id || (employee as any).userId === user.id)))
  );

  useEffect(() => {
    if (employee) {
      const initialRole = (employee.role as Role) || 'EMPLOYEE';
      setSelectedRole(initialRole === 'SUPER_ADMIN' ? 'ADMIN' : initialRole);
      setErrorMsg(null);
    }
  }, [employee, isOpen]);

  useModalOverlay({ isOpen, onClose });

  if (!isOpen || !employee) return null;

  const currentRoleDef = getRoleDefinition(employee.role || 'EMPLOYEE');
  const activeRoleDef = getRoleDefinition(selectedRole);

  const getRoleIcon = (name: RoleDefinition['iconName'], className: string) => {
    switch (name) {
      case 'Crown':
        return <Crown className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Users':
        return <Users className={className} />;
      default:
        return <User className={className} />;
    }
  };

  const handleSubmit = async () => {
    if (!employee) return;
    if (isSelf) {
      setErrorMsg('Administrators cannot change their own system role.');
      return;
    }
    if (selectedRole === 'SUPER_ADMIN') {
      setErrorMsg('Super Admin role cannot be assigned to any user.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await api.updateEmployee(employee.id, {
        role: selectedRole,
      });

      const updatedEmp: Employee = {
        ...employee,
        role: selectedRole,
      };

      showToast({
        type: 'success',
        title: 'Role Changed Successfully',
        message: `${employee.firstName} ${employee.lastName}'s role has been updated to "${activeRoleDef.label}".`,
      });

      if (onSuccess) {
        onSuccess(updatedEmp);
      }
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to update employee role. Please try again.';
      setErrorMsg(msg);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Change Role: {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                <span>Current Role:</span>
                <span className={`inline-flex items-center gap-1 font-semibold ${currentRoleDef.textColor}`}>
                  {getRoleIcon(currentRoleDef.iconName, 'w-3 h-3')}
                  {currentRoleDef.label}
                </span>
                <span>•</span>
                <span>{employee.designationTitle || 'Staff'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Role Selection */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Select New Access Role
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Changing an employee’s role immediately adjusts their system permissions, dashboard modules, and approval capabilities.
            </p>

            {isSelf && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Administrators cannot change their own system role to prevent accidental account lockout.</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ASSIGNABLE_ROLE_DEFINITIONS.map((def) => {
                const isSelected = selectedRole === def.role;
                const isCurrent = (employee.role || 'EMPLOYEE') === def.role;

                return (
                  <div
                    key={def.role}
                    onClick={() => setSelectedRole(def.role)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${def.bgLight} ${def.borderClass} ${def.textColor}`}
                        >
                          {getRoleIcon(def.iconName, 'w-4 h-4')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">{def.label}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {def.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Summary Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-700">Selected Role: </span>
                <span className="font-bold text-slate-900">{activeRoleDef.label}</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  {activeRoleDef.description}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || isSelf || selectedRole === (employee.role || 'EMPLOYEE')}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Role...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Confirm &amp; Update Role</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
