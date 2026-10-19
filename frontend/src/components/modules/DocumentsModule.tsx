'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  Plus,
  Shield,
  Search,
  UploadCloud,
  X,
  FileCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { EmployeeDocument, Employee } from '../../types/hrms';

export const DocumentsModule: React.FC = () => {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Identity');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useSocket();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, emps] = await Promise.all([api.getDocuments(), api.getEmployees()]);
      setDocuments(docs);
      setEmployees(emps);
      if (emps.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(emps[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', docTitle || selectedFile.name);
      formData.append('category', docCategory);
      formData.append('employeeId', selectedEmployeeId);

      const created = await api.uploadDocumentFile(formData);
      setDocuments((prev) => [created, ...prev]);

      showToast({
        title: 'Document Uploaded',
        message: `"${docTitle || selectedFile.name}" has been securely stored in compliance vault.`,
        type: 'success',
        module: 'documents',
      });

      setIsUploadOpen(false);
      setDocTitle('');
      setSelectedFile(null);
    } catch (err: any) {
      alert(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (id: string, status: 'Verified' | 'Rejected') => {
    try {
      await api.verifyDocument(id, status);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, verificationStatus: status } : d))
      );
      showToast({
        title: `Document ${status}`,
        message: `Document status was updated to ${status}.`,
        type: status === 'Verified' ? 'success' : 'warning',
        module: 'documents',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = documents.filter((doc) => {
    const matchesCat = category === 'ALL' || doc.category === category;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Document Compliance & Vault
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold flex items-center gap-1 border border-emerald-100">
              <Shield className="w-3.5 h-3.5" /> 256-bit Encrypted
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Secure employee documentation, tax filings, identity records, and HR verification audits
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
        {/* Filters & Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'Identity', 'Tax', 'Offer Letter', 'Education', 'Other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full font-semibold text-xs transition ${
                  category === cat
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or employee..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full border border-slate-200/80 bg-slate-50/60 focus:bg-white text-slate-900 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Document Title</th>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">File Size</th>
                <th className="py-2.5 px-3">Upload Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block leading-tight">{doc.title}</span>
                      <span className="text-[10px] font-normal text-slate-400 font-mono">
                        {doc.id}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">
                    {doc.employeeName}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {doc.fileSize}
                  </td>
                  <td className="py-3 px-3 text-slate-400">{doc.uploadDate}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[10px] flex items-center gap-1 w-fit ${
                        doc.verificationStatus === 'Verified'
                          ? 'bg-emerald-50 text-emerald-600'
                          : doc.verificationStatus === 'Pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {doc.verificationStatus === 'Verified' && <CheckCircle className="w-3 h-3" />}
                      {doc.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                        title="View / Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {doc.verificationStatus === 'Pending' && (
                        <button
                          onClick={() => handleVerify(doc.id, 'Verified')}
                          className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[10px]"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal Drawer */}
      {isUploadOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsUploadOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in cursor-pointer"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-100 dark:border-slate-800 shadow-2xl relative cursor-default">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Upload Compliance Document
                </h3>
                <p className="text-xs text-slate-500">
                  Select file (PDF, Word, Images up to 10MB)
                </p>
              </div>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passport Copy or W-4 Form"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Identity">Identity Document (Passport, National ID)</option>
                  <option value="Tax">Tax Exemption / W-4 Form</option>
                  <option value="Offer Letter">Signed Offer & Employment Agreement</option>
                  <option value="Education">Degree & Academic Certificates</option>
                  <option value="Medical">Medical Clearance & Health Insurance</option>
                  <option value="Other">Other Miscellaneous Document</option>
                </select>
              </div>

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!docTitle) setDocTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                />
                <FileCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                      Click to choose file or drag and drop
                    </span>
                    <span className="text-[10px] text-slate-400">PDF, DOC, PNG, JPG up to 10MB</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 transition"
                >
                  {uploading ? 'Uploading to Server...' : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
