'use client';

import React, { useState, useEffect, useRef } from 'react';
<<<<<<< HEAD
import { useCompanyLive } from '../../lib/useCompanyLive';
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
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
<<<<<<< HEAD
  Trash2,
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  Building2,
  Crown,
  Mail,
  Phone,
  MapPin,
  UserCheck,
<<<<<<< HEAD
  RotateCcw,
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { EmployeeDocument, Employee } from '../../types/hrms';

interface DocumentsModuleProps {
  portalMode?: 'employee' | 'admin';
  currentEmployeeId?: string;
}

export const DocumentsModule: React.FC<DocumentsModuleProps> = ({
  portalMode = 'admin',
  currentEmployeeId,
}) => {
  const { user } = useAuth();
  const myEmpId = currentEmployeeId || user.employeeId || user.id || '';

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  useEffect(() => {
    if (!isUploadOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUploadOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUploadOpen]);

  const [uploading, setUploading] = useState(false);

  // Company and Owner Details State
  const [companySettings, setCompanySettings] = useState({
    name: '',
    tagline: '',
    ownerName: '',
    ownerRole: 'Executive Operations & HR',
    ownerEmail: '',
    supportEmail: '',
    phone: '',
    address: '',
    taxId: '',
  });

  // Form State
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Identity');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(myEmpId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useSocket();

  useEffect(() => {
<<<<<<< HEAD
    if (portalMode === 'employee' && !user?.id && !myEmpId) {
      return;
    }
    loadData();
  }, [portalMode, myEmpId, user?.id]);
=======
    loadData();
  }, [portalMode, myEmpId]);
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35

  const loadData = async () => {
    setLoading(true);
    try {
<<<<<<< HEAD
      const [docs, emps] = await Promise.all([
        api.getDocuments(portalMode === 'employee' ? myEmpId : undefined),
        portalMode === 'admin' ? api.getEmployees().catch(() => []) : Promise.resolve([]),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      if (Array.isArray(emps) && emps.length > 0) {
        setEmployees(emps);
        if (!selectedEmployeeId) {
          setSelectedEmployeeId(emps[0].id);
        }
      }
      if (portalMode === 'employee') {
        setSelectedEmployeeId(myEmpId);
      }
    } catch (err) {
      console.error('[DocumentsModule] load error:', err);
=======
      const [docs, emps, settings, myComp] = await Promise.all([
        api.getDocuments(portalMode === 'employee' ? myEmpId : undefined),
        api.getEmployees(),
        api.getSettings().catch(() => null),
        api.getMyCompany().catch(() => null),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setEmployees(Array.isArray(emps) ? emps : []);
      if (myComp) {
        setCompanySettings((prev) => ({
          ...prev,
          name: myComp.name || prev.name,
          tagline: myComp.industry || prev.tagline,
          taxId: myComp.gstin || myComp.taxId || prev.taxId,
          supportEmail: myComp.email || prev.supportEmail,
          phone: myComp.phone || prev.phone,
          address: myComp.address || prev.address,
        }));
      } else if (settings?.company) {
        setCompanySettings((prev) => ({
          ...prev,
          name: settings.company.name || prev.name,
          tagline: settings.company.tagline || prev.tagline,
          taxId: settings.company.taxId || prev.taxId,
          supportEmail: settings.company.supportEmail || prev.supportEmail,
          phone: settings.company.phone || prev.phone,
          address: settings.company.address || prev.address,
        }));
      }
      if (portalMode === 'employee') {
        setSelectedEmployeeId(myEmpId);
      } else if (emps.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(emps[0].id);
      }
    } catch (err) {
      console.error(err);
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useCompanyLive(['documents', 'employees'], () => {
    void loadData();
  });

=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
<<<<<<< HEAD
      formData.append('title', (docTitle || selectedFile.name).trim());
      formData.append('userId', selectedEmployeeId || (portalMode === 'employee' ? myEmpId : '') || '');
      formData.append('companyId', user?.companyId || '');
      formData.append('file', selectedFile);

      const created = await api.createDocument(formData);
      try {
        const fresh = await api.getDocuments(portalMode === 'employee' ? myEmpId : undefined);
        if (Array.isArray(fresh) && fresh.length > 0) {
          setDocuments(fresh);
        } else if (created && created.id) {
          setDocuments((prev) => [created, ...prev]);
        }
      } catch {
        if (created && created.id) {
          setDocuments((prev) => [created, ...prev]);
        }
      }
=======
      formData.append('file', selectedFile);
      formData.append('title', docTitle || selectedFile.name);
      formData.append('category', docCategory);
      formData.append('employeeId', selectedEmployeeId);

      const created = await api.uploadDocumentFile(formData);
      setDocuments((prev) => [created, ...prev]);
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35

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

<<<<<<< HEAD
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      showToast({
        title: 'Document Deleted',
        message: `"${title}" has been deleted.`,
        type: 'success',
        module: 'documents',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const docQ = searchTerm.trim().toLowerCase();
  const filtered = documents.filter((doc: any) => {
    if (portalMode === 'employee') {
      const isMine =
        !doc.employeeId ||
        doc.employeeId === myEmpId ||
        doc.userId === myEmpId ||
        doc.employeeId === user?.id ||
        doc.userId === user?.id ||
        doc.employeeId === user?.employeeId;
      if (!isMine) return false;
    }
    const catLower = category.toLowerCase();
    const matchesCat =
      category === 'ALL' ||
      (doc.category || '').toLowerCase() === catLower ||
      (doc.fileType || '').toLowerCase() === catLower ||
      (doc.title || '').toLowerCase().includes(catLower);

    const matchesSearch =
      !docQ ||
      (doc.title || '').toLowerCase().includes(docQ) ||
      (doc.fileName || '').toLowerCase().includes(docQ) ||
      (doc.userName || '').toLowerCase().includes(docQ) ||
      (doc.employeeName || '').toLowerCase().includes(docQ) ||
      (doc.uploadedByName || '').toLowerCase().includes(docQ) ||
      (doc.companyName || '').toLowerCase().includes(docQ);

=======
  const docQ = searchTerm.trim().toLowerCase();
  const filtered = documents.filter((doc) => {
    if (portalMode === 'employee' && doc.employeeId && doc.employeeId !== myEmpId) {
      return false;
    }
    const matchesCat = category === 'ALL' || (doc.category || '').toLowerCase() === category.toLowerCase();
    const matchesSearch =
      !docQ ||
      (doc.title || '').toLowerCase().includes(docQ) ||
      (doc.employeeName || '').toLowerCase().includes(docQ) ||
      (doc.category || '').toLowerCase().includes(docQ);
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
    return matchesCat && matchesSearch;
  });

  return (
<<<<<<< HEAD
    <div className="space-y-5 w-full animate-in fade-in select-none">
      {/* Top Action */}
      <div className="flex items-center justify-between gap-4">
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold flex items-center gap-1 border border-emerald-100">
          <Shield className="w-3.5 h-3.5" /> 256-bit Encrypted Vault
        </span>
        <button
          id="btn-add-document"
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Add Document</span>
=======
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Document</span>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
        </button>
      </div>

      {/* EMPLOYEE VIEW: Official Company Details & Owner Information Card */}
<<<<<<< HEAD
      {portalMode === 'employee' && (
<<<<<<< HEAD
=======
      {portalMode === 'employee' && (companySettings.name || companySettings.ownerName) && (
>>>>>>> 0d10fa3b585569ce8a42ed27dde970aafc01b11f
        <div className="bg-gradient-to-br from-slate-900 via-[#212529] to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
=======
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
          <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
            <Building2 className="w-32 h-32 text-white" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
<<<<<<< HEAD
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-xl text-white shadow-md shrink-0">
=======
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center font-black text-xl text-white shadow-md shrink-0">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {companySettings.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Verified Employer
                    </span>
                  </div>
<<<<<<< HEAD
                  <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
=======
                  <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                    {companySettings.tagline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 backdrop-blur-xs flex items-center gap-1.5">
<<<<<<< HEAD
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
=======
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                  Tax ID: {companySettings.taxId}
                </span>
              </div>
            </div>

            {/* Grid of Company & Owner Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
              {/* Owner Name */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-extrabold flex items-center gap-1 mb-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Company Owner & Founder
                </span>
                <p className="font-bold text-white text-sm">
                  {companySettings.ownerName}
                </p>
                <span className="text-[10px] text-slate-300 block">{companySettings.ownerRole}</span>
<<<<<<< HEAD
                <span className="text-[10px] text-indigo-300 font-mono">{companySettings.ownerEmail}</span>
=======
                <span className="text-[10px] text-emerald-300 font-mono">{companySettings.ownerEmail}</span>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              </div>

              {/* Registered Address */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
<<<<<<< HEAD
                <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Registered Headquarters
=======
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Registered Headquarters
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                </span>
                <p className="font-semibold text-white truncate" title={companySettings.address}>
                  {companySettings.address}
                </p>
                <span className="text-[10px] text-slate-300">Surat, Gujarat &bull; Corporate Office</span>
              </div>

              {/* Official Contact */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
<<<<<<< HEAD
                <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> HR & Helpdesk Contact
=======
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" /> HR & Helpdesk Contact
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                </span>
                <p className="font-semibold text-white truncate">
                  {companySettings.supportEmail}
                </p>
                <span className="text-[10px] text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {companySettings.phone}
                </span>
              </div>

              {/* Your Employee Record Under Owner */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Your Employment Status
                </span>
                <p className="font-semibold text-white truncate">
                  {user.firstName || 'Employee'} {user.lastName || ''}
                </p>
                <span className="text-[10px] text-emerald-300 font-medium block">
                  Active Staff &bull; ID: {(user as any).employeeCode || user.employeeId || 'EMP'}
                </span>
                <span className="text-[10px] text-slate-300">Employed under {companySettings.ownerName}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
        {/* Filters & Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'Identity', 'Tax', 'Offer Letter', 'Education', 'Other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
<<<<<<< HEAD
                className={`px-3 py-1 rounded-full font-semibold text-xs transition ${
                  category === cat
                    ? 'bg-blue-50 text-blue-600 font-bold'
=======
                className={`px-3 py-1 rounded-full font-semibold text-xs transition cursor-pointer ${
                  category === cat
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
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
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-full border border-slate-200/80 bg-slate-50/60 focus:bg-white text-slate-900 focus:outline-hidden"
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

<<<<<<< HEAD
        {/* Mobile Card View (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-10 px-4 text-center text-slate-400 text-xs">
              {documents.length === 0 ? 'No Compliance Documents Uploaded' : 'No Matching Documents'}
            </div>
          ) : (
            filtered.map((doc: any) => (
              <div key={`mob-${doc.id}`} className="py-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{doc.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {doc.userName || doc.employeeName || '—'} • {doc.uploadDate}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase shrink-0 border border-slate-200">
                    {doc.fileType || (doc.mimeType ? doc.mimeType.split('/').pop()?.toUpperCase() : 'PDF')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold text-[10px] flex items-center gap-1 ${
                      doc.verificationStatus === 'Verified' || doc.verificationStatus === 'Active'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : doc.verificationStatus === 'Pending'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    {doc.verificationStatus || 'Verified'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[38px] px-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </a>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={doc.fileName || doc.title}
                      className="min-h-[38px] px-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    {portalMode === 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="min-h-[38px] px-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Documents Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
=======
        {/* Documents Table */}
        <div className="overflow-x-auto">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Document Title</th>
                <th className="py-2.5 px-3">Employee</th>
<<<<<<< HEAD
                <th className="py-2.5 px-3">Uploaded By</th>
                <th className="py-2.5 px-3">Format</th>
=======
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">File Size</th>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                <th className="py-2.5 px-3">Upload Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
<<<<<<< HEAD
                    {documents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2.5 py-4 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-2xs">
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">No Compliance Documents Uploaded</p>
                        <p className="text-xs text-slate-400">Upload contracts, identity verifications, tax forms, or offer letters to store them securely.</p>
                        <button
                          type="button"
                          onClick={() => setIsUploadOpen(true)}
                          className="mt-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload Document</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2.5 py-4 max-w-sm mx-auto">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                          <Search className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-800 text-xs">No Matching Documents</p>
                        <p className="text-[11px] text-slate-400">No compliance files match &quot;{searchTerm || category}&quot;.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setCategory('ALL');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear Filters</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-bold text-slate-900 leading-tight truncate">{doc.title}</span>
                          <span className="text-[11px] font-normal text-slate-400 font-mono truncate block" title={doc.fileName || doc.id}>
                            {doc.fileName || doc.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      <span className="block font-semibold text-slate-900">{doc.userName || doc.employeeName || '—'}</span>
                      {doc.companyName && (
                        <span className="text-[10px] text-slate-400 block">{doc.companyName}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {doc.uploadedByName || 'Self'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {doc.fileType || (doc.mimeType ? doc.mimeType.split('/').pop()?.toUpperCase() : 'PDF')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium">{doc.uploadDate}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] flex items-center gap-1 w-fit ${
                          doc.verificationStatus === 'Verified' || doc.verificationStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : doc.verificationStatus === 'Pending'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {(doc.verificationStatus === 'Verified' || doc.verificationStatus === 'Active') && <CheckCircle className="w-3 h-3" />}
                        {doc.verificationStatus || 'Verified'}
=======
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-slate-700">No documents found</p>
                      <p className="text-[11px] text-slate-400">No compliance files uploaded matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
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
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
<<<<<<< HEAD
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.fileName || doc.title}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {portalMode === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id, doc.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {portalMode === 'admin' && doc.verificationStatus === 'Pending' && (
                          <button
                            type="button"
=======
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                          title="View / Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {portalMode === 'admin' && doc.verificationStatus === 'Pending' && (
                          <button
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                            onClick={() => handleVerify(doc.id, 'Verified')}
                            className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[10px]"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
<<<<<<< HEAD
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Add Document
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Select file (PDF, Word, Images up to 10MB)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {portalMode === 'admin' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Employee
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {employees.map((emp) => {
                        const isMe = emp.id === myEmpId || emp.id === user?.id || (Boolean(emp.email) && emp.email === user?.email);
                        return (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}{isMe ? ' (You)' : ''} ({emp.employeeCode || 'EMP'} - {emp.departmentName || 'General'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Passport Copy or W-4 Form"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Document Category
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Identity">Identity Document (Passport, National ID)</option>
                    <option value="Tax">Tax Exemption / W-4 Form</option>
                    <option value="Offer Letter">Signed Offer &amp; Employment Agreement</option>
                    <option value="Education">Degree &amp; Academic Certificates</option>
                    <option value="Medical">Medical Clearance &amp; Health Insurance</option>
                    <option value="Other">Other Miscellaneous Document</option>
                  </select>
                </div>

                {/* File Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all"
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
                  <FileCheck className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">
                        Click to choose file or drag and drop
                      </span>
                      <span className="text-[10px] text-slate-400">PDF, DOC, PNG, JPG up to 10MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
=======
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in cursor-pointer overflow-y-auto"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-100 shadow-2xl relative cursor-default my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Upload Compliance Document
                </h3>
                <p className="text-xs text-slate-500">
                  Select file (PDF, Word, Images up to 10MB)
                </p>
              </div>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4 mt-5">
              {portalMode === 'admin' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.departmentName})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passport Copy or W-4 Form"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900"
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
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 transition"
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
                <FileCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
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
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-100"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
<<<<<<< HEAD
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
=======
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition cursor-pointer"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
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
