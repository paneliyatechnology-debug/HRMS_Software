'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trash2,
  RefreshCw,
  FileText,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Candidate, JobOpening } from '../../types/hrms';

export interface BulkCandidateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCandidates: Candidate[];
  availableJobs: JobOpening[];
  onImportSuccess: (
    imported: Candidate[],
    summary: { importedCount: number; skippedCount: number; failedCount: number }
  ) => void;
}

export interface CandidateImportRow {
  id: string;
  rowIndex: number;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  experienceYears: number;
  currentCompany: string;
  skills: string[];
  source: string;
  // Validation flags
  isValid: boolean;
  isDuplicateInFile: boolean;
  isDuplicateInPipeline: boolean;
  validationErrors: string[];
  isSelected: boolean;
}

interface ColumnMapping {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  experienceYears: string;
  currentCompany: string;
  skills: string;
  source: string;
}

const HEADER_ALIASES: Record<keyof ColumnMapping, string[]> = {
  fullName: ['full name', 'fullname', 'name', 'candidate name', 'applicant name', 'candidate', 'applicant', 'person name'],
  email: ['email', 'email address', 'email id', 'e-mail', 'mail', 'emailaddress'],
  phone: ['phone', 'mobile', 'mobile number', 'phone number', 'contact', 'contact number', 'cell', 'telephone', 'mobile no', 'phone no'],
  jobTitle: ['applied position', 'position', 'job title', 'role', 'job', 'designation', 'profile', 'post', 'applying for'],
  experienceYears: ['experience', 'experience (years)', 'experience in years', 'years of experience', 'exp', 'total experience', 'yoe', 'exp years'],
  currentCompany: ['current company', 'company', 'employer', 'current employer', 'organization', 'current organization'],
  skills: ['skills', 'key skills', 'technologies', 'technical skills', 'skillset', 'tech stack', 'primary skills'],
  source: ['source', 'referral', 'hiring source', 'application source', 'channel', 'portal', 'lead source'],
};

function autoDetectColumn(headers: string[], targetField: keyof ColumnMapping): string {
  const aliases = HEADER_ALIASES[targetField] || [];
  for (const header of headers) {
    const clean = header.trim().toLowerCase();
    if (aliases.some((alias) => clean === alias || clean.includes(alias))) {
      return header;
    }
  }
  return '';
}

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export const BulkCandidateImportModal: React.FC<BulkCandidateImportModalProps> = ({
  isOpen,
  onClose,
  existingCandidates,
  availableJobs,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<Record<string, any>[]>([]);

  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    experienceYears: '',
    currentCompany: '',
    skills: '',
    source: '',
  });

  const [parsedRows, setParsedRows] = useState<CandidateImportRow[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'duplicate' | 'error'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setFile(null);
      setIsParsing(false);
      setIsImporting(false);
      setParseError(null);
      setRawHeaders([]);
      setRawDataRows([]);
      setParsedRows([]);
      setFilterTab('all');
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isImporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isImporting, onClose]);

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    try {
      const wb = XLSX.utils.book_new();
      const sampleData = [
        [
          'Full Name',
          'Email Address',
          'Mobile Number',
          'Applied Position',
          'Experience (Years)',
          'Current Company',
          'Key Skills',
          'Source',
        ],
        [
          'Aarav Sharma',
          'aarav.sharma@example.com',
          '+91 98765 43210',
          availableJobs[0]?.title || 'Full Stack Engineer',
          4,
          'Tech Innovations Ltd',
          'React, TypeScript, Node.js',
          'LinkedIn',
        ],
        [
          'Pooja Patel',
          'pooja.patel@example.com',
          '+91 98765 43211',
          availableJobs[1]?.title || 'UI/UX Product Designer',
          3,
          'Creative Studio Inc',
          'Figma, Wireframing, User Research',
          'Naukri.com',
        ],
        [
          'Rohan Mehta',
          'rohan.mehta@example.com',
          '+91 98765 43212',
          availableJobs[2]?.title || 'DevOps & Cloud Engineer',
          5,
          'Cloud Solutions Corp',
          'Docker, Kubernetes, AWS, CI/CD',
          'Direct Referral',
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(sampleData);
      ws['!cols'] = [
        { wch: 18 }, // Full Name
        { wch: 28 }, // Email Address
        { wch: 18 }, // Mobile Number
        { wch: 24 }, // Applied Position
        { wch: 18 }, // Experience
        { wch: 24 }, // Current Company
        { wch: 32 }, // Key Skills
        { wch: 16 }, // Source
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
      XLSX.writeFile(wb, 'Candidate_Import_Sample_Template.xlsx');
    } catch (err: any) {
      console.error('Failed to generate sample template:', err);
    }
  };

  // Process uploaded file (SheetJS XLSX)
  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    setParseError(null);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = uploadedFile.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      setParseError('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file.');
      setIsParsing(false);
      return;
    }

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('The uploaded spreadsheet contains no sheets.');
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert sheet to json array of objects
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonData || jsonData.length === 0) {
        throw new Error('The uploaded file is empty or does not contain any valid data rows.');
      }

      // Extract raw header keys from first row
      const detectedHeaders = Object.keys(jsonData[0] || {});
      if (detectedHeaders.length === 0) {
        throw new Error('No column headers detected in the uploaded file.');
      }

      setRawHeaders(detectedHeaders);
      setRawDataRows(jsonData);

      // Auto-detect column mapping based on aliases
      const initialMapping: ColumnMapping = {
        fullName: autoDetectColumn(detectedHeaders, 'fullName'),
        email: autoDetectColumn(detectedHeaders, 'email'),
        phone: autoDetectColumn(detectedHeaders, 'phone'),
        jobTitle: autoDetectColumn(detectedHeaders, 'jobTitle'),
        experienceYears: autoDetectColumn(detectedHeaders, 'experienceYears'),
        currentCompany: autoDetectColumn(detectedHeaders, 'currentCompany'),
        skills: autoDetectColumn(detectedHeaders, 'skills'),
        source: autoDetectColumn(detectedHeaders, 'source'),
      };

      setColumnMapping(initialMapping);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError(err.message || 'Failed to read spreadsheet file. Please check file format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Evaluate and validate rows whenever rawDataRows or columnMapping changes
  const evaluateRows = (
    data: Record<string, any>[],
    mapping: ColumnMapping,
    existingCands: Candidate[]
  ): CandidateImportRow[] => {
    const fileSeenEmails = new Set<string>();
    const pipelineEmails = new Set(
      existingCands.map((c) => (c.email || '').toLowerCase().trim())
    );

    return data.map((row, idx) => {
      const fullName = String(mapping.fullName ? row[mapping.fullName] : '').trim();
      const rawEmail = String(mapping.email ? row[mapping.email] : '').trim();
      const emailLower = rawEmail.toLowerCase();
      const phone = String(mapping.phone ? row[mapping.phone] : '').trim();
      const jobTitle = String(
        mapping.jobTitle ? row[mapping.jobTitle] : availableJobs[0]?.title || 'Software Engineer'
      ).trim();

      const rawExp = mapping.experienceYears ? row[mapping.experienceYears] : 0;
      const parsedExp = isNaN(Number(rawExp)) ? 0 : Math.max(0, Number(rawExp));
      const currentCompany = String(mapping.currentCompany ? row[mapping.currentCompany] : '').trim();

      const rawSkills = String(mapping.skills ? row[mapping.skills] : '').trim();
      const skills = rawSkills
        ? rawSkills.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
        : [];
      const source = String(mapping.source ? row[mapping.source] : 'Excel Import').trim();

      const errors: string[] = [];
      let isDupFile = false;
      let isDupPipeline = false;

      // 1. Full Name required
      if (!fullName) {
        errors.push('Candidate name is required');
      }

      // 2. Email validation & duplicate detection
      if (!rawEmail) {
        errors.push('Email address is required');
      } else if (!isValidEmail(rawEmail)) {
        errors.push('Invalid email address format');
      } else {
        if (fileSeenEmails.has(emailLower)) {
          isDupFile = true;
          errors.push('Duplicate email within uploaded file');
        } else {
          fileSeenEmails.add(emailLower);
        }

        if (pipelineEmails.has(emailLower)) {
          isDupPipeline = true;
          errors.push('Email already exists in candidate pipeline');
        }
      }

      // 3. Mobile / Phone validation
      if (!phone) {
        errors.push('Mobile number is required');
      } else {
        const cleanDigits = phone.replace(/[^0-9+]/g, '');
        if (cleanDigits.length < 7) {
          errors.push('Mobile number must have at least 7 digits');
        }
      }

      // 4. Applied Position validation
      if (!jobTitle) {
        errors.push('Applied position is required');
      }

      const isValid = errors.length === 0;

      return {
        id: `row-${idx}-${Date.now()}`,
        rowIndex: idx + 1,
        fullName,
        email: rawEmail,
        phone,
        jobTitle,
        experienceYears: parsedExp,
        currentCompany,
        skills,
        source,
        isValid,
        isDuplicateInFile: isDupFile,
        isDuplicateInPipeline: isDupPipeline,
        validationErrors: errors,
        isSelected: isValid, // Pre-select valid rows by default
      };
    });
  };

  // Proceed from Upload/Mapping to Preview Table
  const handleProceedToPreview = () => {
    if (!columnMapping.fullName || !columnMapping.email || !columnMapping.phone || !columnMapping.jobTitle) {
      setParseError('Please map all required fields: Candidate Name, Email, Mobile Number, and Applied Position.');
      return;
    }
    setParseError(null);
    const evaluated = evaluateRows(rawDataRows, columnMapping, existingCandidates);
    setParsedRows(evaluated);
    setStep('preview');
  };

  // Summary counts
  const summaryCounts = useMemo(() => {
    const total = parsedRows.length;
    const valid = parsedRows.filter((r) => r.isValid).length;
    const duplicates = parsedRows.filter((r) => r.isDuplicateInFile || r.isDuplicateInPipeline).length;
    const errors = parsedRows.filter((r) => !r.isValid && !r.isDuplicateInFile && !r.isDuplicateInPipeline).length;
    const selected = parsedRows.filter((r) => r.isSelected && r.isValid).length;
    return { total, valid, duplicates, errors, selected };
  }, [parsedRows]);

  // Filtered rows for preview table display
  const displayedRows = useMemo(() => {
    switch (filterTab) {
      case 'valid':
        return parsedRows.filter((r) => r.isValid);
      case 'duplicate':
        return parsedRows.filter((r) => r.isDuplicateInFile || r.isDuplicateInPipeline);
      case 'error':
        return parsedRows.filter((r) => !r.isValid);
      default:
        return parsedRows;
    }
  }, [parsedRows, filterTab]);

  // Toggle single row selection
  const handleToggleRow = (rowId: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === rowId && r.isValid ? { ...r, isSelected: !r.isSelected } : r))
    );
  };

  // Toggle all valid rows selection
  const handleToggleAllValid = (selectAll: boolean) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.isValid ? { ...r, isSelected: selectAll } : r))
    );
  };

  // Final Import Action: frontend-only application state
  const handleConfirmImport = () => {
    const selectedValidRows = parsedRows.filter((r) => r.isSelected && r.isValid);
    if (selectedValidRows.length === 0) return;

    setIsImporting(true);

    try {
      const todayDate = new Date().toISOString().split('T')[0];

      const newCandidates: Candidate[] = selectedValidRows.map((r, i) => {
        // Match with existing job opening title if available
        const matchedJob = availableJobs.find(
          (j) => j.title.toLowerCase().trim() === r.jobTitle.toLowerCase().trim()
        ) || availableJobs[0];

        return {
          id: `cand-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          jobId: matchedJob?.id || 'job-import',
          jobTitle: r.jobTitle || matchedJob?.title || 'Software Engineer',
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          resumeUrl: '',
          experienceYears: Number(r.experienceYears) || 0,
          currentCompany: r.currentCompany || '',
          skills: r.skills.length > 0 ? r.skills : ['Communication', 'Problem Solving'],
          source: r.source || 'Bulk Excel Import',
          status: 'Applied', // Strictly auto-assigned to Applied stage!
          appliedDate: todayDate,
          rating: 4,
          notes: 'Imported via browser Excel/CSV bulk parser in active session.',
        };
      });

      const summary = {
        importedCount: newCandidates.length,
        skippedCount: parsedRows.filter((r) => r.isDuplicateInFile || r.isDuplicateInPipeline).length,
        failedCount: parsedRows.filter((r) => !r.isValid && !r.isDuplicateInFile && !r.isDuplicateInPipeline).length,
      };

      onImportSuccess(newCandidates, summary);
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isImporting) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  Bulk Candidate Import
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                  {step === 'upload' ? 'Step 1: Upload & Map' : 'Step 2: Review & Validate'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Upload Excel (.xlsx, .xls) or CSV files to quickly onboard candidates into recruitment pipeline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadSample}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Download Sample Excel Spreadsheet Template"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Sample Template</span>
            </button>

            <button
              type="button"
              disabled={isImporting}
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto [scrollbar-width:thin] flex-1 space-y-5">
          {/* STEP 1: Upload & Column Mapping */}
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Dropzone */}
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    isDragging
                      ? 'border-[#2d6a4f] bg-[#d8f3dc]/30 scale-[0.99]'
                      : 'border-[#ced4da] hover:border-[#2d6a4f] bg-[#f8f9fa] hover:bg-[#d8f3dc]/15'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#dee2e6] text-[#2d6a4f] flex items-center justify-center shadow-xs mb-3">
                    <Upload className="w-7 h-7 text-[#2d6a4f]" />
                  </div>
                  <h3 className="text-sm font-extrabold text-[#212529]">
                    Drop your spreadsheet here, or <span className="text-[#2d6a4f] underline">browse</span>
                  </h3>
                  <p className="text-xs text-[#6c757d] mt-1 max-w-sm">
                    Supports Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) and <strong>.csv</strong> files.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[#495057]">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#dee2e6]">.XLSX</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#dee2e6]">.CSV</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#dee2e6]">Browser Parsed</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#dee2e6]">Zero Server Upload</span>
                  </div>
                </div>
              ) : (
                /* File Selected Banner */
                <div className="p-4 rounded-2xl bg-[#d8f3dc]/40 border border-[#95d5b2] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1b4332] text-white flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5 text-[#95d5b2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#081c15] truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-[#2d6a4f]">
                        {(file.size / 1024).toFixed(1)} KB &bull; {rawDataRows.length} data rows found &bull; {rawHeaders.length} columns detected
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setRawHeaders([]);
                        setRawDataRows([]);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#ced4da] bg-white text-xs font-semibold text-[#495057] hover:text-rose-600 hover:border-rose-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Change File</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Parsing Loader */}
              {isParsing && (
                <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-[#dee2e6] text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2d6a4f] mx-auto" />
                  <p className="text-xs font-bold text-[#212529]">Parsing spreadsheet data in browser...</p>
                </div>
              )}

              {/* Parse Error Alert */}
              {parseError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Import Notice</strong>
                    <span>{parseError}</span>
                  </div>
                </div>
              )}

              {/* Column Mapping Section (Visible after file parsed) */}
              {file && rawHeaders.length > 0 && !isParsing && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#e9ecef]">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#212529] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#2d6a4f]" />
                        <span>Map Spreadsheet Columns to Candidate Fields</span>
                      </h3>
                      <p className="text-[11px] text-[#6c757d]">
                        We matched columns automatically. Review and adjust any dropdowns below.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      className="text-[11px] font-bold text-[#2d6a4f] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Sample Template</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    {/* Full Name */}
                    <div>
                      <label className="block font-bold text-[#212529] mb-1">
                        Candidate Name <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={columnMapping.fullName}
                        onChange={(e) => setColumnMapping({ ...columnMapping, fullName: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] font-semibold text-[#212529] focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
                      >
                        <option value="">-- Select Sheet Column --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-[#6c757d] mt-0.5 block">Full name of the candidate</span>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-bold text-[#212529] mb-1">
                        Email Address <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={columnMapping.email}
                        onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] font-semibold text-[#212529] focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
                      >
                        <option value="">-- Select Sheet Column --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-[#6c757d] mt-0.5 block">Used for communication and duplicate checking</span>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block font-bold text-[#212529] mb-1">
                        Mobile Number <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={columnMapping.phone}
                        onChange={(e) => setColumnMapping({ ...columnMapping, phone: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] font-semibold text-[#212529] focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
                      >
                        <option value="">-- Select Sheet Column --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-[#6c757d] mt-0.5 block">Direct candidate contact number</span>
                    </div>

                    {/* Applied Position */}
                    <div>
                      <label className="block font-bold text-[#212529] mb-1">
                        Applied Position <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={columnMapping.jobTitle}
                        onChange={(e) => setColumnMapping({ ...columnMapping, jobTitle: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] font-semibold text-[#212529] focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
                      >
                        <option value="">-- Select Sheet Column --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-[#6c757d] mt-0.5 block">Role/job opening applied for</span>
                    </div>

                    {/* Experience in Years */}
                    <div>
                      <label className="block font-bold text-[#495057] mb-1">
                        Experience in Years (Optional)
                      </label>
                      <select
                        value={columnMapping.experienceYears}
                        onChange={(e) => setColumnMapping({ ...columnMapping, experienceYears: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] font-semibold text-[#212529] focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
                      >
                        <option value="">-- None / Skip --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Current Company */}
                    <div>
                      <label className="block font-bold text-[#495057] mb-1">
                        Current Company (Optional)
                      </label>
                      <select
                        value={columnMapping.currentCompany}
                        onChange={(e) => setColumnMapping({ ...columnMapping, currentCompany: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] font-semibold text-[#212529] focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
                      >
                        <option value="">-- None / Skip --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Key Skills */}
                    <div>
                      <label className="block font-bold text-[#495057] mb-1">
                        Key Skills (Optional)
                      </label>
                      <select
                        value={columnMapping.skills}
                        onChange={(e) => setColumnMapping({ ...columnMapping, skills: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] font-semibold text-[#212529] focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
                      >
                        <option value="">-- None / Skip --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Source */}
                    <div>
                      <label className="block font-bold text-[#495057] mb-1">
                        Application Source (Optional)
                      </label>
                      <select
                        value={columnMapping.source}
                        onChange={(e) => setColumnMapping({ ...columnMapping, source: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-[#dee2e6] bg-[#f8f9fa] font-semibold text-[#212529] focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
                      >
                        <option value="">-- None / Default (Excel Import) --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Preview & Validation Table */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary KPIs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dee2e6]">
                  <span className="text-[10px] font-bold uppercase text-[#6c757d] block">Total Rows</span>
                  <p className="text-lg font-black text-[#212529] mt-0.5">{summaryCounts.total}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#d8f3dc]/50 border border-[#95d5b2]">
                  <span className="text-[10px] font-bold uppercase text-[#1b4332] block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#2d6a4f]" /> Valid &amp; Ready
                  </span>
                  <p className="text-lg font-black text-[#1b4332] mt-0.5">{summaryCounts.valid}</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> Duplicates
                  </span>
                  <p className="text-lg font-black text-amber-900 mt-0.5">{summaryCounts.duplicates}</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] font-bold uppercase text-rose-800 block flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-600" /> Errors
                  </span>
                  <p className="text-lg font-black text-rose-900 mt-0.5">{summaryCounts.errors}</p>
                </div>
              </div>

              {/* Informative Disclaimer */}
              <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] text-[#495057] text-[11px] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#2d6a4f] shrink-0" />
                <span>
                  Candidates will be automatically placed into the <strong>Applied</strong> pipeline stage in application state.
                </span>
              </div>

              {/* Table Filter Tabs & Bulk Selection */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterTab === 'all'
                        ? 'bg-[#1b4332] text-white shadow-xs'
                        : 'text-[#495057] hover:text-[#1b4332]'
                    }`}
                  >
                    All ({summaryCounts.total})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterTab('valid')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterTab === 'valid'
                        ? 'bg-[#1b4332] text-white shadow-xs'
                        : 'text-[#495057] hover:text-[#1b4332]'
                    }`}
                  >
                    Valid ({summaryCounts.valid})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterTab('duplicate')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterTab === 'duplicate'
                        ? 'bg-[#1b4332] text-white shadow-xs'
                        : 'text-[#495057] hover:text-[#1b4332]'
                    }`}
                  >
                    Duplicates ({summaryCounts.duplicates})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterTab('error')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterTab === 'error'
                        ? 'bg-[#1b4332] text-white shadow-xs'
                        : 'text-[#495057] hover:text-[#1b4332]'
                    }`}
                  >
                    Errors ({summaryCounts.errors})
                  </button>
                </div>

                {summaryCounts.valid > 0 && (
                  <div className="flex items-center gap-2 text-xs font-bold text-[#212529]">
                    <button
                      type="button"
                      onClick={() => handleToggleAllValid(summaryCounts.selected !== summaryCounts.valid)}
                      className="px-2.5 py-1 rounded-lg border border-[#ced4da] hover:bg-[#f8f9fa] text-[11px] cursor-pointer"
                    >
                      {summaryCounts.selected === summaryCounts.valid ? 'Deselect All' : 'Select All Valid'}
                    </button>
                    <span className="text-[11px] text-[#2d6a4f]">
                      {summaryCounts.selected} of {summaryCounts.valid} selected
                    </span>
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="border border-[#dee2e6] rounded-xl overflow-hidden bg-white max-h-[360px] overflow-y-auto [scrollbar-width:thin]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f8f9fa] border-b border-[#dee2e6] sticky top-0 z-10 text-[11px] font-bold text-[#495057] uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={summaryCounts.selected > 0 && summaryCounts.selected === summaryCounts.valid}
                          onChange={(e) => handleToggleAllValid(e.target.checked)}
                          disabled={summaryCounts.valid === 0}
                          className="rounded text-[#2d6a4f] focus:ring-[#2d6a4f] cursor-pointer disabled:opacity-50"
                        />
                      </th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Candidate Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Mobile</th>
                      <th className="p-2.5">Applied Position</th>
                      <th className="p-2.5">Exp</th>
                      <th className="p-2.5">Validation Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9ecef]">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-xs text-[#6c757d]">
                          No records found under this filter.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`transition-colors ${
                            !row.isValid
                              ? 'bg-rose-50/40'
                              : row.isSelected
                                ? 'bg-[#d8f3dc]/25'
                                : 'hover:bg-[#f8f9fa]'
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={row.isSelected}
                              disabled={!row.isValid}
                              onChange={() => handleToggleRow(row.id)}
                              className="rounded text-[#2d6a4f] focus:ring-[#2d6a4f] cursor-pointer disabled:opacity-40"
                            />
                          </td>

                          <td className="p-2.5 whitespace-nowrap">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d8f3dc] text-[#1b4332] border border-[#95d5b2]">
                                <Check className="w-3 h-3 text-[#2d6a4f]" /> Valid
                              </span>
                            ) : row.isDuplicateInFile || row.isDuplicateInPipeline ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" /> Invalid
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 font-bold text-[#212529] max-w-[140px] truncate" title={row.fullName}>
                            {row.fullName || <span className="text-rose-500 italic">Missing</span>}
                          </td>

                          <td className="p-2.5 text-[#495057] max-w-[160px] truncate" title={row.email}>
                            {row.email || <span className="text-rose-500 italic">Missing</span>}
                          </td>

                          <td className="p-2.5 text-[#495057] whitespace-nowrap">
                            {row.phone || <span className="text-rose-500 italic">Missing</span>}
                          </td>

                          <td className="p-2.5 text-[#212529] font-medium max-w-[140px] truncate" title={row.jobTitle}>
                            {row.jobTitle || <span className="text-rose-500 italic">Missing</span>}
                          </td>

                          <td className="p-2.5 text-[#495057] whitespace-nowrap font-mono text-[11px]">
                            {row.experienceYears}y
                          </td>

                          <td className="p-2.5 text-[11px]">
                            {row.validationErrors.length > 0 ? (
                              <div className="text-rose-600 font-semibold line-clamp-1" title={row.validationErrors.join(', ')}>
                                {row.validationErrors.join(' • ')}
                              </div>
                            ) : (
                              <span className="text-[#2d6a4f] font-semibold flex items-center gap-1">
                                Ready for Applied stage
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div>
            {step === 'preview' && (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Mapping</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isImporting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            {step === 'upload' ? (
              <button
                type="button"
                disabled={!file || rawHeaders.length === 0 || isParsing}
                onClick={handleProceedToPreview}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={summaryCounts.selected === 0 || isImporting}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Import {summaryCounts.selected} Valid Candidates</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
