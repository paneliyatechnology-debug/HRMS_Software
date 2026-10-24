'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Crown,
  Award,
  Briefcase,
  Users,
  User,
  Target,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Employee, Role } from '../../types/hrms';
import { ROLE_DEFINITIONS, getRoleDefinition, RoleDefinition } from '../../lib/roleConfig';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

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
  const { showToast } = useSocket();
  const [selectedRole, setSelectedRole] = useState<Role>('EMPLOYEE');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setSelectedRole((employee.role as Role) || 'EMPLOYEE');
      setErrorMsg(null);
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const currentRoleDef = getRoleDefinition(employee.role || 'EMPLOYEE');
  const activeRoleDef = getRoleDefinition(selectedRole);

  const getRoleIcon = (name: RoleDefinition['iconName'], className: string) => {
    switch (name) {
      case 'Crown':
        return <Crown className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'CreditCard':
        return <CreditCard className={className} />;
      default:
        return <User className={className} />;
    }
  };

  const handleSubmit = async () => {
    if (!employee) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.updateEmployee(employee.id, {
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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col border border-slate-100 overflow-hidden cursor-default transition-all my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
              {employee.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={employee.firstName}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span>
                  {employee.firstName[0]}
                  {employee.lastName ? employee.lastName[0] : ''}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Role Permission Management
                </span>
                <span className="text-slate-400 text-xs">#{employee.employeeCode}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                Change Role: {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>Current Role:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] border ${currentRoleDef.badgeClass}`}
                >
                  {getRoleIcon(currentRoleDef.iconName, 'w-3 h-3')}
                  {currentRoleDef.label}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{employee.designationTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Role Selection */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select New Access Role
            </label>
            <p className="text-xs text-slate-500 mb-4">
              Changing an employee’s role immediately adjusts their system permissions, dashboard modules, and approval capabilities.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_DEFINITIONS.map((def) => {
                const isSelected = selectedRole === def.role;
                const isCurrent = (employee.role || 'EMPLOYEE') === def.role;

                return (
                  <div
                    key={def.role}
                    onClick={() => setSelectedRole(def.role)}
                    className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${def.bgLight} ${def.borderClass} ${def.textColor}`}
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
                            ? 'bg-indigo-600 border-indigo-600 text-white'
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
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
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
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || selectedRole === (employee.role || 'EMPLOYEE')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Role...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Confirm & Update Role</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
