'use client';

import React, { useState } from 'react';
import { HardDrive, Plus, Laptop, Smartphone, Key, CheckCircle, RotateCcw } from 'lucide-react';
import { CompanyAsset } from '../../types/hrms';

export const AssetsModule: React.FC = () => {
  const [assets, setAssets] = useState<CompanyAsset[]>([
    {
      id: 'ast-1',
      assetCode: 'AST-MBP-001',
      name: 'MacBook Pro 16" M3 Max (36GB, 1TB)',
      category: 'Laptop',
      serialNumber: 'C02G901KMD6T',
      assignedToEmployeeName: 'John Deo',
      assignedDate: '2024-01-15',
      condition: 'Excellent',
      status: 'Assigned',
      purchaseDate: '2024-01-10',
    },
    {
      id: 'ast-2',
      assetCode: 'AST-MON-002',
      name: 'Dell UltraSharp 32" 4K USB-C Monitor',
      category: 'Monitor',
      serialNumber: 'CN-0P821L-74261',
      assignedToEmployeeName: 'Juan Hogan',
      assignedDate: '2024-02-01',
      condition: 'Excellent',
      status: 'Assigned',
      purchaseDate: '2024-01-20',
    },
    {
      id: 'ast-3',
      assetCode: 'AST-MBP-003',
      name: 'MacBook Pro 14" M3 Pro (18GB, 512GB)',
      category: 'Laptop',
      serialNumber: 'C02H102PMD7X',
      assignedToEmployeeName: 'Alex Mercer',
      assignedDate: '2024-02-10',
      condition: 'Good',
      status: 'Assigned',
      purchaseDate: '2024-02-05',
    },
    {
      id: 'ast-5',
      assetCode: 'AST-MBP-005',
      name: 'MacBook Air 15" M3 (16GB, 512GB)',
      category: 'Laptop',
      serialNumber: 'C02K991XMD8Z',
      condition: 'Excellent',
      status: 'Available',
      purchaseDate: '2024-08-15',
    },
  ]);

  const handleReturn = (id: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, assignedToEmployeeName: undefined, assignedDate: undefined, status: 'Available' }
          : a
      )
    );
    alert('Asset successfully returned to company inventory!');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Company Hardware & Asset Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track hardware allocation, serial numbers, warranty terms, and IT return clearance
          </p>
        </div>

        <button
          onClick={() => alert('New asset provision form opening...')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Register New Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
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

              <h4 className="font-extrabold text-sm text-slate-900 mt-3">
                {asset.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">SN: {asset.serialNumber}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-[11px]">Condition:</span>
                <span className="font-bold text-emerald-600">{asset.condition}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Assigned to:</span>
                <span className="font-bold text-slate-800">
                  {asset.assignedToEmployeeName || 'Unassigned (In IT Store)'}
                </span>
              </div>

              {asset.status === 'Assigned' && (
                <button
                  onClick={() => handleReturn(asset.id)}
                  className="w-full mt-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Process Return
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
