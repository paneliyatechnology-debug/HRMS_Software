'use client';

import React, { useEffect, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface DocumentsModuleProps {
  portalMode?: 'employee' | 'admin';
  currentEmployeeId?: string;
}

type DocumentRow = {
  id: string;
  companyId: string;
  companyName: string | null;
  userId: string | null;
  userName: string | null;
  uploadedBy: string | null;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string;
};

type UserOption = { id: string; firstName: string; lastName: string; role?: string };

export const DocumentsModule: React.FC<DocumentsModuleProps> = ({ portalMode = 'admin' }) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const isAdmin = portalMode === 'admin';
  const isPlatformAdmin = user?.role === 'SUPER_ADMIN';

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [scope, setScope] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState('');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [userId, setUserId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState('');

  const [selected, setSelected] = useState<DocumentRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const [docsResult, usersResult] = await Promise.all([
        api.listDocuments({
          page,
          limit,
          scope: scope || undefined,
          userId: isAdmin ? filterUserId || undefined : undefined,
          companyId: isPlatformAdmin ? filterCompanyId || undefined : undefined,
        }),
        isAdmin
          ? api.listUsers({ page: 1, limit: 50, companyId: isPlatformAdmin ? filterCompanyId || undefined : undefined }).catch(() => null)
          : Promise.resolve(null),
      ]);
      setDocuments(Array.isArray(docsResult?.data) ? docsResult.data : []);
      setTotal(Number(docsResult?.total || 0));
      setTotalPages(Math.max(1, Number(docsResult?.totalPages || 1)));
      setUsers(Array.isArray(usersResult?.data) ? usersResult.data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Documents could not be loaded.';
      setError(message);
      setDocuments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [page, limit, scope, filterUserId, filterCompanyId, isAdmin]);

  const openDocument = async (id: string) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const document = await api.getDocument(id);
      setSelected(document);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Document could not be loaded.';
      showToast({ type: 'error', title: 'Document', message });
    } finally {
      setDetailLoading(false);
    }
  };

  const uploadDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId && !file) {
      setError('Choose a file.');
      return;
    }
    if (!editingId && isPlatformAdmin && !companyId.trim()) {
      setError('Company id is required.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      if (editingId) {
        await api.updateDocument(editingId, {
          title: title.trim(),
          userId: isAdmin ? userId : undefined,
          file,
        });
        showToast({ type: 'success', title: 'Document updated', message: 'The document was saved.' });
      } else {
        await api.createDocument({
          title: title.trim(),
          file: file as File,
          userId: isAdmin ? userId || undefined : undefined,
          companyId: isPlatformAdmin ? companyId.trim() : undefined,
        });
        showToast({ type: 'success', title: 'Document saved', message: 'The file was uploaded.' });
      }
      setIsUploadOpen(false);
      setEditingId('');
      setTitle('');
      setUserId('');
      setCompanyId('');
      setFile(null);
      setPage(1);
      await loadDocuments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Document could not be uploaded.';
      setError(message);
      showToast({ type: 'error', title: 'Document was not saved', message });
    } finally {
      setUploading(false);
    }
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Documents</h2>
          <p className="text-xs text-slate-500">
            {isAdmin ? 'Leave user empty for a company file. Choose a user for an employee file.' : 'You see company files and files saved for you. You can change only files you uploaded.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId('');
            setTitle('');
            setUserId('');
            setFile(null);
            setIsUploadOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Add document
        </button>
      </div>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-700">
          Scope
          <select
            value={scope}
            onChange={(event) => {
              setScope(event.target.value);
              setPage(1);
            }}
            className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
          >
            <option value="">All</option>
            <option value="company">Company</option>
            <option value="employee">{isAdmin ? 'Employee' : 'My files'}</option>
          </select>
        </label>
        {isAdmin && (
        <>
        <label className="text-xs font-semibold text-slate-700">
          User
          <select
            value={filterUserId}
            onChange={(event) => {
              setFilterUserId(event.target.value);
              setPage(1);
            }}
            className="mt-1 block min-w-44 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
          >
            <option value="">All users</option>
            {users.map((person) => (
              <option key={person.id} value={person.id}>
                {person.firstName} {person.lastName}
              </option>
            ))}
          </select>
        </label>
        {isPlatformAdmin && (
          <label className="text-xs font-semibold text-slate-700">
            Company id
            <input
              value={filterCompanyId}
              onChange={(event) => {
                setFilterCompanyId(event.target.value);
                setPage(1);
              }}
              className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-xs"
              placeholder="Company id"
            />
          </label>
        )}
        </>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 text-slate-400">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2 text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">Loading documents...</td></tr>
            ) : documents.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No documents found.</td></tr>
            ) : documents.map((document) => (
              <tr key={document.id} className="border-b border-slate-50">
                <td className="px-3 py-3 font-semibold text-slate-800">{document.title}</td>
                <td className="px-3 py-3 text-slate-600">{document.companyName || '—'}</td>
                <td className="px-3 py-3 text-slate-600">{document.userName || 'Company'}</td>
                <td className="px-3 py-3 text-slate-600">{document.fileName}</td>
                <td className="px-3 py-3 text-slate-500">{document.mimeType}</td>
                <td className="px-3 py-3 text-right">
                  <button type="button" onClick={() => openDocument(document.id)} className="mr-2 font-semibold text-blue-700">View</button>
                  {(isAdmin || document.uploadedBy === user.id) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(document.id);
                          setTitle(document.title);
                          setUserId(document.userId || '');
                          setFile(null);
                          setIsUploadOpen(true);
                        }}
                        className="mr-2 font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Delete this document?')) return;
                          try {
                            await api.deleteDocument(document.id);
                            showToast({ type: 'success', title: 'Document deleted', message: document.title });
                            if (selected?.id === document.id) setSelected(null);
                            await loadDocuments();
                          } catch (err) {
                            const message = err instanceof Error ? err.message : 'Document could not be deleted.';
                            showToast({ type: 'error', title: 'Document was not deleted', message });
                          }
                        }}
                        className="font-semibold text-rose-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <label className="flex items-center gap-2">
            Rows
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
          <div className="flex items-center gap-2">
            <span>{rangeStart}–{rangeEnd} of {total}</span>
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="h-7 w-7 rounded-lg border border-slate-200 disabled:text-slate-300">‹</button>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">{page}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="h-7 w-7 rounded-lg border border-slate-200 disabled:text-slate-300">›</button>
          </div>
        </div>
      </div>

      {(detailLoading || selected) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileText className="h-4 w-4" /> Document
            </h3>
            <button type="button" onClick={() => setSelected(null)} className="text-slate-400"><X className="h-4 w-4" /></button>
          </div>
          {detailLoading || !selected ? (
            <p className="text-xs text-slate-400">Loading document...</p>
          ) : (
            <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <div><dt className="text-xs text-slate-400">Title</dt><dd>{selected.title}</dd></div>
              <div><dt className="text-xs text-slate-400">Company</dt><dd>{selected.companyName || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">User</dt><dd>{selected.userName || 'Company document'}</dd></div>
              <div><dt className="text-xs text-slate-400">File</dt><dd>{selected.fileName}</dd></div>
              <div><dt className="text-xs text-slate-400">Type</dt><dd>{selected.mimeType}</dd></div>
              <div><dt className="text-xs text-slate-400">Added</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd></div>
              <div className="sm:col-span-2">
                <a href={selected.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700">Open file</a>
              </div>
            </dl>
          )}
        </section>
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setIsUploadOpen(false)}>
          <form onClick={(event) => event.stopPropagation()} onSubmit={uploadDocument} className="w-full max-w-lg rounded-3xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Edit document' : 'Add document'}</h3>
              <button type="button" onClick={() => setIsUploadOpen(false)} className="text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Title <span className="text-red-500">*</span>
                <input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" placeholder="Offer letter" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                File {!editingId && <span className="text-red-500">*</span>}
                <input required={!editingId} type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-1 w-full text-xs" />
              </label>
              {isAdmin && (
              <label className="block text-xs font-semibold text-slate-700">
                User <span className="font-normal text-slate-400">(optional)</span>
                <select value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                  <option value="">Company document</option>
                  {users.map((person) => (
                    <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>
                  ))}
                </select>
              </label>
              )}
              {isPlatformAdmin && !editingId && (
                <label className="block text-xs font-semibold text-slate-700">
                  Company id <span className="text-red-500">*</span>
                  <input required value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
                </label>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
              <button type="submit" disabled={uploading} className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Save document'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
