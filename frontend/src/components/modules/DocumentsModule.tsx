'use client';

import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Clock, Plus, Shield, Search } from 'lucide-react';
import { EmployeeDocument } from '../../types/hrms';

export const DocumentsModule: React.FC = () => {
  const [category, setCategory] = useState('ALL');

  const documents: EmployeeDocument[] = [
    {
      id: 'doc-1',
      employeeId: 'emp-8',
      employeeName: 'Juan Hogan',
      title: 'Passport & Identity Verification',
      category: 'Identity',
      fileUrl: '/docs/juan_passport.pdf',
      fileSize: '2.4 MB',
      uploadDate: '2024-01-16',
      expiryDate: '2030-05-20',
      verificationStatus: 'Verified',
      verifiedBy: 'Sarah Jenkins',
    },
    {
      id: 'doc-2',
      employeeId: 'emp-8',
      employeeName: 'Juan Hogan',
      title: 'Signed Offer Letter & NDA Agreement',
      category: 'Offer Letter',
      fileUrl: '/docs/juan_offer.pdf',
      fileSize: '1.1 MB',
      uploadDate: '2024-01-15',
      verificationStatus: 'Verified',
      verifiedBy: 'Sarah Jenkins',
    },
    {
      id: 'doc-3',
      employeeId: 'emp-9',
      employeeName: 'Maci Guerra',
      title: 'W-4 Federal Tax Exemption Form 2026',
      category: 'Tax',
      fileUrl: '/docs/maci_w4.pdf',
      fileSize: '850 KB',
      uploadDate: '2024-02-02',
      verificationStatus: 'Verified',
      verifiedBy: 'Rachel Green',
    },
    {
      id: 'doc-4',
      employeeId: 'emp-15',
      employeeName: 'Adarson Miller',
      title: 'Degree Certificate - B.S. in Computer Science',
      category: 'Education',
      fileUrl: '/docs/adarson_degree.pdf',
      fileSize: '3.1 MB',
      uploadDate: '2024-03-02',
      verificationStatus: 'Verified',
      verifiedBy: 'Mike Chang',
    },
  ];

  const filtered = category === 'ALL' ? documents : documents.filter((d) => d.category === category);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Document Repository & Compliance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Secure employee documentation, tax filings, legal agreements, and HR verification audits
          </p>
        </div>

        <button
          onClick={() => alert('Document upload modal opening...')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            {['ALL', 'Identity', 'Tax', 'Offer Letter', 'Education'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                  category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{doc.title}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {doc.employeeName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{doc.fileSize}</td>
                  <td className="py-3.5 px-4 text-slate-400">{doc.uploadDate}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center gap-1 w-fit">
                      <CheckCircle className="w-3 h-3" /> {doc.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Downloading ${doc.title}...`)}
                      className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
