'use client';

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Plus,
  Laptop,
  Smartphone,
  CheckCircle,
  RotateCcw,
  UserCheck,
  Search,
  Filter,
  X,
  Shield,
  Monitor,
  Tag,
} from 'lucide-react';
import { CompanyAsset, Employee } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const AssetsModule: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useSocket();

  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal: Register Asset
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CompanyAsset['category']>('Laptop');
  const [assetCode, setAssetCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState<CompanyAsset['condition']>('Excellent');
  const [purchaseDate, setPurchaseDate] = useState('2026-01-15');

  // Modal: Assign Asset
  const [assignModalAsset, setAssignModalAsset] = useState<CompanyAsset | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');

  // Modal: Return Asset
  const [returnModalAsset, setReturnModalAsset] = useState<CompanyAsset | null>(null);
  const [returnCondition, setReturnCondition] = useState<CompanyAsset['condition']>('Good');

  useEffect(() => {
    const isAnyModalOpen = isRegisterOpen || !!assignModalAsset || !!returnModalAsset;
    if (!isAnyModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRegisterOpen) setIsRegisterOpen(false);
        if (assignModalAsset) setAssignModalAsset(null);
        if (returnModalAsset) setReturnModalAsset(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRegisterOpen, assignModalAsset, returnModalAsset]);


  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsData, employeesData] = await Promise.all([
        api.getAssets(selectedCategory !== 'ALL' ? selectedCategory : undefined),
        api.getEmployees(),
      ]);
      setAssets(assetsData);
      setEmployees(employeesData);
      if (employeesData.length > 0 && !assignEmployeeId) {
        setAssignEmployeeId(employeesData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !assetCode.trim() || !serialNumber.trim()) {
      showToast({ type: 'warning', title: 'Missing details', message: 'Name, code, and serial number are required.' });
      return;
    }
    try {
      const created = await api.createAsset({
        name: name.trim(),
        category,
        assetCode: assetCode.trim().toUpperCase(),
        serialNumber: serialNumber.trim(),
        condition,
        purchaseDate,
      });

      setAssets((prev) => [created, ...prev]);
      showToast({
        type: 'success',
        title: 'Asset Registered',
        message: `${created.name} (${created.assetCode}) registered into company inventory.`,
      });

      setIsRegisterOpen(false);
      setName('');
      setAssetCode('');
      setSerialNumber('');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Registration Failed', message: err.message || 'Could not register asset.' });
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalAsset) return;
    try {
      const updated = await api.assignAsset(assignModalAsset.id, {
        employeeId: assignEmployeeId,
        actorName: `${user.firstName || 'Admin'} ${user.lastName || ''}`,
      });

      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast({
        type: 'success',
        title: 'Asset Allocated',
        message: `${updated.name} successfully assigned to employee.`,
      });

      setAssignModalAsset(null);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Allocation Failed', message: err.message || 'Could not assign asset.' });
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalAsset) return;
    try {
      const updated = await api.returnAsset(returnModalAsset.id, {
        condition: returnCondition,
        actorName: `${user.firstName || 'Admin'} ${user.lastName || ''}`,
      });

      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast({
        type: 'success',
        title: 'Asset Returned',
        message: `${updated.name} checked back into IT hardware store (${returnCondition} condition).`,
      });

      setReturnModalAsset(null);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Return Failed', message: err.message || 'Could not process return.' });
    }
  };

  const asQ = searchTerm.trim().toLowerCase();
  const filtered = assets.filter((a) => {
    return (
      !asQ ||
      (a.name || '').toLowerCase().includes(asQ) ||
      (a.assetCode || '').toLowerCase().includes(asQ) ||
      (a.serialNumber || '').toLowerCase().includes(asQ) ||
      (a.category || '').toLowerCase().includes(asQ) ||
      (a.assignedToEmployeeName || '').toLowerCase().includes(asQ)
    );
  });

  return (
    <div className="space-y-5 w-full animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold">
            {assets.length} Tracked Items
          </span>
        </div>

        <button
          onClick={() => {
            setAssetCode(`AST-${Math.floor(100 + Math.random() * 900)}`);
            setIsRegisterOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Asset</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {['ALL', 'Laptop', 'Monitor', 'Mobile', 'Access Card', 'Other'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code, name, serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-7 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-200">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">No assets found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'ALL'
                ? 'No company assets match your search criteria.'
                : 'No company assets currently registered. Click "Register New Asset" to add hardware or equipment.'}
            </p>
          </div>
        ) : (
          filtered.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                    {asset.assetCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      asset.status === 'Assigned'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 mt-3 line-clamp-2">
                  {asset.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">SN: {asset.serialNumber}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Condition:</span>
                  <span className="font-bold text-emerald-600">{asset.condition}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Assigned to:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[130px]">
                    {asset.assignedToEmployeeName || 'IT Storage'}
                  </span>
                </div>

                {asset.status === 'Assigned' ? (
                  <button
                    onClick={() => {
                      setReturnModalAsset(asset);
                      setReturnCondition(asset.condition || 'Good');
                    }}
                    className="w-full mt-2 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Process Return</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAssignModalAsset(asset);
                      if (employees.length > 0) setAssignEmployeeId(employees[0].id);
                    }}
                    className="w-full mt-2 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign to Staff</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Register New Asset */}
      {isRegisterOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRegisterOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <HardDrive className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Register Company Asset
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Add hardware or equipment to company inventory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterAsset} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset Name / Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MacBook Pro 16-inch M3 Max (36GB RAM, 1TB SSD)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Mobile">Mobile Phone</option>
                    <option value="Access Card">Access Card</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asset Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., AST-101"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., C02G879QMD6T"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                  >
                    <option value="Excellent">Excellent (Like New)</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Needs Repair / Damaged</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                />
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Asset */}
      {assignModalAsset && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssignModalAsset(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Assign Asset to Employee
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Allocate inventory item to staff member
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalAsset(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="font-bold text-slate-900">{assignModalAsset.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {assignModalAsset.assetCode} • SN: {assignModalAsset.serialNumber}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Employee</label>
                  <select
                    value={assignEmployeeId}
                    onChange={(e) => setAssignEmployeeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.departmentName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setAssignModalAsset(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Process Return */}
      {returnModalAsset && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setReturnModalAsset(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Process Hardware Return
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    De-allocate and return to inventory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalAsset(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="font-bold text-slate-900">{returnModalAsset.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Assigned to: <span className="font-semibold text-slate-700">{returnModalAsset.assignedToEmployeeName}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Return Inspection Condition</label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Excellent">Excellent (No defects)</option>
                    <option value="Good">Good (Normal wear)</option>
                    <option value="Fair">Fair (Scratching / usable)</option>
                    <option value="Damaged">Damaged (Requires IT servicing)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setReturnModalAsset(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  Confirm Return to IT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
